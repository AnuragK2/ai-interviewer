import { getObjectStorage } from "@ai-interviewer/object-storage";
import { env } from "../../config/env";

export async function bootstrapPlatform() {
  try {
    const storage = getObjectStorage({
      endPoint: env.minioEndpoint,
      port: env.minioPort,
      useSSL: env.minioUseSsl,
      accessKey: env.minioAccessKey,
      secretKey: env.minioSecretKey,
      defaultBucket: env.minioBucket,
    });
    await storage.ensureBucket();
    console.log("[platform] MinIO bucket ready");
  } catch (error) {
    console.warn("[platform] MinIO unavailable — resume storage disabled:", (error as Error).message);
  }
}
