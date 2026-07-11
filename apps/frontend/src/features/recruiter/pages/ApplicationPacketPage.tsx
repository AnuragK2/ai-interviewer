import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import type { RecruiterApplicationPacketResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import * as applicationApi from "@/features/applications/services/application-api";

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function RecruiterApplicationPacketPage() {
  const { id } = useParams();
  const [packet, setPacket] = useState<RecruiterApplicationPacketResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void applicationApi
      .getRecruiterApplicationPacket(id)
      .then(setPacket)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load application packet."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Applicant packet"
        title={loading ? "Loading…" : "Application packet"}
        description={packet?.application.id}
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
          <CardDescription>Async fit analysis produced shortly after the candidate applies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !packet ? (
            <p className="text-sm text-muted-foreground">Not found.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{packet.application.status}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Fit score</p>
                  <p className="text-sm font-medium">
                    {packet.application.fitScore !== null ? `${packet.application.fitScore}/100` : "Pending"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Candidate</p>
                  <p className="text-sm font-mono">{packet.application.candidateUserId}</p>
                </div>
              </div>

              {packet.application.fitSummary ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Summary</p>
                  <p className="text-sm leading-relaxed">{packet.application.fitSummary}</p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Strengths</p>
                  {packet.application.strengths.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {packet.application.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Concerns</p>
                  {packet.application.concerns.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {packet.application.concerns.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              {packet.application.coverLetter ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cover letter</p>
                  <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
                    {packet.application.coverLetter}
                  </pre>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </GlowingCard>

      <Card className="border-white/10 bg-card/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Snapshots</CardTitle>
          <CardDescription>What the system used for matching at apply time.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Job snapshot</p>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-4 text-xs">
              {packet ? prettyJson(packet.jobSnapshot) : ""}
            </pre>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Candidate snapshot</p>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-4 text-xs">
              {packet ? prettyJson(packet.candidateSnapshot) : ""}
            </pre>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
