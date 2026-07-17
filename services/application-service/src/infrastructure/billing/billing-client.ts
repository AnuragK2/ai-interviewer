import type { BillingEntitlementResponse } from "@ai-interviewer/api-types";
import { env } from "../../config/env";

export class BillingGateError extends Error {
  constructor(
    message: string,
    readonly statusCode = 403,
    readonly code = "BILLING_LOCKED",
    readonly lockedReason?: string | null,
  ) {
    super(message);
    this.name = "BillingGateError";
  }
}

async function fetchOpenJobCount(companyId: string): Promise<number> {
  try {
    const response = await fetch(
      `${env.jobServiceUrl}/api/v1/jobs/_internal/open-count/${encodeURIComponent(companyId)}`,
      { headers: { "x-internal-service-key": env.internalServiceKey } },
    );
    if (!response.ok) {
      console.error("[billing] open-job count failed:", await response.text());
      return 0;
    }
    const payload = (await response.json()) as { openJobs?: number };
    return typeof payload.openJobs === "number" ? payload.openJobs : 0;
  } catch (error) {
    console.error("[billing] open-job count request failed:", error);
    return 0;
  }
}

async function fetchEntitlement(companyId: string, openJobs = 0): Promise<BillingEntitlementResponse> {
  const url = new URL(
    `${env.billingServiceUrl}/api/v1/internal/billing/entitlement/${encodeURIComponent(companyId)}`,
  );
  url.searchParams.set("openJobs", String(openJobs));

  const response = await fetch(url, {
    headers: {
      "x-internal-service-key": env.internalServiceKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new BillingGateError(`Billing service unavailable: ${text}`, 503, "BILLING_UNAVAILABLE");
  }

  return (await response.json()) as BillingEntitlementResponse;
}

export async function assertRecruiterWritable(
  companyId: string,
  openJobs: number | undefined = undefined,
  action: "write" | "invite" | "open_job" = "write",
) {
  const resolvedOpenJobs = openJobs ?? (await fetchOpenJobCount(companyId));
  const entitlement = await fetchEntitlement(companyId, resolvedOpenJobs);
  const allowed =
    action === "invite"
      ? entitlement.canInvite && entitlement.writable
      : action === "open_job"
        ? entitlement.canCreateOpenJob && entitlement.writable
        : entitlement.writable;

  if (!allowed) {
    throw new BillingGateError(
      entitlement.lockedReason
        ? `Billing locked: ${entitlement.lockedReason}. Upgrade your plan to continue.`
        : "Recruiter workspace is read-only due to billing limits.",
      403,
      "BILLING_LOCKED",
      entitlement.lockedReason,
    );
  }

  return entitlement;
}

export async function recordInterviewInviteUsage(companyId: string) {
  try {
    const response = await fetch(`${env.billingServiceUrl}/api/v1/internal/billing/usage/interview-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-key": env.internalServiceKey,
      },
      body: JSON.stringify({ companyId }),
    });
    if (!response.ok) {
      console.error("[billing] usage increment failed:", await response.text());
    }
  } catch (error) {
    console.error("[billing] usage increment request failed:", error);
  }
}
