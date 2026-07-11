import type { RecommendedJobResponse } from "@ai-interviewer/api-types";

export type WorkStyleFilter = "ALL" | "REMOTE" | "HYBRID" | "ONSITE";

export type JobListFilters = {
  role: string;
  location: string;
  skills: string[];
  workStyle: WorkStyleFilter;
};

export const defaultJobListFilters: JobListFilters = {
  role: "",
  location: "",
  skills: [],
  workStyle: "ALL",
};

export function collectJobFilterOptions(jobs: RecommendedJobResponse[]) {
  const locationSet = new Set<string>();
  const skillSet = new Set<string>();

  for (const job of jobs) {
    if (job.location?.trim()) {
      locationSet.add(job.location.trim());
    }

    for (const skill of [...job.requiredSkills, ...job.preferredSkills]) {
      if (skill.trim()) {
        skillSet.add(skill.trim());
      }
    }
  }

  return {
    locations: [...locationSet].sort((a, b) => a.localeCompare(b)),
    skills: [...skillSet].sort((a, b) => a.localeCompare(b)),
  };
}

export function filterJobs(jobs: RecommendedJobResponse[], filters: JobListFilters) {
  const role = filters.role.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const selectedSkills = filters.skills.map((skill) => skill.toLowerCase());

  return jobs.filter((job) => {
    if (filters.workStyle !== "ALL" && job.workStyle !== filters.workStyle) {
      return false;
    }

    if (location && !(job.location ?? "").toLowerCase().includes(location)) {
      return false;
    }

    if (role && !job.title.toLowerCase().includes(role)) {
      return false;
    }

    if (selectedSkills.length > 0) {
      const jobSkills = [...job.requiredSkills, ...job.preferredSkills].map((skill) => skill.toLowerCase());
      const matchesAll = selectedSkills.every((skill) =>
        jobSkills.some((jobSkill) => jobSkill.includes(skill)),
      );
      if (!matchesAll) return false;
    }

    return true;
  });
}

export function hasActiveJobFilters(filters: JobListFilters) {
  return (
    filters.role.trim().length > 0 ||
    filters.location.trim().length > 0 ||
    filters.skills.length > 0 ||
    filters.workStyle !== "ALL"
  );
}
