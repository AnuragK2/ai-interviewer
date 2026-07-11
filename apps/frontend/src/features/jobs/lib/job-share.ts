type ShareableJob = {
  id: string;
  title: string;
  location?: string | null;
};

export function getPublicJobUrl(jobId: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/jobs/${jobId}`;
  }

  return `/jobs/${jobId}`;
}

export function buildJobShareMessage(job: ShareableJob) {
  const locationSuffix = job.location ? ` — ${job.location}` : "";
  return `${job.title}${locationSuffix}`;
}

export type JobShareChannel = "facebook" | "whatsapp" | "telegram" | "linkedin" | "gmail";

export function buildJobShareLinks(job: ShareableJob) {
  const url = getPublicJobUrl(job.id);
  const message = buildJobShareMessage(job);
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);
  const encodedTitle = encodeURIComponent(job.title);
  const encodedBody = encodeURIComponent(`${message}\n\n${url}`);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    gmail: `mailto:?subject=${encodedTitle}&body=${encodedBody}`,
  } satisfies Record<JobShareChannel, string>;
}
