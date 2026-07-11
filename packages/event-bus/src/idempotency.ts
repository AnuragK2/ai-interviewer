import type { PlatformEvent, PlatformEventEnvelope } from "@ai-interviewer/api-types";

export type DeadLetterEvent = PlatformEventEnvelope & {
  type: "platform.dead_letter";
  originalSubject: string;
  originalType: string;
  errorMessage: string;
  failedAt: string;
  originalEvent: PlatformEvent;
};

export type IdempotencyStore = {
  hasProcessed: (eventId: string) => Promise<boolean>;
  markProcessed: (eventId: string, subject: string) => Promise<void>;
};

export function createMemoryIdempotencyStore(): IdempotencyStore {
  const processed = new Set<string>();

  return {
    async hasProcessed(eventId) {
      return processed.has(eventId);
    },
    async markProcessed(eventId) {
      processed.add(eventId);
    },
  };
}

export function createPrismaIdempotencyStore(prisma: unknown, consumerName: string): IdempotencyStore {
  const client = prisma as {
    processedEvent: {
      findUnique: (args: {
        where: { consumerName_eventId: { consumerName: string; eventId: string } };
      }) => Promise<{ id: string } | null>;
      create: (args: {
        data: { consumerName: string; eventId: string; subject: string };
      }) => Promise<unknown>;
    };
  };

  return {
    async hasProcessed(eventId) {
      const existing = await client.processedEvent.findUnique({
        where: { consumerName_eventId: { consumerName, eventId } },
      });
      return Boolean(existing);
    },
    async markProcessed(eventId, subject) {
      try {
        await client.processedEvent.create({
          data: { consumerName, eventId, subject },
        });
      } catch {
        // Unique constraint means another worker already recorded it.
      }
    },
  };
}

export function buildDeadLetterEvent(input: {
  subject: string;
  event: PlatformEvent;
  error: unknown;
}): DeadLetterEvent {
  return {
    eventId: input.event.eventId,
    correlationId: input.event.correlationId,
    timestamp: new Date().toISOString(),
    tenantId: input.event.tenantId,
    type: "platform.dead_letter",
    originalSubject: input.subject,
    originalType: input.event.type,
    errorMessage: input.error instanceof Error ? input.error.message : String(input.error),
    failedAt: new Date().toISOString(),
    originalEvent: input.event,
  };
}
