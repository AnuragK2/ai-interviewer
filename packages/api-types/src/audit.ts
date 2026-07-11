export type TenantAuditLogResponse = {
  id: string;
  companyId: string;
  actorUserId: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TenantAuditLogListResponse = {
  logs: TenantAuditLogResponse[];
};

export type RecordTenantAuditRequest = {
  companyId: string;
  actorUserId: string;
  actorEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
};
