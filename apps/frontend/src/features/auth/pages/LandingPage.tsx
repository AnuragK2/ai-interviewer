import { LandingAudience } from "@/features/auth/components/landing/LandingAudience";
import { LandingFeatures } from "@/features/auth/components/landing/LandingFeatures";
import { LandingFooter } from "@/features/auth/components/landing/LandingFooter";
import { LandingHero } from "@/features/auth/components/landing/LandingHero";
import { LandingHowItWorks } from "@/features/auth/components/landing/LandingHowItWorks";
import { LandingProductDemo } from "@/features/auth/components/landing/LandingProductDemo";
import { LandingStats } from "@/features/auth/components/landing/LandingStats";
import { LandingTestimonials } from "@/features/auth/components/landing/LandingTestimonials";

export function LandingPage() {
  return (
    <div className="flex flex-col">
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <div className="py-20 sm:py-28">
        <LandingProductDemo />
      </div>
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingAudience />
      <LandingFooter />
    </div>
  );
}
