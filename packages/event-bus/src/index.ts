import { connect, JSONCodec, type NatsConnection, type Subscription } from "nats";
import type { PlatformEvent } from "@ai-interviewer/api-types";
import {
  buildDeadLetterEvent,
  type DeadLetterEvent,
  type IdempotencyStore,
} from "./idempotency";

export type { DeadLetterEvent, IdempotencyStore } from "./idempotency";
export { createMemoryIdempotencyStore, createPrismaIdempotencyStore, buildDeadLetterEvent } from "./idempotency";

export type EventBusOptions = {
  servers?: string;
  name?: string;
};

export type SubscribeOptions = {
  consumerName: string;
  idempotency?: IdempotencyStore;
  deadLetterSubject?: string;
};

export class EventBus {
  private readonly codec = JSONCodec<PlatformEvent>();
  private readonly deadLetterCodec = JSONCodec<DeadLetterEvent>();
  private subscriptions: Subscription[] = [];

  private constructor(private readonly nc: NatsConnection) {}

  static async connect(options: EventBusOptions = {}) {
    const servers = options.servers ?? process.env.NATS_URL ?? "nats://localhost:4222";
    const nc = await connect({ servers, name: options.name ?? "platform-client" });
    return new EventBus(nc);
  }

  async publish(subject: string, event: PlatformEvent) {
    this.nc.publish(subject, this.codec.encode(event));
  }

  async publishDeadLetter(subject: string, event: DeadLetterEvent) {
    this.nc.publish(subject, this.deadLetterCodec.encode(event));
  }

  async subscribe<T extends PlatformEvent>(
    subject: string,
    handler: (event: T) => void | Promise<void>,
    options?: SubscribeOptions,
  ) {
    const sub = this.nc.subscribe(subject);
    this.subscriptions.push(sub);

    void (async () => {
      for await (const msg of sub) {
        let event: T | null = null;
        try {
          event = this.codec.decode(msg.data) as T;

          if (options?.idempotency && (await options.idempotency.hasProcessed(event.eventId))) {
            console.log(`[event-bus] skip duplicate event ${event.eventId} (${options.consumerName})`);
            continue;
          }

          await handler(event);

          if (options?.idempotency) {
            await options.idempotency.markProcessed(event.eventId, subject);
          }
        } catch (error) {
          console.error(`[event-bus] handler error on ${subject}:`, error);

          if (event) {
            const dlqSubject = options?.deadLetterSubject ?? `${subject}.dlq`;
            const deadLetter = buildDeadLetterEvent({ subject, event, error });
            try {
              await this.publishDeadLetter(dlqSubject, deadLetter);
              console.error(`[event-bus] published dead letter to ${dlqSubject} for ${event.eventId}`);
            } catch (publishError) {
              console.error(`[event-bus] failed to publish dead letter for ${event.eventId}:`, publishError);
            }
          }
        }
      }
    })();
  }

  async drain() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    await this.nc.drain();
  }

  isConnected() {
    return !this.nc.isClosed();
  }
}

/** Singleton for service process lifecycle */
let bus: EventBus | null = null;

export async function getEventBus(options?: EventBusOptions) {
  if (!bus || !bus.isConnected()) {
    bus = await EventBus.connect(options);
  }
  return bus;
}

export async function closeEventBus() {
  if (bus) {
    await bus.drain();
    bus = null;
  }
}
