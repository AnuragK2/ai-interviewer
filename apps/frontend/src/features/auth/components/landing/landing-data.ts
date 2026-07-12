import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  Building2,
  FileSearch,
  ShieldCheck,
  Video,
} from "lucide-react";

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type LandingStep = {
  step: number;
  title: string;
  description: string;
  audience: "candidate" | "recruiter" | "both";
};

export type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: Brain,
    title: "AI fit analysis",
    description:
      "Every application is scored against the job description — strengths, gaps, and a narrative recruiters can act on in seconds.",
  },
  {
    icon: Video,
    title: "Realtime AI interviews",
    description:
      "Voice-first interviews powered by OpenAI Realtime. Natural conversation, live transcript, and structured scoring when the session ends.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in proctoring",
    description:
      "Tab switches, gaze monitoring, and camera checks with violation snapshots — so hiring teams can trust remote interviews.",
  },
  {
    icon: FileSearch,
    title: "Rich applicant packets",
    description:
      "Resume, profile snapshot, cover letter, fit analysis, and interview recording — one view for every candidate.",
  },
  {
    icon: BarChart3,
    title: "Pipeline dashboards",
    description:
      "Track applications by status, recent activity, and interview outcomes across your entire hiring funnel.",
  },
  {
    icon: Building2,
    title: "Multi-tenant by design",
    description:
      "Each company gets an isolated workspace. Candidates keep one global profile while applying across employers.",
  },
];

export const LANDING_STEPS: LandingStep[] = [
  {
    step: 1,
    title: "Build your profile",
    description: "Upload a resume, add skills and preferences. GitHub enrichment optional.",
    audience: "candidate",
  },
  {
    step: 2,
    title: "Apply with one click",
    description: "Browse matched jobs, submit a cover letter, and trigger AI analysis instantly.",
    audience: "candidate",
  },
  {
    step: 3,
    title: "Review fit scores",
    description: "Recruiters open applicant packets with AI-generated fit summaries and concerns.",
    audience: "recruiter",
  },
  {
    step: 4,
    title: "Invite to interview",
    description: "Shortlist strong matches. Candidates receive in-app and email notifications.",
    audience: "recruiter",
  },
  {
    step: 5,
    title: "Complete & decide",
    description: "Proctored AI interview → transcript, recording, and recommendation for the hiring team.",
    audience: "both",
  },
];

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    quote:
      "We cut first-round screening from days to hours. The fit analysis alone saved our team dozens of manual resume reviews.",
    name: "Priya Sharma",
    role: "Head of Talent",
    company: "NovaStack",
    initials: "PS",
  },
  {
    quote:
      "The interview felt surprisingly human. I knew exactly where I stood after — score, feedback, and a clear path forward.",
    name: "Marcus Chen",
    role: "Software Engineer",
    company: "Candidate",
    initials: "MC",
  },
  {
    quote:
      "Proctoring snapshots and recordings gave us confidence to hire remotely. Everything lives in one applicant packet.",
    name: "Elena Rodriguez",
    role: "Recruiting Lead",
    company: "Brightpath Labs",
    initials: "ER",
  },
];

export const LANDING_STATS = [
  { label: "AI-powered fit scoring", value: "Per application" },
  { label: "Proctored interviews", value: "End-to-end" },
  { label: "Tenant isolation", value: "Multi-company" },
  { label: "Structured feedback", value: "Post-interview" },
] as const;

export const PRODUCT_DEMO_STEPS = [
  {
    id: "profile",
    label: "Profile",
    title: "Rich candidate profiles",
    subtitle: "Resume parsing · skills · preferences",
  },
  {
    id: "apply",
    label: "Apply",
    title: "Apply to matched roles",
    subtitle: "Cover letter · instant submission",
  },
  {
    id: "fit",
    label: "Fit score",
    title: "AI fit analysis",
    subtitle: "87% match · 3 strengths · 1 gap",
  },
  {
    id: "interview",
    label: "Interview",
    title: "Live AI interview",
    subtitle: "Proctored · realtime voice",
  },
  {
    id: "review",
    label: "Review",
    title: "Recruiter packet",
    subtitle: "Transcript · recording · decision",
  },
] as const;
