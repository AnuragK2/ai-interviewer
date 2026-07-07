import { getEventBus } from "@ai-interviewer/event-bus";

export async function bootstrapPlatform() {
  try {
    const bus = await getEventBus({ name: "identity-service" });
    if (bus.isConnected()) {
      console.log("[platform] NATS connected");
    }
  } catch (error) {
    console.warn("[platform] NATS unavailable — events disabled:", (error as Error).message);
  }
}
