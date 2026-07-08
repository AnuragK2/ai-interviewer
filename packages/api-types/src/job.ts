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

const JobStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);
const WorkStyleSchema = z.enum(["REMOTE", "HYBRID", "ONSITE"]);
const EmploymentTypeSchema = z.enum(["PERMANENT", "CONTRACT", "INTERNSHIP"]);

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

