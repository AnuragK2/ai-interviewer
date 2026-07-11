import type { ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { GlowingCard } from "@/components/aceternity/glowing-card";
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
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "@/shared/api/config";
import { INTERVIEW_DISCLAIMERS } from "@/features/pre-interview/constants/disclaimer";
import { saveInterviewSession } from "@/shared/lib/interview-session";
import axios from "axios";
import type { PreInterviewResponse } from "@/shared/api/types";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft, ArrowRight, Code2, FileText, Loader2, ShieldAlert, Upload, X } from "lucide-react";
import {
  InterviewFlowShell,
  interviewOutlineButtonClass,
  interviewPrimaryButtonClass,
  interviewAccentIconClass,
  interviewSurfaceClass,
} from "@/features/interview/components/InterviewFlowShell";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useAuth } from "@/features/auth/context/auth-context";

export function Form() {
  const navigate = useNavigate();
  const { getDashboardPath, user } = useAuth();
  const [githubUrl, setGithubUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<PreInterviewResponse | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setResumeFile(file);
  }

  async function onSubmit() {
    if (!resumeFile) {
      toast.error("Please upload your resume");
      return;
    }

    if (!githubUrl) {
      toast.error("Please enter your GitHub profile URL");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("githubUrl", githubUrl);

    setIsSubmitting(true);

    try {
      const { data } = await axios.post<PreInterviewResponse>(`${BACKEND_URL}/api/v1/pre-interview`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Interview created successfully");
      setParsedProfile(data);
      setShowDisclaimer(true);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Could not reach the server. Is the backend running on port 3001?";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const candidateName = parsedProfile?.resume.name ?? parsedProfile?.github.username;

  return (
    <InterviewFlowShell>
      <Modal open={showDisclaimer} onOpenChange={(isOpen: boolean) => !isOpen && setShowDisclaimer(false)}>
        <ModalContent aria-describedby="disclaimer-description">
          <ModalHeader>
            <ModalTitle>Before you begin</ModalTitle>
            <ModalDescription id="disclaimer-description">
              {candidateName ? `Interview guidelines for ${candidateName}` : "Interview guidelines"}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className={cn("space-y-3 rounded-xl p-4", interviewSurfaceClass)}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="h-4 w-4 text-amber-300" />
              Please read carefully
            </div>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              {INTERVIEW_DISCLAIMERS.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDisclaimer(false)} className={interviewOutlineButtonClass}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => {
                if (!parsedProfile) return;
                setShowDisclaimer(false);
                saveInterviewSession(parsedProfile);
                navigate(`/interview/${parsedProfile.interview.id}`);
              }}
              className={interviewPrimaryButtonClass}
            >
              Let&apos;s get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <PageContainer size="md">
        <PageHeader
          eyebrow="Interview"
          title="Start your AI interview"
          description="Upload your resume and connect GitHub. We'll build a personalized mock interview from your experience."
          actions={
            user ? (
              <Button asChild variant="outline" className={interviewOutlineButtonClass}>
                <Link to={getDashboardPath(user.role)}>Back to dashboard</Link>
              </Button>
            ) : null
          }
        />

        <GlowingCard>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Get started</h2>
            <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT · GitHub public profile</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="resume" className="text-sm font-medium">
                Resume
              </Label>
              <input
                id="resume"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => handleFileSelect(event.target.files?.[0])}
              />

              {!resumeFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleFileSelect(event.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 transition-all",
                    interviewSurfaceClass,
                    "hover:border-indigo-500/40 hover:bg-indigo-500/5",
                    isDragging && "border-indigo-400 bg-indigo-500/10",
                  )}
                >
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", interviewAccentIconClass)}>
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium">Drop your resume here</p>
                    <p className="text-xs text-muted-foreground">or click to browse files</p>
                  </div>
                </button>
              ) : (
                <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3", interviewSurfaceClass)}>
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", interviewAccentIconClass)}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{resumeFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setResumeFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="github" className="text-sm font-medium">
                GitHub profile
              </Label>
              <div className="relative">
                <Code2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="github"
                  placeholder="github.com/username"
                  value={githubUrl}
                  onChange={(event) => setGithubUrl(event.target.value)}
                  className={cn("h-11 pl-10", interviewSurfaceClass)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className={cn("h-11 w-full", interviewPrimaryButtonClass)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing resume...
                </>
              ) : (
                <>
                  Start interview
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your files are processed securely and used only to generate interview questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Resume parsing", "GitHub analysis", "Tailored questions"].map((item) => (
              <span key={item} className={cn("rounded-full px-3 py-1 text-xs text-muted-foreground", interviewSurfaceClass)}>
                {item}
              </span>
            ))}
          </div>
        </GlowingCard>
      </PageContainer>
    </InterviewFlowShell>
  );
}

export default Form;
