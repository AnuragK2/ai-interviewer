export function slugifyCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function ensureUniqueCompanySlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug || "company";
  let suffix = 0;

  while (await exists(suffix === 0 ? slug : `${slug}-${suffix}`)) {
    suffix += 1;
  }

  return suffix === 0 ? slug : `${slug}-${suffix}`;
}
