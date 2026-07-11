import type { RecordTenantAuditRequest } from "@ai-interviewer/api-types";
import { env } from "../../config/env";

export async function recordRemoteTenantAudit(input: RecordTenantAuditRequest) {
  try {
    const response = await fetch(`${env.applicationServiceUrl}/api/v1/internal/tenant-audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-key": env.internalServiceKey,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[audit-client] failed (${response.status}): ${text}`);
    }
  } catch (error) {
    console.error("[audit-client] request failed:", error);
  }
}
