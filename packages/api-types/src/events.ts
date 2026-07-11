/** Base envelope for all platform events (NATS subjects). */
export type PlatformEventEnvelope = {
  eventId: string;
  correlationId: string;
  timestamp: string;
  tenantId?: string;
};

export type InterviewCompletedEvent = PlatformEventEnvelope & {
  type: "interview.completed";
  interviewId: string;
  applicationId?: string;
  score: number;
  reason: string;
};

export type InterviewCancelledEvent = PlatformEventEnvelope & {
  type: "interview.cancelled";
  interviewId: string;
  applicationId?: string;
  reason: string;
};

export type InterviewStartedEvent = PlatformEventEnvelope & {
  type: "interview.started";
  interviewId: string;
  applicationId?: string;
};

export type ApplicationCreatedEvent = PlatformEventEnvelope & {
  type: "application.created";
  applicationId: string;
  jobId: string;
  candidateUserId: string;
};

export type ProfileAnalyzedEvent = PlatformEventEnvelope & {
  type: "profile.analyzed";
  applicationId: string;
  fitScore: number;
};

export type ApplicationInvitedEvent = PlatformEventEnvelope & {
  type: "application.invited";
  applicationId: string;
  interviewId: string;
  candidateUserId: string;
};

export type PlatformEvent =
  | InterviewCompletedEvent
  | InterviewCancelledEvent
  | InterviewStartedEvent
  | ApplicationCreatedEvent
  | ProfileAnalyzedEvent
  | ApplicationInvitedEvent;

/** NATS subject names */
export const EventSubjects = {
  INTERVIEW_COMPLETED: "interview.completed",
  INTERVIEW_CANCELLED: "interview.cancelled",
  INTERVIEW_STARTED: "interview.started",
  APPLICATION_CREATED: "application.created",
  PROFILE_ANALYZED: "profile.analyzed",
  APPLICATION_INVITED: "application.invited",
} as const;

export function createEventId() {
  return crypto.randomUUID();
}

export function createPlatformEvent<T extends PlatformEvent["type"]>(
  partial: Omit<Extract<PlatformEvent, { type: T }>, "eventId" | "timestamp"> & {
    eventId?: string;
    timestamp?: string;
  },
): Extract<PlatformEvent, { type: T }> {
  return {
    eventId: partial.eventId ?? createEventId(),
    timestamp: partial.timestamp ?? new Date().toISOString(),
    ...partial,
  } as Extract<PlatformEvent, { type: T }>;
}

export function createInterviewStartedEvent(
  data: Omit<InterviewStartedEvent, "eventId" | "timestamp" | "type">,
): InterviewStartedEvent {
  return createPlatformEvent<"interview.started">({ type: "interview.started", ...data });
}

export function createInterviewCompletedEvent(
  data: Omit<InterviewCompletedEvent, "eventId" | "timestamp" | "type">,
): InterviewCompletedEvent {
  return createPlatformEvent<"interview.completed">({ type: "interview.completed", ...data });
}

export function createInterviewCancelledEvent(
  data: Omit<InterviewCancelledEvent, "eventId" | "timestamp" | "type">,
): InterviewCancelledEvent {
  return createPlatformEvent<"interview.cancelled">({ type: "interview.cancelled", ...data });
}

export function createApplicationInvitedEvent(
  data: Omit<ApplicationInvitedEvent, "eventId" | "timestamp" | "type">,
): ApplicationInvitedEvent {
  return createPlatformEvent<"application.invited">({ type: "application.invited", ...data });
}
