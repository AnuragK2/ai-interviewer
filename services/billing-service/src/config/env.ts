export const env = {
  port: Number(process.env.PORT) || 3007,
  serviceName: process.env.SERVICE_NAME ?? "billing-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY ?? "dev-internal-service-key",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  razorpayPlanIds: {
    PRO_MONTHLY: process.env.RAZORPAY_PLAN_PRO_MONTHLY,
    PRO_QUARTERLY: process.env.RAZORPAY_PLAN_PRO_QUARTERLY,
    PRO_YEARLY: process.env.RAZORPAY_PLAN_PRO_YEARLY,
    BUSINESS_MONTHLY: process.env.RAZORPAY_PLAN_BUSINESS_MONTHLY,
    BUSINESS_QUARTERLY: process.env.RAZORPAY_PLAN_BUSINESS_QUARTERLY,
    BUSINESS_YEARLY: process.env.RAZORPAY_PLAN_BUSINESS_YEARLY,
  },
} as const;
