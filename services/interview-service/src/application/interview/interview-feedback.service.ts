import type { InterviewFeedbackResponse } from "@ai-interviewer/api-types";
import { generateInterviewReport } from "../reports/interview-report.service";
import { interviewResultsService } from "./interview-results.service";
import { listInterviewMediaAssets } from "./interview-media.service";
import { interviewReportRepository } from "../../infrastructure/db/repositories/interview-report.repository";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";

export async function getInterviewFeedback(interviewId: string): Promise<InterviewFeedbackResponse | null> {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) return null;

  let report = await interviewReportRepository.findByInterviewId(interviewId);
  if (!report && interview.status === "COMPLETED") {
    report = await generateInterviewReport(interviewId);
  }

  const results =
    interview.status === "COMPLETED"
      ? await interviewResultsService.getResults(interviewId)
      : null;

  const media = await listInterviewMediaAssets(interviewId);

  return {
    interview: {
      id: interview.id,
      status: interview.status,
      score: interview.score,
      endReason: interview.endReason,
      startedAt: interview.startedAt ? interview.startedAt.toISOString() : null,
      endedAt: interview.endedAt ? interview.endedAt.toISOString() : null,
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
      applicationId: interview.applicationId,
    },
    results,
    report: report
      ? {
          narrative: report.narrative,
          recommendation: report.recommendation,
          strengths: report.strengths,
          gaps: report.gaps,
          dimensions: {
            communication: report.communication,
            technicalDepth: report.technicalDepth,
            roleFit: report.roleFit,
            clarity: report.clarity,
          },
          generatedAt: report.generatedAt.toISOString(),
        }
      : null,
    media,
  };
}
