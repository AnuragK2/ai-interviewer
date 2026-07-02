import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import type { PreInterviewResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, Code2, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { PageShell } from "./PageShell";

type FormProps = {
  onSuccess?: (profile: PreInterviewResponse) => void;
};

export function Form({ onSuccess }: FormProps) {
  const [githubUrl, setGithubUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

      toast.success("Resume parsed successfully");
      onSuccess?.(data);
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

  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/25 bg-teal-500/10 shadow-[0_0_30px_rgba(45,212,191,0.12)]">
              <Sparkles className="h-6 w-6 text-teal-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                AI Interview
                <span className="bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-300 bg-clip-text text-transparent"> Kickstart</span>
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Upload your resume and connect GitHub. We&apos;ll build a personalized mock interview from your experience.
              </p>
            </div>
          </div>

          <Card className="border-border/60 bg-card/70 shadow-2xl shadow-teal-950/20 backdrop-blur-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl">Get started</CardTitle>
              <CardDescription>PDF, DOCX, or TXT · GitHub public profile</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
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
                      "bg-secondary/30 hover:border-teal-500/40 hover:bg-teal-500/5",
                      isDragging && "border-teal-400 bg-teal-500/10",
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                      <Upload className="h-5 w-5 text-teal-300" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium">Drop your resume here</p>
                      <p className="text-xs text-muted-foreground">or click to browse files</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                      <FileText className="h-5 w-5 text-teal-300" />
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
                    className="h-11 border-border/60 bg-secondary/30 pl-10"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-border/50 pt-6">
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                size="lg"
                className="h-11 w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-amber-500 text-white shadow-lg shadow-teal-950/30 hover:from-teal-500 hover:via-emerald-500 hover:to-amber-400"
              >
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
            </CardFooter>
          </Card>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Resume parsing", "GitHub analysis", "Tailored questions"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-border/50 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default Form;
