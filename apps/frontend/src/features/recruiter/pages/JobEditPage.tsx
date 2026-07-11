import type { EmploymentType, GenerateJobDescriptionResponse, JobStatus, JobWorkStyle } from "@ai-interviewer/api-types";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ButtonLoading, CardLoader } from "@/shared/components/loading";
import { JobDescriptionGenerator } from "@/features/jobs/components/JobDescriptionGenerator";
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

function formSnapshot(form: FormState) {
  const payload = buildPayload(form);
  return JSON.stringify({
    ...payload,
    employmentTypes: [...payload.employmentTypes].sort(),
  });
}

export function RecruiterJobEditPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;

  const [form, setForm] = useState<FormState>(defaultForm);
  const [initialForm, setInitialForm] = useState<FormState | null>(isNew ? defaultForm : null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;

    void jobApi
      .getJob(id)
      .then((job) => {
        const loadedForm: FormState = {
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
        };
        setForm(loadedForm);
        setInitialForm(loadedForm);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load job."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const hasChanges = useMemo(() => {
    if (isNew || !initialForm) return true;
    return formSnapshot(form) !== formSnapshot(initialForm);
  }, [form, initialForm, isNew]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (isNew) {
        await jobApi.createJob(payload);
        toast.success("Job created successfully.");
      } else {
        await jobApi.updateJob(id!, payload);
        toast.success("Job updated successfully.");
      }
      setConfirmOpen(false);
      navigate("/recruiter/jobs");
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

  function applyGeneratedDescription(generated: GenerateJobDescriptionResponse) {
    setForm((current) => ({
      ...current,
      title: generated.title,
      description: generated.description,
      requiredSkills: generated.requiredSkills.join(", "),
      preferredSkills: generated.preferredSkills.join(", "),
    }));
  }

  return (
    <PageContainer size="md">
      <PageHeader
        eyebrow="Recruiter"
        title={isNew ? "New job" : "Edit job"}
        description={user?.company?.name}
      />

      <GlowingCard>
        <CardHeader>
            <CardTitle>Job details</CardTitle>
            <CardDescription>Draft first, then publish to show up in the candidate catalog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <CardLoader message="Loading job…" />
            ) : (
              <>
                {!isNew ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 p-4">
                    <div>
                      <p className="text-sm font-medium">Applicants</p>
                      <p className="text-xs text-muted-foreground">View candidate applications and AI fit analysis.</p>
                    </div>
                    <Button asChild variant="outline">
                      <Link to={`/recruiter/jobs/${id}/applicants`}>View applicants</Link>
                    </Button>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <div>
                    <p className="text-sm font-medium">AI job description</p>
                    <p className="text-xs text-muted-foreground">
                      Answer a few questions to draft the title, description, and skills.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
                    onClick={() => setGeneratorOpen(true)}
                  >
                    <Sparkles className="size-4" />
                    Generate with AI
                  </Button>
                </div>
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
                    <Label>Expires</Label>
                    <DatePicker
                      value={form.expiresAt}
                      onChange={(expiresAt) => setForm({ ...form, expiresAt })}
                      placeholder="Select expiry date"
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
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={saving || !hasChanges}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    {isNew ? "Create job" : "Save changes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
      </GlowingCard>

      <JobDescriptionGenerator
        open={generatorOpen}
        onOpenChange={setGeneratorOpen}
        initialValues={{
          title: form.title,
          requiredSkills: form.requiredSkills,
          preferredSkills: form.preferredSkills,
          location: form.location,
          workStyle: form.workStyle,
          employmentTypes: form.employmentTypes,
          companyName: user?.company?.name,
        }}
        onApply={applyGeneratedDescription}
      />

      <Modal open={confirmOpen} onOpenChange={(open) => !saving && setConfirmOpen(open)}>
        <ModalContent aria-describedby="save-job-description">
          <ModalHeader>
            <ModalTitle>{isNew ? "Create job?" : "Save changes?"}</ModalTitle>
            <ModalDescription id="save-job-description">
              {isNew
                ? "This will create the job and return you to your job listings."
                : "Your updates will be saved and you'll return to your job listings."}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{form.title.trim() || "Untitled role"}</p>
            <p className="mt-1 capitalize">
              Status: {form.status.toLowerCase().replace("_", " ")}
              {form.location.trim() ? ` · ${form.location.trim()}` : ""}
            </p>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
              <ButtonLoading loading={saving} loadingText="Saving…">
                {isNew ? "Create job" : "Save changes"}
              </ButtonLoading>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}

