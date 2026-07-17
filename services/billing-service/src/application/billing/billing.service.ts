import type {
  BillingCheckoutResponse,
  BillingEntitlementResponse,
  BillingMeResponse,
  BillingPlanResponse,
  BillingVerifyRequest,
  PlanTier,
  SubscriptionStatus,
} from "@ai-interviewer/api-types";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env";
import { prisma } from "../../infrastructure/db/prisma.client";
import { getRazorpayClient } from "../../infrastructure/razorpay/razorpay.client";
import {
  PLAN_DEFAULTS,
  addInterval,
  computeEntitlement,
  periodBoundsForInterval,
  toMeResponse,
  toPlanResponse,
} from "./billing.mappers";

export class BillingError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
    readonly code?: string,
  ) {
    super(message);
    this.name = "BillingError";
  }
}

const TIERS: PlanTier[] = ["FREE", "PRO", "BUSINESS"];
const INTERVALS = ["MONTHLY", "QUARTERLY", "YEARLY"] as const;

function razorpayPlanEnvKey(tier: PlanTier, interval: (typeof INTERVALS)[number]): string | undefined {
  if (tier === "FREE") return undefined;
  const key = `${tier}_${interval}` as keyof typeof env.razorpayPlanIds;
  return env.razorpayPlanIds[key];
}

export async function ensurePlansSeeded() {
  for (const tier of TIERS) {
    for (const interval of INTERVALS) {
      if (tier === "FREE" && interval !== "MONTHLY") continue;

      const defaults = PLAN_DEFAULTS[tier];
      await prisma.plan.upsert({
        where: { tier_interval: { tier, interval } },
        create: {
          tier,
          interval,
          razorpayPlanId: razorpayPlanEnvKey(tier, interval) ?? null,
          pricePaise: defaults.priceByInterval[interval],
          maxOpenJobs: defaults.maxOpenJobs,
          maxInterviewInvites: defaults.maxInterviewInvites,
          maxRecruiters: defaults.maxRecruiters,
          active: true,
        },
        update: {
          razorpayPlanId: razorpayPlanEnvKey(tier, interval) ?? undefined,
          pricePaise: defaults.priceByInterval[interval],
          maxOpenJobs: defaults.maxOpenJobs,
          maxInterviewInvites: defaults.maxInterviewInvites,
          maxRecruiters: defaults.maxRecruiters,
          active: true,
        },
      });
    }
  }
}

async function getFreePlan() {
  const plan = await prisma.plan.findUnique({
    where: { tier_interval: { tier: "FREE", interval: "MONTHLY" } },
  });
  if (!plan) {
    throw new BillingError("Free plan not seeded.", 500);
  }
  return plan;
}

export async function ensureFreeSubscription(companyId: string) {
  await ensurePlansSeeded();
  const freePlan = await getFreePlan();
  const bounds = periodBoundsForInterval("MONTHLY");

  const existing = await prisma.tenantSubscription.findUnique({ where: { companyId } });
  if (!existing) {
    await prisma.tenantSubscription.create({
      data: {
        companyId,
        planId: freePlan.id,
        status: "FREE_ACTIVE",
        currentPeriodStart: bounds.start,
        currentPeriodEnd: bounds.end,
        lockedReason: null,
      },
    });
  }

  await prisma.usagePeriod.upsert({
    where: {
      companyId_periodStart: {
        companyId,
        periodStart: bounds.start,
      },
    },
    create: {
      companyId,
      periodStart: bounds.start,
      periodEnd: bounds.end,
      interviewInvites: 0,
    },
    update: {},
  });

  return getBillingMe(companyId, 0);
}

async function getOrCreateUsagePeriod(
  companyId: string,
  interval: "MONTHLY" | "QUARTERLY" | "YEARLY",
  periodStart?: Date | null,
  periodEnd?: Date | null,
) {
  const bounds =
    periodStart && periodEnd
      ? { start: periodStart, end: periodEnd }
      : periodBoundsForInterval(interval);

  return prisma.usagePeriod.upsert({
    where: {
      companyId_periodStart: {
        companyId,
        periodStart: bounds.start,
      },
    },
    create: {
      companyId,
      periodStart: bounds.start,
      periodEnd: bounds.end,
      interviewInvites: 0,
    },
    update: {
      periodEnd: bounds.end,
    },
  });
}

export async function listPlans(): Promise<BillingPlanResponse[]> {
  await ensurePlansSeeded();
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ tier: "asc" }, { interval: "asc" }],
  });
  return plans.map(toPlanResponse);
}

export async function getBillingMe(companyId: string, openJobs = 0): Promise<BillingMeResponse> {
  await ensurePlansSeeded();
  let sub = await prisma.tenantSubscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });

  if (!sub) {
    await ensureFreeSubscription(companyId);
    sub = await prisma.tenantSubscription.findUniqueOrThrow({
      where: { companyId },
      include: { plan: true },
    });
  }

  // Expire active paid plans past period end
  if (
    sub.status === "ACTIVE" &&
    sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() < Date.now()
  ) {
    sub = await prisma.tenantSubscription.update({
      where: { companyId },
      data: { status: "EXPIRED", lockedReason: "EXPIRED" },
      include: { plan: true },
    });
  }

  const usage = await getOrCreateUsagePeriod(
    companyId,
    sub.plan.interval,
    sub.currentPeriodStart,
    sub.currentPeriodEnd,
  );

  const entitlement = computeEntitlement({
    status: sub.status as SubscriptionStatus,
    plan: sub.plan,
    usage,
    openJobs,
  });

  if (entitlement.lockedReason !== sub.lockedReason) {
    await prisma.tenantSubscription.update({
      where: { companyId },
      data: { lockedReason: entitlement.lockedReason },
    });
    sub = { ...sub, lockedReason: entitlement.lockedReason };
  }

  return toMeResponse({
    companyId,
    sub,
    plan: sub.plan,
    usage,
    openJobs,
    razorpayKeyId: env.razorpayKeyId || null,
  });
}

export async function getEntitlement(
  companyId: string,
  openJobs = 0,
): Promise<BillingEntitlementResponse> {
  const me = await getBillingMe(companyId, openJobs);
  return {
    companyId,
    writable: me.writable,
    lockedReason: me.lockedReason,
    status: me.status,
    plan: me.plan,
    usage: me.usage,
    canCreateOpenJob: me.writable && (me.usage.openJobs ?? openJobs) < me.plan.maxOpenJobs,
    canInvite: me.writable && me.usage.interviewInvites < me.plan.maxInterviewInvites,
  };
}

export async function assertWritable(companyId: string, openJobs = 0, action: "write" | "invite" | "open_job" = "write") {
  const entitlement = await getEntitlement(companyId, openJobs);
  const allowed =
    action === "invite"
      ? entitlement.canInvite && entitlement.writable
      : action === "open_job"
        ? entitlement.canCreateOpenJob && entitlement.writable
        : entitlement.writable;

  if (!allowed) {
    throw new BillingError(
      entitlement.lockedReason
        ? `Billing locked: ${entitlement.lockedReason}. Upgrade or wait for the next period.`
        : "Recruiter workspace is read-only due to billing limits.",
      403,
      "BILLING_LOCKED",
    );
  }
  return entitlement;
}

export async function recordInterviewInvite(companyId: string) {
  const me = await getBillingMe(companyId, 0);
  const usage = await getOrCreateUsagePeriod(
    companyId,
    me.plan.interval,
    me.currentPeriodStart ? new Date(me.currentPeriodStart) : null,
    me.currentPeriodEnd ? new Date(me.currentPeriodEnd) : null,
  );

  const updated = await prisma.usagePeriod.update({
    where: { id: usage.id },
    data: { interviewInvites: { increment: 1 } },
  });

  if (updated.interviewInvites >= me.plan.maxInterviewInvites) {
    await prisma.tenantSubscription.update({
      where: { companyId },
      data: { lockedReason: "OVER_LIMIT" },
    });
  }

  return getBillingMe(companyId, 0);
}

export async function createCheckout(companyId: string, planId: string): Promise<BillingCheckoutResponse> {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new BillingError("Razorpay is not configured on the server.", 503);
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) {
    throw new BillingError("Plan not found.", 404);
  }
  if (plan.tier === "FREE") {
    throw new BillingError("Free plan does not require checkout.", 400);
  }
  if (!plan.razorpayPlanId) {
    throw new BillingError(
      `Razorpay plan ID missing for ${plan.tier} ${plan.interval}. Set RAZORPAY_PLAN_${plan.tier}_${plan.interval}.`,
      503,
    );
  }

  await ensureFreeSubscription(companyId);

  const razorpay = getRazorpayClient();
  const totalCount =
    plan.interval === "MONTHLY" ? 12 : plan.interval === "QUARTERLY" ? 4 : 1;

  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpayPlanId,
    total_count: totalCount,
    customer_notify: 1,
    notes: {
      companyId,
      planId: plan.id,
      tier: plan.tier,
      interval: plan.interval,
    },
  });

  await prisma.tenantSubscription.update({
    where: { companyId },
    data: {
      planId: plan.id,
      status: "PENDING",
      lockedReason: "PENDING",
      razorpaySubscriptionId: subscription.id,
      cancelAtPeriodEnd: false,
    },
  });

  return {
    subscriptionId: subscription.id,
    keyId: env.razorpayKeyId,
    planId: plan.id,
  };
}

function verifyCheckoutSignature(input: BillingVerifyRequest): boolean {
  const body = `${input.razorpay_payment_id}|${input.razorpay_subscription_id}`;
  const expected = createHmac("sha256", env.razorpayKeySecret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(input.razorpay_signature));
  } catch {
    return false;
  }
}

export async function verifyCheckout(companyId: string, input: BillingVerifyRequest): Promise<BillingMeResponse> {
  if (!verifyCheckoutSignature(input)) {
    throw new BillingError("Invalid Razorpay signature.", 400);
  }

  const sub = await prisma.tenantSubscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });
  if (!sub) {
    throw new BillingError("Subscription not found.", 404);
  }
  if (sub.razorpaySubscriptionId && sub.razorpaySubscriptionId !== input.razorpay_subscription_id) {
    throw new BillingError("Subscription mismatch.", 400);
  }

  const now = new Date();
  const periodEnd = addInterval(now, sub.plan.interval);

  await prisma.tenantSubscription.update({
    where: { companyId },
    data: {
      status: "ACTIVE",
      lockedReason: null,
      razorpaySubscriptionId: input.razorpay_subscription_id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await getOrCreateUsagePeriod(companyId, sub.plan.interval, now, periodEnd);

  return getBillingMe(companyId, 0);
}

export async function cancelSubscription(companyId: string): Promise<BillingMeResponse> {
  const sub = await prisma.tenantSubscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });
  if (!sub) {
    throw new BillingError("Subscription not found.", 404);
  }

  if (sub.status === "FREE_ACTIVE" || sub.plan.tier === "FREE") {
    throw new BillingError("Free plan cannot be cancelled.", 400);
  }

  if (sub.razorpaySubscriptionId && env.razorpayKeyId && env.razorpayKeySecret) {
    const razorpay = getRazorpayClient();
    try {
      await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId, false);
    } catch (error) {
      console.error("[billing] razorpay cancel failed:", error);
    }
  }

  await prisma.tenantSubscription.update({
    where: { companyId },
    data: { cancelAtPeriodEnd: true },
  });

  return getBillingMe(companyId, 0);
}

export async function handleRazorpayWebhook(rawBody: string, signature: string | undefined, payload: any) {
  if (!env.razorpayWebhookSecret) {
    throw new BillingError("Webhook secret not configured.", 503);
  }
  if (!signature) {
    throw new BillingError("Missing webhook signature.", 400);
  }

  const expected = createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new BillingError("Invalid webhook signature.", 400);
    }
  } catch (error) {
    if (error instanceof BillingError) throw error;
    throw new BillingError("Invalid webhook signature.", 400);
  }

  const eventId = String(payload?.id ?? payload?.event_id ?? `${payload?.event}-${Date.now()}`);
  const eventType = String(payload?.event ?? "unknown");

  const existing = await prisma.billingEvent.findUnique({ where: { razorpayEventId: eventId } });
  if (existing) {
    return { ok: true, duplicate: true };
  }

  const subscriptionEntity = payload?.payload?.subscription?.entity;
  const companyIdFromNotes =
    typeof subscriptionEntity?.notes?.companyId === "string"
      ? subscriptionEntity.notes.companyId
      : null;

  let companyId = companyIdFromNotes;
  if (!companyId && subscriptionEntity?.id) {
    const found = await prisma.tenantSubscription.findFirst({
      where: { razorpaySubscriptionId: subscriptionEntity.id },
    });
    companyId = found?.companyId ?? null;
  }

  await prisma.billingEvent.create({
    data: {
      companyId,
      eventType,
      razorpayEventId: eventId,
      payload,
    },
  });

  if (!companyId) {
    console.warn("[billing] webhook without companyId:", eventType, eventId);
    return { ok: true, unmatched: true };
  }

  const now = new Date();

  switch (eventType) {
    case "subscription.activated":
    case "subscription.charged": {
      const sub = await prisma.tenantSubscription.findUnique({
        where: { companyId },
        include: { plan: true },
      });
      if (!sub) break;
      const periodEnd = addInterval(now, sub.plan.interval);
      await prisma.tenantSubscription.update({
        where: { companyId },
        data: {
          status: "ACTIVE",
          lockedReason: null,
          razorpaySubscriptionId: subscriptionEntity?.id ?? sub.razorpaySubscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });
      await getOrCreateUsagePeriod(companyId, sub.plan.interval, now, periodEnd);
      break;
    }
    case "subscription.pending": {
      await prisma.tenantSubscription.update({
        where: { companyId },
        data: { status: "PAST_DUE", lockedReason: "PAST_DUE" },
      });
      break;
    }
    case "subscription.halted":
    case "subscription.cancelled":
    case "subscription.completed": {
      const freePlan = await getFreePlan();
      const bounds = periodBoundsForInterval("MONTHLY");
      await prisma.tenantSubscription.update({
        where: { companyId },
        data: {
          planId: freePlan.id,
          status: eventType === "subscription.completed" ? "EXPIRED" : "CANCELLED",
          lockedReason: eventType === "subscription.completed" ? "EXPIRED" : "CANCELLED",
          razorpaySubscriptionId: null,
          cancelAtPeriodEnd: false,
          currentPeriodStart: bounds.start,
          currentPeriodEnd: bounds.end,
        },
      });
      // After cancel, drop to free but still locked until they re-subscribe if they were CANCELLED?
      // Plan says unpaid = full lock. After cancel they should be on free with free limits.
      // Re-activate as FREE_ACTIVE so they can use free tier again.
      await prisma.tenantSubscription.update({
        where: { companyId },
        data: {
          status: "FREE_ACTIVE",
          lockedReason: null,
        },
      });
      break;
    }
    default:
      break;
  }

  return { ok: true };
}
