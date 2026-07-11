import { scoreInterview } from "../../domain/moderation/moderation.service";
import { interviewReportRepository } from "../../infrastructure/db/repositories/interview-report.repository";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";
import { env } from "../../config/env";

type ReportDimensions = {
  communication: number;
  technicalDepth: number;
  roleFit: number;
  clarity: number;
};

type GeneratedReport = {
  narrative: string;
  recommendation: string;
  strengths: string[];
  gaps: string[];
} & ReportDimensions;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildHeuristicReport(input: {
  score: number;
  messages: Array<{ participant: "User" | "Assistant"; message: string }>;
  applicationContext: unknown;
}): GeneratedReport {
  const userMessages = input.messages.filter((message) => message.participant === "User");
  const avgLength =
    userMessages.length > 0
      ? userMessages.reduce((sum, message) => sum + message.message.trim().length, 0) / userMessages.length
      : 0;

  const context = (input.applicationContext ?? {}) as {
    fitSummary?: string | null;
    strengths?: string[];
    concerns?: string[];
    jobSnapshot?: { title?: string };
  };

  const communication = clampScore(input.score * 0.9 + Math.min(15, userMessages.length * 2));
  const technicalDepth = clampScore(avgLength / 2 + input.score * 0.4);
  const roleFit = clampScore(input.score * 0.85 + (context.strengths?.length ?? 0) * 4);
  const clarity = clampScore(input.score * 0.8 + Math.min(20, userMessages.length * 3));

  const recommendation =
    input.score >= 80 ? "STRONG_YES" : input.score >= 65 ? "YES" : input.score >= 45 ? "REVIEW" : "NO";

  const strengths = [
    ...(context.strengths?.slice(0, 3) ?? []),
    userMessages.length >= 6 ? "Sustained engagement across multiple interview answers." : "",
    avgLength >= 80 ? "Answers included useful detail and context." : "",
  ].filter(Boolean);

  const gaps = [
    ...(context.concerns?.slice(0, 3) ?? []),
    userMessages.length < 4 ? "Limited number of substantive responses captured in the transcript." : "",
    avgLength < 40 ? "Several answers were brief; depth was hard to validate." : "",
  ].filter(Boolean);

  const roleTitle = context.jobSnapshot?.title ?? "the role";
  const narrative = [
    `Interview performance score: ${input.score}/100 for ${roleTitle}.`,
    context.fitSummary ? `Pre-interview fit context: ${context.fitSummary}` : "",
    userMessages.length > 0
      ? `The candidate provided ${userMessages.length} spoken responses with an average answer length of ${Math.round(avgLength)} characters.`
      : "The transcript contains limited candidate responses.",
    recommendation === "STRONG_YES" || recommendation === "YES"
      ? "Overall, the interview supports moving forward with structured follow-up or shortlist consideration."
      : recommendation === "REVIEW"
        ? "The interview shows mixed signals; a human reviewer should validate technical depth before advancing."
        : "The interview did not surface enough evidence of strong role fit.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    narrative,
    recommendation,
    strengths: strengths.length > 0 ? strengths : ["Candidate completed the full interview session."],
    gaps: gaps.length > 0 ? gaps : ["No major gaps flagged automatically; manual review still recommended."],
    communication,
    technicalDepth,
    roleFit,
    clarity,
  };
}

async function buildAiReport(input: {
  score: number;
  messages: Array<{ participant: "User" | "Assistant"; message: string }>;
  applicationContext: unknown;
}): Promise<GeneratedReport | null> {
  if (!env.openaiApiKey) return null;

  const transcript = input.messages
    .map((message) => `${message.participant}: ${message.message}`)
    .join("\n")
    .slice(0, 12000);

  const context = JSON.stringify(input.applicationContext).slice(0, 4000);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical interviewer writing a concise recruiter-facing post-interview report. Return JSON with keys: narrative, recommendation (STRONG_YES|YES|REVIEW|NO), strengths (string[]), gaps (string[]), communication, technicalDepth, roleFit, clarity (0-100 integers).",
        },
        {
          role: "user",
          content: `Interview score: ${input.score}/100\nApplication context: ${context}\nTranscript:\n${transcript}`,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Partial<GeneratedReport>;
    if (!parsed.narrative || !parsed.recommendation) return null;
    return {
      narrative: parsed.narrative,
      recommendation: parsed.recommendation,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
      communication: clampScore(parsed.communication ?? input.score),
      technicalDepth: clampScore(parsed.technicalDepth ?? input.score),
      roleFit: clampScore(parsed.roleFit ?? input.score),
      clarity: clampScore(parsed.clarity ?? input.score),
    };
  } catch {
    return null;
  }
}

export async function generateInterviewReport(interviewId: string) {
  const existing = await interviewReportRepository.findByInterviewId(interviewId);
  if (existing) return existing;

  const interview = await interviewRepository.findByIdWithMessages(interviewId);
  if (!interview || interview.status !== "COMPLETED") return null;

  const messages = interview.conversations.map((message) => ({
    participant: message.participant,
    message: message.message,
  }));

  const score = interview.score || scoreInterview(messages);
  const generated =
    (await buildAiReport({
      score,
      messages,
      applicationContext: interview.applicationContext,
    })) ??
    buildHeuristicReport({
      score,
      messages,
      applicationContext: interview.applicationContext,
    });

  return interviewReportRepository.create({
    interviewId,
    ...generated,
  });
}
