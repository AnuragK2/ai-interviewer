import type {
  CheatSignal,
  ClientInterviewMessage,
  InterviewEndReason,
  ServerInterviewEvent,
} from "@ai-interviewer/api-types";
import {
  createInterviewCancelledEvent,
  createInterviewCompletedEvent,
  createInterviewStartedEvent,
  EventSubjects,
} from "@ai-interviewer/api-types";
import type { WebSocket } from "ws";
import {
  getCandidateEndInstructions,
  getClosingInstructions,
  getWindDownInstructions,
  INTERVIEW_LIMITS,
} from "../../domain/interview/interview-limits";
import { isCandidateEndInterviewRequest } from "../../domain/interview/interview-end-intents";
import { moderateUserText, scoreInterview } from "../../domain/moderation/moderation.service";
import {
  buildProctoringToastMessage,
  PROCTORING_SIGNALS,
  PROCTORING_TERMINATION_MESSAGE,
  PROCTORING_VIOLATION_LIMIT,
} from "../../domain/proctoring/proctoring.messages";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";
import { messageRepository } from "../../infrastructure/db/repositories/message.repository";
import { OpenAIRealtimeSocket } from "../../infrastructure/openai/realtime-socket";
import { publishInterviewEvent } from "../../infrastructure/platform/bootstrap";

type InterviewPhase = "active" | "winding_down" | "closing";

type ResumeData = { name?: string };
type GithubData = { username?: string };

const MIN_USER_SPEECH_MS = 100;

export class InterviewSessionService {
  private openai: OpenAIRealtimeSocket | null = null;
  private interviewId: string | null = null;
  private applicationId: string | null = null;
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
  private userSpeechStartedAt: number | null = null;
  private initialGreetingSent = false;
  private totalViolationCount = 0;
  private awaitingProctoringTermination = false;
  private candidateRequestedEnd = false;
  private closingEndReason: InterviewEndReason = "completed";
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
    console.log(`[interview-session] join requested interviewId=${interviewId}`);

    const interview = await interviewRepository.findById(interviewId);
    if (!interview) {
      console.warn(`[interview-session] interview not found: ${interviewId}`);
      this.sendClient({ type: "error", message: "Interview not found." });
      this.client.close();
      return;
    }

    if (
      interview.status === "CANCELLED" ||
      interview.status === "FAILED" ||
      interview.status === "COMPLETED"
    ) {
      console.warn(`[interview-session] interview inactive status=${interview.status} id=${interviewId}`);
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
    this.applicationId = interview.applicationId ?? null;

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
    this.candidateRequestedEnd = false;
    this.closingEndReason = "completed";

    await interviewRepository.markInProgress(interviewId);

    this.openai = new OpenAIRealtimeSocket({
      interviewId,
      resume: interview.resume,
      githubMetaData: interview.githubMetaData,
      applicationContext: interview.applicationContext,
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
      console.log(`[interview-session] session.ready sent interviewId=${interviewId}`);

      void publishInterviewEvent(
        EventSubjects.INTERVIEW_STARTED,
        createInterviewStartedEvent({
          correlationId: interviewId,
          interviewId,
          applicationId: interview.applicationId ?? undefined,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start interview session.";
      console.error(`[interview-session] join failed interviewId=${interviewId}:`, message);
      await this.endInterview("error", message);
    }
  }

  handleClientMessage(raw: string) {
    let message: ClientInterviewMessage;
    try {
      message = JSON.parse(raw) as ClientInterviewMessage;
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
        this.requestCandidateInitiatedClosing();
        break;
      default:
        break;
    }
  }

  private async handleCheatSignal(signal: CheatSignal) {
    if (this.ended) return;
    if (!PROCTORING_SIGNALS.has(signal)) return;

    this.cheatCounts[signal] += 1;
    this.totalViolationCount += 1;
    this.clearResponseDelayTimer();

    const isFinal = this.totalViolationCount >= PROCTORING_VIOLATION_LIMIT;

    this.sendClient({
      type: "proctoring.warning",
      message: buildProctoringToastMessage(
        signal,
        this.totalViolationCount,
        PROCTORING_VIOLATION_LIMIT,
      ),
      strikes: this.totalViolationCount,
      limit: PROCTORING_VIOLATION_LIMIT,
    });

    this.openai?.cancelResponseIfActive();
    this.openai?.requestProctoringWarning(
      signal,
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
          const message = this.candidateRequestedEnd
            ? "Thank you for your time. The interview has ended."
            : "Interview completed. Thank you for participating!";
          await this.endInterview(this.closingEndReason, message);
          return;
        }

        if (this.awaitingProctoringTermination) {
          await this.endInterview("cheat", PROCTORING_TERMINATION_MESSAGE);
          return;
        }

        this.evaluateInterviewProgress();
        break;
      case "input_audio_buffer.speech_started":
        this.userSpeechStartedAt = Date.now();
        this.clearResponseDelayTimer();
        this.sendClient({ type: "user_speaking", speaking: true });
        break;
      case "input_audio_buffer.speech_stopped": {
        const speechMs = this.userSpeechStartedAt ? Date.now() - this.userSpeechStartedAt : 0;
        this.userSpeechStartedAt = null;
        this.sendClient({ type: "user_speaking", speaking: false });

        if (speechMs >= MIN_USER_SPEECH_MS) {
          this.openai?.commitInputBuffer();
          this.scheduleAgentResponse();
        }
        break;
      }
      case "input_audio_buffer.committed":
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
      case "error": {
        const message =
          typeof event.error === "object" && event.error && "message" in event.error
            ? String((event.error as { message: string }).message)
            : "OpenAI error.";

        if (/no active response found/i.test(message)) break;
        if (/buffer too small/i.test(message)) break;

        this.sendClient({ type: "error", message });
        break;
      }
      default:
        break;
    }
  }

  private scheduleAgentResponse() {
    if (this.ended || this.awaitingClosingResponse || !this.openai) return;

    this.clearResponseDelayTimer();
    const delayMs =
      this.userTurnCount === 0
        ? INTERVIEW_LIMITS.FIRST_TURN_END_DELAY_MS
        : INTERVIEW_LIMITS.USER_TURN_END_DELAY_MS;

    this.responseDelayTimer = setTimeout(() => {
      this.responseDelayTimer = null;
      if (this.ended || this.awaitingClosingResponse || !this.openai) return;
      this.openai.createResponse();
    }, delayMs);
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

    if (
      !this.closingRequested &&
      !this.awaitingClosingResponse &&
      isCandidateEndInterviewRequest(transcript)
    ) {
      this.requestCandidateInitiatedClosing();
      return;
    }

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
    this.closingEndReason = "completed";
    this.clearResponseDelayTimer();
    this.openai.appendInstructions(getClosingInstructions());
    this.openai.cancelResponseIfActive();
    this.openai.requestClosingRemark(this.candidateName);
    this.awaitingClosingResponse = true;
  }

  private requestCandidateInitiatedClosing() {
    if (this.closingRequested || this.awaitingClosingResponse || !this.openai) return;

    this.closingRequested = true;
    this.candidateRequestedEnd = true;
    this.closingEndReason = "client_end";
    this.interviewPhase = "closing";
    this.clearResponseDelayTimer();
    this.openai.cancelResponseIfActive();
    this.openai.appendInstructions(getCandidateEndInstructions());
    this.openai.requestCandidateEndClosing(this.candidateName);
    this.awaitingClosingResponse = true;
  }

  private async persistMessage(participant: "User" | "Assistant", message: string) {
    if (!this.interviewId || !message.trim()) return;
    await messageRepository.create(this.interviewId, participant, message);
  }

  async endInterview(reason: InterviewEndReason, message: string) {
    if (this.ended) return;
    this.ended = true;

    this.clearProgressTimer();
    this.clearResponseDelayTimer();
    this.openai?.close();
    this.openai = null;

    let score = 0;
    if (this.interviewId) {
      const messages = await messageRepository.findByInterviewId(this.interviewId);
      score = reason === "cheat" ? 0 : scoreInterview(messages);

      if (reason === "completed" || reason === "client_end") {
        await interviewRepository.complete(this.interviewId, score);
      } else if (reason === "cheat") {
        await interviewRepository.cancel(this.interviewId, score);
      } else {
        await interviewRepository.fail(this.interviewId, score);
      }
    }

    this.sendClient({
      type: "interview.ended",
      reason,
      message,
      score,
    });

    if (!this.interviewId) {
      try {
        this.client.close();
      } catch {
        // ignore
      }
      return;
    }

    const correlationId = this.interviewId;

    if (reason === "cheat" || reason === "error") {
      void publishInterviewEvent(
        EventSubjects.INTERVIEW_CANCELLED,
        createInterviewCancelledEvent({
          correlationId,
          interviewId: this.interviewId,
          applicationId: this.applicationId ?? undefined,
          reason,
        }),
      );
    } else {
      void publishInterviewEvent(
        EventSubjects.INTERVIEW_COMPLETED,
        createInterviewCompletedEvent({
          correlationId,
          interviewId: this.interviewId,
          applicationId: this.applicationId ?? undefined,
          score,
          reason,
        }),
      );
    }

    try {
      this.client.close();
    } catch {
      // ignore
    }
  }

  private sendClient(payload: ServerInterviewEvent) {
    if (this.client.readyState !== this.client.OPEN) return;
    try {
      this.client.send(JSON.stringify(payload));
    } catch {
      // ignore
    }
  }
}