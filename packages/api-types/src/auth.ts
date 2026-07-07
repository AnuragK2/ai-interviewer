import { z } from "zod";

export type UserRole = "CANDIDATE" | "RECRUITER";

export type OAuthProvider = "GOOGLE" | "GITHUB";

export type OAuthProviderKey = "google" | "github";

export type CompanySummary = {
  id: string;
  name: string;
  slug: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  companyId: string | null;
  company: CompanySummary | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterCandidateRequest = {
  email: string;
  password: string;
  name: string;
};

export type RegisterRecruiterRequest = {
  email: string;
  password: string;
  name: string;
  companyName: string;
  title?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export const RegisterCandidateRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
});

export const RegisterRecruiterRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
  companyName: z.string().trim().min(2),
  title: z.string().trim().optional(),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type OAuthProvidersResponse = {
  providers: OAuthProviderKey[];
};
