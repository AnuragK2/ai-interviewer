import type { RecordTenantAuditRequest, TenantAuditLogListResponse } from "@ai-interviewer/api-types";
import type { Prisma } from "../../../lib/generated/prisma/client";
import { prisma } from "../../infrastructure/db/prisma.client";

function toAuditResponse(row: {
  id: string;
  companyId: string;
  actorUserId: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: Date;
}) {
  return {
    id: row.id,
    companyId: row.companyId,
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recordTenantAudit(input: RecordTenantAuditRequest) {
  const log = await prisma.tenantAuditLog.create({
    data: {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return toAuditResponse(log);
}

export async function listTenantAuditLogs(companyId: string, limit = 50): Promise<TenantAuditLogListResponse> {
  const logs = await prisma.tenantAuditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });

  return { logs: logs.map(toAuditResponse) };
}
