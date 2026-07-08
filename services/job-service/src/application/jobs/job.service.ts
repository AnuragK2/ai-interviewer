import type {
  CreateJobRequest,
  JobResponse,
  JobStatus,
  ListJobsResponse,
  UpdateJobRequest,
} from "@ai-interviewer/api-types";
import { prisma } from "../../infrastructure/db/prisma.client";

export class JobError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "JobError";
  }
}

function isExpired(expiresAt: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
}

function toJobResponse(row: {
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
  workStyle: string | null;
  employmentTypes: string[];
  status: string;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): JobResponse {
  return {
    id: row.id,
    companyId: row.companyId,
    title: row.title,
    description: row.description,
    requiredSkills: row.requiredSkills,
    preferredSkills: row.preferredSkills,
    location: row.location,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    workStyle: row.workStyle as JobResponse["workStyle"],
    employmentTypes: row.employmentTypes as JobResponse["employmentTypes"],
    status: row.status as JobStatus,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isExpired: isExpired(row.expiresAt),
  };
}

export async function createJob(
  input: CreateJobRequest,
  actor: { userId: string; companyId: string },
): Promise<JobResponse> {
  const created = await prisma.job.create({
    data: {
      companyId: actor.companyId,
      title: input.title,
      description: input.description,
      requiredSkills: input.requiredSkills ?? [],
      preferredSkills: input.preferredSkills ?? [],
      location: input.location ?? null,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      currency: input.currency ?? "USD",
      workStyle: input.workStyle ?? null,
      employmentTypes: input.employmentTypes ?? [],
      status: input.status ?? "DRAFT",
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy: actor.userId,
    },
  });

  return toJobResponse(created);
}

export async function updateJob(
  jobId: string,
  input: UpdateJobRequest,
  actor: { companyId: string },
): Promise<JobResponse> {
  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing || existing.companyId !== actor.companyId) {
    throw new JobError("Job not found.", 404);
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.requiredSkills !== undefined ? { requiredSkills: input.requiredSkills } : {}),
      ...(input.preferredSkills !== undefined ? { preferredSkills: input.preferredSkills } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.salaryMin !== undefined ? { salaryMin: input.salaryMin } : {}),
      ...(input.salaryMax !== undefined ? { salaryMax: input.salaryMax } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.workStyle !== undefined ? { workStyle: input.workStyle } : {}),
      ...(input.employmentTypes !== undefined ? { employmentTypes: input.employmentTypes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } : {}),
    },
  });

  return toJobResponse(updated);
}

export async function getJobPublic(jobId: string): Promise<JobResponse> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new JobError("Job not found.", 404);
  return toJobResponse(job);
}

export async function listJobsPublic(params: {
  status?: JobStatus;
  companyId?: string;
}): Promise<ListJobsResponse> {
  const jobs = await prisma.job.findMany({
    where: {
      ...(params.companyId ? { companyId: params.companyId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return { jobs: jobs.map(toJobResponse) };
}

export async function listJobsForRecruiter(companyId: string): Promise<ListJobsResponse> {
  const jobs = await prisma.job.findMany({
    where: { companyId },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  return { jobs: jobs.map(toJobResponse) };
}

