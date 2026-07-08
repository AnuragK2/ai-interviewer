import type { GithubProfileData, ParsedResume } from "./resume";

/** Resume parsing & profile data */
export type { GithubProfileData, GithubRepoSummary, ParsedResume } from "./resume";

/** REST API contracts */
export type InterviewSummary = {
  id: string;
  status: string;
  score: number;
  createdAt: string;
};

export type PreInterviewResponse = {
  interview: InterviewSummary;
  resume: ParsedResume;
  github: GithubProfileData;
};

export type InterviewResultMessage = {
  id: string;
  participant: "User" | "Assistant";
  message: string;
  createdAt: string;
};

export type InterviewResultsResponse = {
  interview: InterviewSummary & { updatedAt: string };
  candidate: {
    name: string | null;
    githubUsername: string | null;
  };
  stats: {
    userMessages: number;
    assistantMessages: number;
    durationMinutes: number;
  };
  messages: InterviewResultMessage[];
};

/** WebSocket interview protocol */
export type CheatSignal =
  | "tab_hidden"
  | "window_blur"
  | "copy"
  | "paste"
  | "face_not_visible"
  | "looking_away"
  | "camera_disabled";

export type ProctoringSignal = CheatSignal;

export type InterviewEndReason = "cheat" | "completed" | "error" | "client_end";

export type ClientInterviewMessage =
  | { type: "join"; interviewId: string }
  | { type: "input_audio"; audio: string }
  | { type: "cheat_signal"; signal: CheatSignal }
  | { type: "end_interview" };

export type ServerInterviewEvent =
  | { type: "session.ready" }
  | { type: "transcript"; role: "agent" | "user"; text: string; final?: boolean }
  | { type: "agent_speaking"; speaking: boolean }
  | { type: "user_speaking"; speaking: boolean }
  | { type: "output_audio"; audio: string }
  | { type: "proctoring.warning"; message: string; strikes: number; limit: number }
  | { type: "interview.ended"; reason: InterviewEndReason; message: string; score?: number }
  | { type: "error"; message: string };

export type {
  ApplicationCreatedEvent,
  ApplicationInvitedEvent,
  InterviewCancelledEvent,
  InterviewCompletedEvent,
  InterviewStartedEvent,
  PlatformEvent,
  PlatformEventEnvelope,
  ProfileAnalyzedEvent,
} from "./events";
export {
  createEventId,
  createInterviewCancelledEvent,
  createInterviewCompletedEvent,
  createInterviewStartedEvent,
  createPlatformEvent,
  EventSubjects,
} from "./events";
export type {
  AuthResponse,
  AuthUser,
  CompanySummary,
  LoginRequest,
  OAuthProvider,
  OAuthProviderKey,
  OAuthProvidersResponse,
  RegisterCandidateRequest,
  RegisterRecruiterRequest,
  UserRole,
} from "./auth";
export {
  LoginRequestSchema,
  RegisterCandidateRequestSchema,
  RegisterRecruiterRequestSchema,
} from "./auth";
export type {
  CandidateProfileResponse,
  EducationEntry,
  EmploymentType,
  ExperienceEntry,
  ProfileLinks,
  ProfilePreferences,
  ProfileResumeInfo,
  ResumeDownloadResponse,
  SkillEntry,
  UpdateCandidateProfileRequest,
  WorkStyle,
} from "./profile";
export { UpdateCandidateProfileSchema } from "./profile";
