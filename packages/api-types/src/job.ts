import { z } from "zod";

export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";
export type WorkStyle = "REMOTE" | "HYBRID" | "ONSITE";
export type EmploymentType = "PERMANENT" | "CONTRACT" | "INTERNSHIP";

export type JobResponse = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  workStyle: WorkStyle | null;
  employmentTypes: EmploymentType[];
  status: JobStatus;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
};

export type ListJobsResponse = {
  jobs: JobResponse[];
};

export type RecommendedJobResponse = JobResponse & {
  matchScore: number;
  matchSummary: string | null;
  isRecommended: boolean;
  hasApplied: boolean;
};

export type RecommendedJobsResponse = {
  jobs: RecommendedJobResponse[];
};

export type CreateJobRequest = {
  title: string;
  description: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  workStyle?: WorkStyle | null;
  employmentTypes?: EmploymentType[];
  status?: JobStatus;
  expiresAt?: string | null;
};

export type UpdateJobRequest = {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  workStyle?: WorkStyle | null;
  employmentTypes?: EmploymentType[];
  status?: JobStatus;
  expiresAt?: string | null;
};

export type JobSeniority = "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "MANAGER";

export type GenerateJobDescriptionRequest = {
  roleTitle: string;
  seniority: JobSeniority;
  teamOrProduct?: string | null;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  location?: string | null;
  workStyle?: WorkStyle | null;
  employmentTypes?: EmploymentType[];
  companyName?: string | null;
  industry?: string | null;
};

export type GenerateJobDescriptionResponse = {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  generatedBy: "ai" | "template";
};

const JobStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);
const WorkStyleSchema = z.enum(["REMOTE", "HYBRID", "ONSITE"]);
const EmploymentTypeSchema = z.enum(["PERMANENT", "CONTRACT", "INTERNSHIP"]);
const JobSenioritySchema = z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "MANAGER"]);

export const GenerateJobDescriptionRequestSchema = z.object({
  roleTitle: z.string().trim().min(2),
  seniority: JobSenioritySchema,
  teamOrProduct: z.string().trim().optional().nullable(),
  mustHaveSkills: z.array(z.string().trim().min(1)).optional(),
  niceToHaveSkills: z.array(z.string().trim().min(1)).optional(),
  location: z.string().trim().optional().nullable(),
  workStyle: WorkStyleSchema.optional().nullable(),
  employmentTypes: z.array(EmploymentTypeSchema).optional(),
  companyName: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
});

export const CreateJobRequestSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(20),
  requiredSkills: z.array(z.string().trim().min(1)).optional(),
  preferredSkills: z.array(z.string().trim().min(1)).optional(),
  location: z.string().trim().optional().nullable(),
  salaryMin: z.number().nonnegative().optional().nullable(),
  salaryMax: z.number().nonnegative().optional().nullable(),
  currency: z.string().trim().optional(),
  workStyle: WorkStyleSchema.optional().nullable(),
  employmentTypes: z.array(EmploymentTypeSchema).optional(),
  status: JobStatusSchema.optional(),
  expiresAt: z.string().trim().optional().nullable(),
});

export const UpdateJobRequestSchema = CreateJobRequestSchema.partial();

