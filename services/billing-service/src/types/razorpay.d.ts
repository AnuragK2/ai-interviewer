declare module "razorpay" {
  interface RazorpaySubscriptionCreateRequest {
    plan_id: string;
    total_count: number;
    quantity?: number;
    customer_notify?: 0 | 1 | boolean;
    start_at?: number;
    expire_by?: number;
    notes?: Record<string, string>;
  }

  interface RazorpaySubscription {
    id: string;
    status: string;
    plan_id: string;
  }

  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    subscriptions: {
      create: (data: RazorpaySubscriptionCreateRequest) => Promise<RazorpaySubscription>;
      cancel: (subscriptionId: string, cancelAtCycleEnd?: boolean) => Promise<RazorpaySubscription>;
    };
  }
}
