import type {
  BillingCheckoutRequest,
  BillingCheckoutResponse,
  BillingMeResponse,
  BillingPlansResponse,
  BillingVerifyRequest,
  BillingVerifyResponse,
} from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { getAccessToken } from "@/shared/lib/auth-storage";

export class BillingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly lockedReason?: string | null,
  ) {
    super(message);
    this.name = "BillingApiError";
  }
}

async function billingFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      code?: string;
      lockedReason?: string | null;
    } | null;
    throw new BillingApiError(
      payload?.error ?? `Request failed (${response.status}).`,
      response.status,
      payload?.code,
      payload?.lockedReason,
    );
  }

  return response.json() as Promise<T>;
}

export async function getBillingMe(openJobs = 0): Promise<BillingMeResponse> {
  return billingFetch<BillingMeResponse>(`/api/v1/billing/me?openJobs=${openJobs}`);
}

export async function listBillingPlans(): Promise<BillingPlansResponse> {
  return billingFetch<BillingPlansResponse>("/api/v1/billing/plans");
}

export async function createBillingCheckout(body: BillingCheckoutRequest): Promise<BillingCheckoutResponse> {
  return billingFetch<BillingCheckoutResponse>("/api/v1/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyBillingCheckout(body: BillingVerifyRequest): Promise<BillingVerifyResponse> {
  return billingFetch<BillingVerifyResponse>("/api/v1/billing/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function cancelBillingSubscription(): Promise<BillingMeResponse> {
  return billingFetch<BillingMeResponse>("/api/v1/billing/cancel", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
