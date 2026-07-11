import type {
  EmploymentType,
  GenerateJobDescriptionRequest,
  GenerateJobDescriptionResponse,
  JobSeniority,
  JobWorkStyle,
} from "@ai-interviewer/api-types";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ButtonLoading } from "@/shared/components/loading";
import * as jobApi from "@/features/jobs/services/job-api";

type JobDescriptionGeneratorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    title?: string;
    requiredSkills?: string;
    preferredSkills?: string;
    location?: string;
    workStyle?: "" | JobWorkStyle;
    employmentTypes?: EmploymentType[];
    companyName?: string;
  };
  onApply: (generated: GenerateJobDescriptionResponse) => void;
};

type QuestionnaireState = {
  roleTitle: string;
  seniority: JobSeniority;
  teamOrProduct: string;
  mustHaveSkills: string;
  niceToHaveSkills: string;
  industry: string;
  location: string;
  workStyle: "" | JobWorkStyle;
  employmentTypes: EmploymentType[];
  companyName: string;
};

const defaultQuestionnaire: QuestionnaireState = {
  roleTitle: "",
  seniority: "MID",
  teamOrProduct: "",
  mustHaveSkills: "",
  niceToHaveSkills: "",
  industry: "",
  location: "",
  workStyle: "",
  employmentTypes: [],
  companyName: "",
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function JobDescriptionGenerator({
  open,
  onOpenChange,
  initialValues,
  onApply,
}: JobDescriptionGeneratorProps) {
  const [form, setForm] = useState<QuestionnaireState>(defaultQuestionnaire);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      roleTitle: initialValues?.title ?? "",
      seniority: "MID",
      teamOrProduct: "",
      mustHaveSkills: initialValues?.requiredSkills ?? "",
      niceToHaveSkills: initialValues?.preferredSkills ?? "",
      industry: "",
      location: initialValues?.location ?? "",
      workStyle: initialValues?.workStyle ?? "",
      employmentTypes: initialValues?.employmentTypes ?? [],
      companyName: initialValues?.companyName ?? "",
    });
  }, [open, initialValues]);

  function toggleEmploymentType(type: EmploymentType) {
    setForm((current) => ({
      ...current,
      employmentTypes: current.employmentTypes.includes(type)
        ? current.employmentTypes.filter((item) => item !== type)
        : [...current.employmentTypes, type],
    }));
  }

  async function handleGenerate() {
    if (!form.roleTitle.trim()) {
      toast.error("Enter a role title first.");
      return;
    }

    const payload: GenerateJobDescriptionRequest = {
      roleTitle: form.roleTitle.trim(),
      seniority: form.seniority,
      teamOrProduct: form.teamOrProduct.trim() || null,
      mustHaveSkills: splitCsv(form.mustHaveSkills),
      niceToHaveSkills: splitCsv(form.niceToHaveSkills),
      location: form.location.trim() || null,
      workStyle: form.workStyle || null,
      employmentTypes: form.employmentTypes,
      companyName: form.companyName.trim() || null,
      industry: form.industry.trim() || null,
    };

    setGenerating(true);
    try {
      const generated = await jobApi.generateJobDescription(payload);
      onApply(generated);
      toast.success(
        generated.generatedBy === "ai"
          ? "AI job description generated. Review and edit before publishing."
          : "Draft job description generated. Add OPENAI_API_KEY for AI-powered drafts.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate job description.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-h-[90vh] max-w-2xl overflow-y-auto" showCloseButton>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-300" />
            Generate job description
          </ModalTitle>
          <ModalDescription>
            Answer a few questions and we&apos;ll draft a job title, description, and skill lists you can edit.
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jd-role-title">Role title</Label>
              <Input
                id="jd-role-title"
                value={form.roleTitle}
                onChange={(event) => setForm({ ...form, roleTitle: event.target.value })}
                placeholder="e.g. Frontend Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd-seniority">Seniority</Label>
              <select
                id="jd-seniority"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={form.seniority}
                onChange={(event) => setForm({ ...form, seniority: event.target.value as JobSeniority })}
              >
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid-level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd-industry">Industry or domain</Label>
              <Input
                id="jd-industry"
                value={form.industry}
                onChange={(event) => setForm({ ...form, industry: event.target.value })}
                placeholder="e.g. Fintech, SaaS, Healthcare"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jd-team-focus">What will they work on?</Label>
              <Textarea
                id="jd-team-focus"
                value={form.teamOrProduct}
                onChange={(event) => setForm({ ...form, teamOrProduct: event.target.value })}
                placeholder="Briefly describe the team, product, or main responsibilities."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd-must-have-skills">Must-have skills</Label>
              <Input
                id="jd-must-have-skills"
                value={form.mustHaveSkills}
                onChange={(event) => setForm({ ...form, mustHaveSkills: event.target.value })}
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd-nice-to-have-skills">Nice-to-have skills</Label>
              <Input
                id="jd-nice-to-have-skills"
                value={form.niceToHaveSkills}
                onChange={(event) => setForm({ ...form, niceToHaveSkills: event.target.value })}
                placeholder="GraphQL, AWS, CI/CD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd-location">Location</Label>
              <Input
                id="jd-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="e.g. Bangalore, Remote-first"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd-work-style">Work style</Label>
              <select
                id="jd-work-style"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={form.workStyle}
                onChange={(event) =>
                  setForm({ ...form, workStyle: (event.target.value || "") as "" | JobWorkStyle })
                }
              >
                <option value="">Not specified</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
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
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-500"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            <ButtonLoading loading={generating} loadingText="Generating…">
              Generate description
            </ButtonLoading>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
