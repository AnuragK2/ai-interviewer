import type { EmploymentType, JobStatus, JobWorkStyle } from "@ai-interviewer/api-types";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/shared/components/PageShell";
import { useAuth } from "@/features/auth/context/auth-context";
import * as jobApi from "@/features/jobs/services/job-api";

type FormState = {
  title: string;
  description: string;
  requiredSkills: string;
  preferredSkills: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  workStyle: "" | JobWorkStyle;
  employmentTypes: EmploymentType[];
  status: JobStatus;
  expiresAt: string;
};

const defaultForm: FormState = {
  title: "",
  description: "",
  requiredSkills: "",
  preferredSkills: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  currency: "USD",
  workStyle: "",
  employmentTypes: [],
  status: "DRAFT",
  expiresAt: "",
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toExpiresAtIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function buildPayload(form: FormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    requiredSkills: splitCsv(form.requiredSkills),
    preferredSkills: splitCsv(form.preferredSkills),
    location: form.location.trim() || null,
    salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
    salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
    currency: form.currency.trim() || "USD",
    workStyle: form.workStyle || null,
    employmentTypes: form.employmentTypes,
    status: form.status,
    expiresAt: toExpiresAtIso(form.expiresAt),
  };
}

export function RecruiterJobEditPage() {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;

  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;

    void jobApi
      .getJob(id)
      .then((job) => {
        setForm({
          title: job.title,
          description: job.description,
          requiredSkills: job.requiredSkills.join(", "),
          preferredSkills: job.preferredSkills.join(", "),
          location: job.location ?? "",
          salaryMin: job.salaryMin?.toString() ?? "",
          salaryMax: job.salaryMax?.toString() ?? "",
          currency: job.currency,
          workStyle: job.workStyle ?? "",
          employmentTypes: job.employmentTypes,
          status: job.status,
          expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : "",
        });
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load job."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = buildPayload(form);
      const saved = isNew ? await jobApi.createJob(payload) : await jobApi.updateJob(id!, payload);
      toast.success(isNew ? "Job created." : "Job updated.");
      navigate(`/recruiter/jobs/${saved.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function toggleEmploymentType(type: EmploymentType) {
    const next = form.employmentTypes.includes(type)
      ? form.employmentTypes.filter((t) => t !== type)
      : [...form.employmentTypes, type];
    setForm({ ...form, employmentTypes: next });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-amber-400">Recruiter job</p>
            <h1 className="text-3xl font-semibold">{isNew ? "New job" : "Edit job"}</h1>
            <p className="text-sm text-muted-foreground">{user?.company?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/recruiter/jobs">Jobs</Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job details</CardTitle>
            <CardDescription>Draft first, then publish to show up in the candidate catalog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    className="min-h-40"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Required skills (comma-separated)</Label>
                    <Input
                      value={form.requiredSkills}
                      onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred skills (comma-separated)</Label>
                    <Input
                      value={form.preferredSkills}
                      onChange={(e) => setForm({ ...form, preferredSkills: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expires (YYYY-MM-DD)</Label>
                    <Input
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      placeholder="2026-12-31"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Salary min</Label>
                    <Input
                      type="number"
                      value={form.salaryMin}
                      onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Salary max</Label>
                    <Input
                      type="number"
                      value={form.salaryMax}
                      onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Work style</Label>
                    <select
                      className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={form.workStyle}
                      onChange={(e) =>
                        setForm({ ...form, workStyle: (e.target.value || "") as "" | JobWorkStyle })
                      }
                    >
                      <option value="">Select…</option>
                      <option value="REMOTE">Remote</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="ONSITE">On-site</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="OPEN">Open (published)</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Employment type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["PERMANENT", "CONTRACT", "INTERNSHIP"] as EmploymentType[]).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={form.employmentTypes.includes(type) ? "default" : "outline"}
                        onClick={() => toggleEmploymentType(type)}
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Saving…" : isNew ? "Create job" : "Save changes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

