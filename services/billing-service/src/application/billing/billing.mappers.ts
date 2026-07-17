import type {
  BillingInterval,
  BillingLockedReason,
  BillingMeResponse,
  BillingPlanResponse,
  BillingUsageResponse,
  PlanTier,
  SubscriptionStatus,
} from "@ai-interviewer/api-types";
import type { Plan, TenantSubscription, UsagePeriod } from "../../../lib/generated/prisma/client";

export const PLAN_DEFAULTS: Record<
  PlanTier,
  { maxOpenJobs: number; maxInterviewInvites: number; maxRecruiters: number; priceByInterval: Record<BillingInterval, number> }
> = {
  FREE: {
    maxOpenJobs: 1,
    maxInterviewInvites: 5,
    maxRecruiters: 2,
    priceByInterval: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 },
  },
  PRO: {
    maxOpenJobs: 10,
    maxInterviewInvites: 50,
    maxRecruiters: 10,
    priceByInterval: { MONTHLY: 299900, QUARTERLY: 799900, YEARLY: 2999900 },
  },
  BUSINESS: {
    maxOpenJobs: 100,
    maxInterviewInvites: 500,
    maxRecruiters: 50,
    priceByInterval: { MONTHLY: 999900, QUARTERLY: 2699900, YEARLY: 9999900 },
  },
};

export function addInterval(from: Date, interval: BillingInterval): Date {
  const next = new Date(from);
  switch (interval) {
    case "MONTHLY":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "QUARTERLY":
      next.setUTCMonth(next.getUTCMonth() + 3);
      break;
    case "YEARLY":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }
  return next;
}

export function periodBoundsForInterval(interval: BillingInterval, now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  // Free tier meters on calendar month; paid plans use subscription period when available
  if (interval === "MONTHLY") {
    return { start, end: addInterval(start, "MONTHLY") };
  }
  if (interval === "QUARTERLY") {
    const quarterMonth = Math.floor(now.getUTCMonth() / 3) * 3;
    const qStart = new Date(Date.UTC(now.getUTCFullYear(), quarterMonth, 1, 0, 0, 0, 0));
    return { start: qStart, end: addInterval(qStart, "QUARTERLY") };
  }
  const yStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  return { start: yStart, end: addInterval(yStart, "YEARLY") };
}

export function toPlanResponse(plan: Plan): BillingPlanResponse {
  return {
    id: plan.id,
    tier: plan.tier as PlanTier,
    interval: plan.interval as BillingInterval,
    pricePaise: plan.pricePaise,
    currency: plan.currency,
    maxOpenJobs: plan.maxOpenJobs,
    maxInterviewInvites: plan.maxInterviewInvites,
    maxRecruiters: plan.maxRecruiters,
    active: plan.active,
  };
}

export function toUsageResponse(usage: UsagePeriod, plan: Plan, openJobs?: number): BillingUsageResponse {
  return {
    periodStart: usage.periodStart.toISOString(),
    periodEnd: usage.periodEnd.toISOString(),
    interviewInvites: usage.interviewInvites,
    maxInterviewInvites: plan.maxInterviewInvites,
    openJobs,
    maxOpenJobs: plan.maxOpenJobs,
  };
}

export type EntitlementComputation = {
  writable: boolean;
  lockedReason: BillingLockedReason | null;
  canCreateOpenJob: boolean;
  canInvite: boolean;
};

export function computeEntitlement(input: {
  status: SubscriptionStatus;
  plan: Plan;
  usage: UsagePeriod;
  openJobs: number;
  now?: Date;
}): EntitlementComputation {
  const now = input.now ?? new Date();
  const status = input.status;

  if (status === "PAST_DUE") {
    return { writable: false, lockedReason: "PAST_DUE", canCreateOpenJob: false, canInvite: false };
  }
  if (status === "CANCELLED") {
    return { writable: false, lockedReason: "CANCELLED", canCreateOpenJob: false, canInvite: false };
  }
  if (status === "EXPIRED") {
    return { writable: false, lockedReason: "EXPIRED", canCreateOpenJob: false, canInvite: false };
  }
  if (status === "PENDING") {
    return { writable: false, lockedReason: "PENDING", canCreateOpenJob: false, canInvite: false };
  }

  // FREE_ACTIVE or ACTIVE
  if (status === "ACTIVE") {
    // paid plans should have a period end; if expired, lock
    // (period dates come from subscription; usage period is separate)
  }

  const overInvites = input.usage.interviewInvites >= input.plan.maxInterviewInvites;
  const overJobs = input.openJobs >= input.plan.maxOpenJobs;

  if (overInvites || overJobs) {
    return {
      writable: false,
      lockedReason: "OVER_LIMIT",
      canCreateOpenJob: !overJobs && !overInvites,
      canInvite: !overInvites && !overJobs,
    };
  }

  return {
    writable: true,
    lockedReason: null,
    canCreateOpenJob: input.openJobs < input.plan.maxOpenJobs,
    canInvite: input.usage.interviewInvites < input.plan.maxInterviewInvites,
  };
}

export function toMeResponse(input: {
  companyId: string;
  sub: TenantSubscription;
  plan: Plan;
  usage: UsagePeriod;
  openJobs: number;
  razorpayKeyId: string | null;
}): BillingMeResponse {
  const entitlement = computeEntitlement({
    status: input.sub.status as SubscriptionStatus,
    plan: input.plan,
    usage: input.usage,
    openJobs: input.openJobs,
  });

  return {
    companyId: input.companyId,
    plan: toPlanResponse(input.plan),
    status: input.sub.status as SubscriptionStatus,
    writable: entitlement.writable,
    lockedReason: entitlement.lockedReason ?? (input.sub.lockedReason as BillingLockedReason | null),
    currentPeriodStart: input.sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: input.sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: input.sub.cancelAtPeriodEnd,
    usage: toUsageResponse(input.usage, input.plan, input.openJobs),
    razorpayKeyId: input.razorpayKeyId,
  };
}
