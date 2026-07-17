import { env } from "../../config/env";

/** Best-effort: provision Free tier subscription when a company tenant is created. */
export async function ensureFreeBillingSubscription(companyId: string) {
  try {
    const response = await fetch(`${env.billingServiceUrl}/api/v1/internal/billing/ensure-free`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-key": env.internalServiceKey,
      },
      body: JSON.stringify({ companyId }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`[billing] ensure-free failed (${response.status}):`, text);
    }
  } catch (error) {
    console.error("[billing] ensure-free request failed:", error);
  }
}
