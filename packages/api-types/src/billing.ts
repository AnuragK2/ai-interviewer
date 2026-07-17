export type PlanTier = "FREE" | "PRO" | "BUSINESS";
export type BillingInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type SubscriptionStatus =
  | "FREE_ACTIVE"
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED";

export type BillingLockedReason = "PAST_DUE" | "OVER_LIMIT" | "CANCELLED" | "EXPIRED" | "PENDING";

export type BillingPlanResponse = {
  id: string;
  tier: PlanTier;
  interval: BillingInterval;
  pricePaise: number;
  currency: string;
  maxOpenJobs: number;
  maxInterviewInvites: number;
  maxRecruiters: number;
  active: boolean;
};

export type BillingPlansResponse = {
  plans: BillingPlanResponse[];
};

export type BillingUsageResponse = {
  periodStart: string;
  periodEnd: string;
  interviewInvites: number;
  maxInterviewInvites: number;
  openJobs?: number;
  maxOpenJobs: number;
};

export type BillingMeResponse = {
  companyId: string;
  plan: BillingPlanResponse;
  status: SubscriptionStatus;
  writable: boolean;
  lockedReason: BillingLockedReason | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: BillingUsageResponse;
  razorpayKeyId: string | null;
};

export type BillingEntitlementResponse = {
  companyId: string;
  writable: boolean;
  lockedReason: BillingLockedReason | null;
  status: SubscriptionStatus;
  plan: BillingPlanResponse;
  usage: BillingUsageResponse;
  canCreateOpenJob: boolean;
  canInvite: boolean;
};

export type BillingCheckoutRequest = {
  planId: string;
};

export type BillingCheckoutResponse = {
  subscriptionId: string;
  keyId: string;
  planId: string;
};

export type BillingVerifyRequest = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export type BillingVerifyResponse = {
  subscription: BillingMeResponse;
};

export type EnsureFreeSubscriptionRequest = {
  companyId: string;
};
