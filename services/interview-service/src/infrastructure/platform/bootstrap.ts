import { getEventBus } from "@ai-interviewer/event-bus";
import { getObjectStorage } from "@ai-interviewer/object-storage";

export async function bootstrapPlatform() {
  const results: { nats: boolean; minio: boolean } = { nats: false, minio: false };

  try {
    const bus = await getEventBus({ name: "interview-service" });
    results.nats = bus.isConnected();
    console.log("[platform] NATS connected");
  } catch (error) {
    console.warn("[platform] NATS unavailable — events disabled:", (error as Error).message);
  }

  try {
    const storage = getObjectStorage();
    await storage.ensureBucket();
    results.minio = true;
    console.log("[platform] MinIO bucket ready");
  } catch (error) {
    console.warn("[platform] MinIO unavailable — object storage disabled:", (error as Error).message);
  }

  return results;
}

export async function publishInterviewEvent(
  subject: string,
  event: Parameters<Awaited<ReturnType<typeof getEventBus>>["publish"]>[1],
) {
  try {
    const bus = await getEventBus({ name: "interview-service" });
    await bus.publish(subject, event);
  } catch {
    // NATS optional in local dev without docker
  }
}
