import type { InterviewResultsResponse, ParsedResume } from "@ai-interviewer/api-types";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";

export class InterviewResultsService {
  async getResults(interviewId: string): Promise<InterviewResultsResponse | null> {
    const interview = await interviewRepository.findByIdWithMessages(interviewId);
    if (!interview) return null;

    if (interview.status !== "COMPLETED") {
      throw new ResultsNotReadyError(interview.status);
    }

    const resume = (interview.resume ?? {}) as ParsedResume;
    const github = (interview.githubMetaData ?? {}) as { username?: string };
    const userMessages = interview.conversations.filter((m) => m.participant === "User");
    const assistantMessages = interview.conversations.filter((m) => m.participant === "Assistant");
    const durationMs = interview.updatedAt.getTime() - interview.createdAt.getTime();

    return {
      interview: {
        id: interview.id,
        status: interview.status,
        score: interview.score,
        createdAt: interview.createdAt.toISOString(),
        updatedAt: interview.updatedAt.toISOString(),
      },
      candidate: {
        name: resume.name ?? null,
        githubUsername: github.username ?? null,
      },
      stats: {
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        durationMinutes: Math.max(1, Math.round(durationMs / 60_000)),
      },
      messages: interview.conversations.map((message) => ({
        id: message.id,
        participant: message.participant,
        message: message.message,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }
}

export class ResultsNotReadyError extends Error {
  constructor(public readonly status: string) {
    super("Interview results are not available yet.");
    this.name = "ResultsNotReadyError";
  }
}

export const interviewResultsService = new InterviewResultsService();
