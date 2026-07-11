import type {
  CandidateProfileResponse,
  EducationEntry,
  EmploymentType,
  ExperienceEntry,
  ProfileLinks,
  ProfilePreferences,
  SkillEntry,
  WorkStyle,
} from "@ai-interviewer/api-types";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ProfilePhotoUpload } from "@/features/candidate/components/ProfilePhotoUpload";
import { useAuth } from "@/features/auth/context/auth-context";
import * as profileApi from "../services/profile-api";

const emptyExperience = (): ExperienceEntry => ({
  title: "",
  company: "",
  startDate: "",
  endDate: "",
  description: "",
});

const emptyEducation = (): EducationEntry => ({
  degree: "",
  institution: "",
  startDate: "",
  endDate: "",
});

export function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<CandidateProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [enrichingGithub, setEnrichingGithub] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [preferences, setPreferences] = useState<ProfilePreferences>({});
  const [links, setLinks] = useState<ProfileLinks>({});
  const [skillInput, setSkillInput] = useState("");
  const [rolesInput, setRolesInput] = useState("");
  const [locationsInput, setLocationsInput] = useState("");

  function applyProfile(data: CandidateProfileResponse) {
    setProfile(data);
    setName(data.name ?? user?.name ?? "");
    setPhone(data.phone ?? "");
    setSkills(data.skills);
    setExperience(data.experience.length > 0 ? data.experience : [emptyExperience()]);
    setEducation(data.education.length > 0 ? data.education : [emptyEducation()]);
    setPreferences(data.preferences);
    setLinks(data.links);
    setRolesInput((data.preferences.desiredRoles ?? []).join(", "));
    setLocationsInput((data.preferences.locations ?? []).join(", "));
  }

  useEffect(() => {
    void profileApi
      .fetchMyProfile()
      .then(applyProfile)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  function buildPayload() {
    return {
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      skills: skills.filter((s) => s.name.trim()),
      experience: experience.filter((e) => e.title.trim() && e.company.trim()),
      education: education.filter((e) => e.degree.trim() && e.institution.trim()),
      preferences: {
        ...preferences,
        desiredRoles: rolesInput
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        locations: locationsInput
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      },
      links,
    };
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await profileApi.updateMyProfile(buildPayload());
      applyProfile(updated);
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    try {
      const updated = await profileApi.uploadResume(file, buildPayload());
      applyProfile(updated);
      toast.success("Resume uploaded and parsed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    try {
      const updated = await profileApi.uploadProfilePhoto(file);
      applyProfile(updated);
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDownloadResume() {
    try {
      const { url } = await profileApi.getResumeDownloadUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    }
  }

  async function handleGithubEnrich() {
    setEnrichingGithub(true);
    try {
      const updated = await profileApi.enrichGithubProfile();
      applyProfile(updated);
      toast.success("GitHub profile enriched.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "GitHub enrichment failed.");
    } finally {
      setEnrichingGithub(false);
    }
  }

  function toggleEmploymentType(type: EmploymentType) {
    const current = preferences.employmentTypes ?? [];
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    setPreferences({ ...preferences, employmentTypes: next });
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading profile…</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Profile" title="Your profile" description={user?.email} />

      <Card>
          <CardHeader>
            <CardTitle>Completeness</CardTitle>
            <CardDescription>Fill more sections to improve your job match score in later phases.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span>{profile?.profileCompleteness ?? 0}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${profile?.profileCompleteness ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Add a profile photo and your basic contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfilePhotoUpload
              photoUrl={profile?.photoUrl ?? null}
              fallbackPhotoUrl={user?.avatarUrl}
              displayName={name || user?.name}
              uploading={uploadingPhoto}
              onSelectFile={(file) => void handlePhotoUpload(file)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill.name}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm"
                >
                  {skill.name}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (skillInput.trim()) {
                      setSkills([...skills, { name: skillInput.trim() }]);
                      setSkillInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (skillInput.trim()) {
                    setSkills([...skills, { name: skillInput.trim() }]);
                    setSkillInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.map((entry, index) => (
              <div key={index} className="space-y-3 rounded-lg border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Job title"
                    value={entry.title}
                    onChange={(e) => {
                      const next = [...experience];
                      next[index] = { ...entry, title: e.target.value };
                      setExperience(next);
                    }}
                  />
                  <Input
                    placeholder="Company"
                    value={entry.company}
                    onChange={(e) => {
                      const next = [...experience];
                      next[index] = { ...entry, company: e.target.value };
                      setExperience(next);
                    }}
                  />
                </div>
                <Textarea
                  placeholder="Description"
                  value={entry.description ?? ""}
                  onChange={(e) => {
                    const next = [...experience];
                    next[index] = { ...entry, description: e.target.value };
                    setExperience(next);
                  }}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setExperience([...experience, emptyExperience()])}>
              Add experience
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.map((entry, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Degree"
                  value={entry.degree}
                  onChange={(e) => {
                    const next = [...education];
                    next[index] = { ...entry, degree: e.target.value };
                    setEducation(next);
                  }}
                />
                <Input
                  placeholder="Institution"
                  value={entry.institution}
                  onChange={(e) => {
                    const next = [...education];
                    next[index] = { ...entry, institution: e.target.value };
                    setEducation(next);
                  }}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setEducation([...education, emptyEducation()])}>
              Add education
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Work style</Label>
              <select
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={preferences.workStyle ?? ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    workStyle: (e.target.value || undefined) as WorkStyle | undefined,
                  })
                }
              >
                <option value="">Select…</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={preferences.currency ?? "USD"}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Salary min</Label>
              <Input
                type="number"
                value={preferences.salaryMin ?? ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    salaryMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Salary max</Label>
              <Input
                type="number"
                value={preferences.salaryMax ?? ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    salaryMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Desired roles (comma-separated)</Label>
              <Input value={rolesInput} onChange={(e) => setRolesInput(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Locations (comma-separated)</Label>
              <Input value={locationsInput} onChange={(e) => setLocationsInput(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Employment type</Label>
              <div className="flex flex-wrap gap-2">
                {(["PERMANENT", "CONTRACT", "INTERNSHIP"] as EmploymentType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={(preferences.employmentTypes ?? []).includes(type) ? "default" : "outline"}
                    onClick={() => toggleEmploymentType(type)}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input
              placeholder="LinkedIn URL"
              value={links.linkedin ?? ""}
              onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
            />
            <Input
              placeholder="Portfolio URL"
              value={links.portfolio ?? ""}
              onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                placeholder="GitHub profile URL"
                value={links.github ?? ""}
                onChange={(e) => setLinks({ ...links, github: e.target.value })}
              />
              <Button type="button" variant="outline" disabled={enrichingGithub} onClick={() => void handleGithubEnrich()}>
                {enrichingGithub ? "Fetching…" : "Enrich"}
              </Button>
            </div>
            {profile?.githubMeta ? (
              <p className="text-sm text-muted-foreground">
                GitHub: @{profile.githubMeta.username} · {profile.githubMeta.repos.length} repos loaded
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resume</CardTitle>
            <CardDescription>Upload PDF, DOCX, or TXT. Parsed fields merge into empty profile sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleResumeUpload(file);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Uploading…" : profile?.resume ? "Replace resume" : "Upload resume"}
              </Button>
              {profile?.resume ? (
                <Button type="button" variant="outline" onClick={() => void handleDownloadResume()}>
                  Download original
                </Button>
              ) : null}
            </div>
            {profile?.resume ? (
              <p className="text-sm text-muted-foreground">File: {profile.resume.fileName}</p>
            ) : null}
            {profile?.parsedResume?.rawText ? (
              <div className="space-y-2">
                <Label>Parsed preview</Label>
                <Textarea readOnly className="min-h-48 font-mono text-xs" value={profile.parsedResume.rawText} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex justify-end pb-4">
          <Button onClick={() => void handleSave()} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
    </PageContainer>
  );
}
