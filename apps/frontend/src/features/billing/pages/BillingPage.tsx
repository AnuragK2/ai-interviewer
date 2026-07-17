import type { BillingPlanResponse } from "@ai-interviewer/api-types";
import { CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FadeIn } from "@/components/aceternity/fade-in";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { useBilling } from "@/features/billing/context/billing-context";
import * as billingApi from "@/features/billing/services/billing-api";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

function formatPrice(paise: number, currency: string) {
  if (paise === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function BillingPage() {
  const { billing, loading, refresh, writable } = useBilling();
  const [plans, setPlans] = useState<BillingPlanResponse[]>([]);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    void billingApi
      .listBillingPlans()
      .then((res) => setPlans(res.plans))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load plans."));
  }, []);

  async function handleCheckout(plan: BillingPlanResponse) {
    if (plan.tier === "FREE") {
      toast.message("You are already on the Free plan (or can return after cancel).");
      return;
    }

    setBusyPlanId(plan.id);
    try {
      await loadRazorpayScript();
      const checkout = await billingApi.createBillingCheckout({ planId: plan.id });
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable.");
      }

      const rzp = new window.Razorpay({
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: "GetHired",
        description: `${plan.tier} · ${plan.interval}`,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await billingApi.verifyBillingCheckout(response);
            await refresh();
            toast.success("Subscription activated.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed.");
          }
        },
        theme: { color: "#4f46e5" },
      });
      rzp.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setBusyPlanId(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await billingApi.cancelBillingSubscription();
      await refresh();
      toast.success("Cancellation scheduled at period end.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancel failed.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PageContainer>
      <FadeIn>
        <PageHeader
          title="Billing"
          description="Manage your company subscription, usage limits, and Razorpay checkout."
        />
      </FadeIn>

      {loading && !billing ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading billing…
        </div>
      ) : null}

      {billing ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <GlowingCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current plan
              </CardTitle>
              <CardDescription>
                {billing.plan.tier} · {billing.plan.interval} · {billing.status}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
                <p className="mt-1 font-medium">
                  {writable ? "Writable" : `Read-only (${billing.lockedReason ?? "locked"})`}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-muted-foreground">Interview invites this period</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {billing.usage.interviewInvites}
                    <span className="text-sm text-muted-foreground"> / {billing.usage.maxInterviewInvites}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-muted-foreground">Open jobs cap</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {billing.usage.openJobs ?? "—"}
                    <span className="text-sm text-muted-foreground"> / {billing.usage.maxOpenJobs}</span>
                  </p>
                </div>
              </div>
              {billing.currentPeriodEnd ? (
                <p className="text-muted-foreground">
                  Current period ends {new Date(billing.currentPeriodEnd).toLocaleString()}
                  {billing.cancelAtPeriodEnd ? " · cancels at period end" : ""}.
                </p>
              ) : null}
              {billing.plan.tier !== "FREE" && billing.status === "ACTIVE" && !billing.cancelAtPeriodEnd ? (
                <Button variant="outline" disabled={cancelling} onClick={() => void handleCancel()}>
                  {cancelling ? "Cancelling…" : "Cancel at period end"}
                </Button>
              ) : null}
            </CardContent>
          </GlowingCard>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Available plans</h2>
            {plans.map((plan) => {
              const isCurrent = billing.plan.id === plan.id;
              return (
                <GlowingCard key={plan.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {plan.tier} · {plan.interval}
                    </CardTitle>
                    <CardDescription>
                      {formatPrice(plan.pricePaise, plan.currency)} · {plan.maxOpenJobs} open jobs ·{" "}
                      {plan.maxInterviewInvites} invites / period · {plan.maxRecruiters} seats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      disabled={isCurrent || plan.tier === "FREE" || busyPlanId !== null}
                      onClick={() => void handleCheckout(plan)}
                    >
                      {busyPlanId === plan.id
                        ? "Opening Checkout…"
                        : isCurrent
                          ? "Current plan"
                          : plan.tier === "FREE"
                            ? "Included"
                            : "Upgrade"}
                    </Button>
                  </CardContent>
                </GlowingCard>
              );
            })}
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
