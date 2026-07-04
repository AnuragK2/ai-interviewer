import type { WebSocket } from "ws";
import { prisma } from "../db";
import {
  getClosingInstructions,
  getWindDownInstructions,
  INTERVIEW_LIMITS,
} from "./interviewLimits";
import { moderateUserText, scoreInterview } from "./moderation";
import {
  buildProctoringToastMessage,
  PROCTORING_SIGNALS,
  PROCTORING_TERMINATION_MESSAGE,
  PROCTORING_VIOLATION_LIMIT,
  type ProctoringSignal,
} from "./proctoringMessages";
import { OpenAIRealtimeSocket } from "./openaiRealtimeSocket";

type ClientMessage =
  | { type: "join"; interviewId: string }
  | { type: "input_audio"; audio: string }
  | { type: "cheat_signal"; signal: CheatSignal }
  | { type: "end_interview" };

type CheatSignal =
  | "tab_hidden"
  | "window_blur"
  | "copy"
  | "paste"
  | "face_not_visible"
  | "looking_away"
  | "camera_disabled";

type EndReason = "cheat" | "completed" | "error" | "client_end";

type InterviewPhase = "active" | "winding_down" | "closing";

type ResumeData = { name?: string };
type GithubData = { username?: string };

/** Extra wait after the candidate stops speaking before the agent responds. */
const USER_TURN_END_DELAY_MS = 2_000;

export class InterviewRuntime {
  private openai: OpenAIRealtimeSocket | null = null;
  private interviewId: string | null = null;
  private ended = false;
  private agentTranscript = "";
  private startedAt = 0;
  private userTurnCount = 0;
  private assistantTurnCount = 0;
  private candidateName = "the candidate";
  private interviewPhase: InterviewPhase = "active";
  private windDownSent = false;
  private closingRequested = false;
  private awaitingClosingResponse = false;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private responseDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private initialGreetingSent = false;
  private totalViolationCount = 0;
  private awaitingProctoringTermination = false;
  private cheatCounts: Record<CheatSignal, number> = {
    tab_hidden: 0,
    window_blur: 0,
    copy: 0,
    paste: 0,
    face_not_visible: 0,
    looking_away: 0,
    camera_disabled: 0,
  };

  constructor(private readonly client: WebSocket) {}

  async join(interviewId: string) {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) {
      this.sendClient({ type: "error", message: "Interview not found." });
      this.client.close();
      return;
    }

    if (
      interview.status === "CANCELLED" ||
      interview.status === "FAILED" ||
      interview.status === "COMPLETED"
    ) {
      this.sendClient({
        type: "interview.ended",
        reason: interview.status === "COMPLETED" ? "completed" : "error",
        message: "This interview is no longer active.",
        score: interview.score,
      });
      this.client.close();
      return;
    }

    this.interviewId = interviewId;

    const resume = (interview.resume ?? {}) as ResumeData;
    const github = (interview.githubMetaData ?? {}) as GithubData;
    this.candidateName = resume.name ?? github.username ?? "the candidate";
    this.startedAt = Date.now();
    this.userTurnCount = 0;
    this.assistantTurnCount = 0;
    this.interviewPhase = "active";
    this.windDownSent = false;
    this.closingRequested = false;
    this.awaitingClosingResponse = false;

    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "IN_PROGRESS" },
    });

    this.openai = new OpenAIRealtimeSocket({
      interviewId,
      resume: interview.resume,
      githubMetaData: interview.githubMetaData,
      onEvent: (event) => {
        void this.handleOpenAIEvent(event);
      },
      onClose: () => {
        if (!this.ended) {
          void this.endInterview("error", "Realtime connection closed.");
        }
      },
      onError: (message) => {
        this.sendClient({ type: "error", message });
      },
    });

    try {
      await this.openai.connect();
      this.startProgressTimer();
      this.sendClient({ type: "session.ready" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start interview session.";
      await this.endInterview("error", message);
    }
  }

  handleClientMessage(raw: string) {
    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      this.sendClient({ type: "error", message: "Invalid client message." });
      return;
    }

    switch (message.type) {
      case "join":
        void this.join(message.interviewId);
        break;
      case "input_audio":
        if (!this.ended && message.audio) {
          this.openai?.appendAudio(message.audio);
        }
        break;
      case "cheat_signal":
        void this.handleCheatSignal(message.signal);
        break;
      case "end_interview":
        void this.endInterview("client_end", "Interview ended by candidate.");
        break;
      default:
        break;
    }
  }

  private async handleCheatSignal(signal: CheatSignal) {
    if (this.ended) return;
    if (!PROCTORING_SIGNALS.has(signal as ProctoringSignal)) return;

    this.cheatCounts[signal] += 1;
    this.totalViolationCount += 1;
    this.clearResponseDelayTimer();

    const proctoringSignal = signal as ProctoringSignal;
    const isFinal = this.totalViolationCount >= PROCTORING_VIOLATION_LIMIT;

    this.sendClient({
      type: "proctoring.warning",
      message: buildProctoringToastMessage(
        proctoringSignal,
        this.totalViolationCount,
        PROCTORING_VIOLATION_LIMIT,
      ),
      strikes: this.totalViolationCount,
      limit: PROCTORING_VIOLATION_LIMIT,
    });

    this.openai?.cancelResponse();
    this.openai?.requestProctoringWarning(
      proctoringSignal,
      this.totalViolationCount,
      PROCTORING_VIOLATION_LIMIT,
      isFinal,
    );

    if (isFinal) {
      this.awaitingProctoringTermination = true;
    }
  }

  private async handleOpenAIEvent(event: Record<string, unknown>) {
    if (this.ended) return;
    const type = String(event.type ?? "");

    switch (type) {
      case "response.created":
      case "output_audio_buffer.started":
        this.sendClient({ type: "agent_speaking", speaking: true });
        break;
      case "response.output_audio.delta":
      case "response.audio.delta":
        this.sendClient({ type: "agent_speaking", speaking: true });
        if (typeof event.delta === "string" && event.delta) {
          this.sendClient({ type: "output_audio", audio: event.delta });
        }
        break;
      case "response.done":
      case "response.output_audio.done":
      case "response.audio.done":
      case "output_audio_buffer.stopped":
        this.sendClient({ type: "agent_speaking", speaking: false });
        if (this.agentTranscript.trim()) {
          const text = this.agentTranscript.trim();
          this.agentTranscript = "";
          await this.persistMessage("Assistant", text);
          this.assistantTurnCount += 1;
          this.sendClient({
            type: "transcript",
            role: "agent",
            text,
            final: true,
          });
        }

        if (this.awaitingClosingResponse) {
          await this.endInterview("completed", "Interview completed. Thank you for participating!");
          return;
        }

        if (this.awaitingProctoringTermination) {
          await this.endInterview("cheat", PROCTORING_TERMINATION_MESSAGE);
          return;
        }

        this.evaluateInterviewProgress();
        break;
      case "input_audio_buffer.speech_started":
        this.clearResponseDelayTimer();
        this.sendClient({ type: "user_speaking", speaking: true });
        break;
      case "input_audio_buffer.speech_stopped":
        this.sendClient({ type: "user_speaking", speaking: false });
        this.scheduleAgentResponse();
        break;
      case "session.created":
      case "session.updated":
        if (!this.initialGreetingSent && this.openai) {
          this.initialGreetingSent = true;
          this.openai.startConversation();
        }
        break;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
      case "response.output_text.delta":
      case "response.text.delta":
        if (typeof event.delta === "string" && event.delta) {
          this.agentTranscript += event.delta;
          this.sendClient({
            type: "transcript",
            role: "agent",
            text: event.delta,
            final: false,
          });
        }
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        if (typeof event.transcript === "string" && event.transcript.trim()) {
          this.agentTranscript = event.transcript;
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        if (typeof event.transcript === "string" && event.transcript.trim()) {
          await this.handleUserTranscript(event.transcript);
        }
        break;
      case "error":
        this.sendClient({
          type: "error",
          message: typeof event.error === "object" && event.error && "message" in event.error
            ? String((event.error as { message: string }).message)
            : "OpenAI error.",
        });
        break;
      default:
        break;
    }
  }

  private scheduleAgentResponse() {
    if (this.ended || this.awaitingClosingResponse || !this.openai) return;

    this.clearResponseDelayTimer();
    this.responseDelayTimer = setTimeout(() => {
      this.responseDelayTimer = null;
      if (this.ended || this.awaitingClosingResponse || !this.openai) return;
      this.openai.commitInputAndRespond();
    }, USER_TURN_END_DELAY_MS);
  }

  private clearResponseDelayTimer() {
    if (this.responseDelayTimer) {
      clearTimeout(this.responseDelayTimer);
      this.responseDelayTimer = null;
    }
  }

  private async handleUserTranscript(transcript: string) {
    const moderation = moderateUserText(transcript);
    if (!moderation.allowed) {
      await this.endInterview("cheat", moderation.reason ?? "Moderation check failed.");
      return;
    }

    await this.persistMessage("User", transcript);
    this.userTurnCount += 1;
    this.sendClient({
      type: "transcript",
      role: "user",
      text: transcript,
      final: true,
    });

    this.evaluateInterviewProgress();
  }

  private startProgressTimer() {
    this.clearProgressTimer();
    this.progressTimer = setInterval(() => {
      this.evaluateInterviewProgress();
    }, INTERVIEW_LIMITS.PROGRESS_CHECK_INTERVAL_MS);
  }

  private clearProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private evaluateInterviewProgress() {
    if (this.ended || this.awaitingClosingResponse || !this.openai) return;

    const elapsedMs = Date.now() - this.startedAt;
    const reachedQuestionLimit = this.userTurnCount >= INTERVIEW_LIMITS.MAX_QUESTIONS;
    const reachedTimeLimit = elapsedMs >= INTERVIEW_LIMITS.MAX_DURATION_MS;
    const shouldWindDown =
      !this.windDownSent &&
      (this.userTurnCount >= INTERVIEW_LIMITS.TARGET_QUESTIONS ||
        elapsedMs >= INTERVIEW_LIMITS.TARGET_DURATION_MS);

    if (reachedQuestionLimit || reachedTimeLimit) {
      this.requestInterviewClosing();
      return;
    }

    if (shouldWindDown) {
      this.windDownSent = true;
      this.interviewPhase = "winding_down";
      this.openai.appendInstructions(getWindDownInstructions());
    }
  }

  private requestInterviewClosing() {
    if (this.closingRequested || this.awaitingClosingResponse || !this.openai) return;

    this.closingRequested = true;
    this.interviewPhase = "closing";
    this.clearResponseDelayTimer();
    this.openai.appendInstructions(getClosingInstructions());
    this.openai.cancelResponse();
    this.openai.requestClosingRemark(this.candidateName);
    this.awaitingClosingResponse = true;
  }

  private async persistMessage(participant: "User" | "Assistant", message: string) {
    if (!this.interviewId || !message.trim()) return;

    await prisma.message.create({
      data: {
        interviewId: this.interviewId,
        participant,
        message: message.trim(),
      },
    });
  }

  async endInterview(reason: EndReason, message: string) {
    if (this.ended) return;
    this.ended = true;

    this.clearProgressTimer();
    this.clearResponseDelayTimer();
    this.openai?.close();
    this.openai = null;

    let score = 0;
    if (this.interviewId) {
      const messages = await prisma.message.findMany({
        where: { interviewId: this.interviewId },
        select: { participant: true, message: true },
      });

      score = reason === "cheat" ? 0 : scoreInterview(messages);

      const status =
        reason === "completed" || reason === "client_end"
          ? "COMPLETED"
          : reason === "cheat"
            ? "CANCELLED"
            : "FAILED";

      await prisma.interview.update({
        where: { id: this.interviewId },
        data: { status, score },
      });
    }

    this.sendClient({
      type: "interview.ended",
      reason,
      message,
      score,
    });

    try {
      this.client.close();
    } catch {
      // ignore
    }
  }

  private sendClient(payload: Record<string, unknown>) {
    if (this.client.readyState !== this.client.OPEN) return;
    try {
      this.client.send(JSON.stringify(payload));
    } catch {
      // ignore
    }
  }
}
