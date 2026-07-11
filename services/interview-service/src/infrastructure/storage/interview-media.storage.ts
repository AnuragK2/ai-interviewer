import { getObjectStorage } from "@ai-interviewer/object-storage";
import { env } from "../../config/env";

function getStorage() {
  return getObjectStorage({
    endPoint: env.minioEndpoint,
    port: env.minioPort,
    useSSL: env.minioUseSsl,
    accessKey: env.minioAccessKey,
    secretKey: env.minioSecretKey,
    defaultBucket: env.minioBucket,
  });
}

export function buildInterviewMediaKey(interviewId: string, kind: "recording" | "snapshot", fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `interviews/${interviewId}/${kind}/${Date.now()}-${safeName}`;
}

export async function storeInterviewMedia(
  interviewId: string,
  kind: "recording" | "snapshot",
  fileName: string,
  buffer: Buffer,
  mimeType: string,
) {
  const storage = getStorage();
  const objectKey = buildInterviewMediaKey(interviewId, kind, fileName);
  await storage.putObject(objectKey, buffer, {
    "Content-Type": mimeType,
    "x-amz-meta-interview-id": interviewId,
  });
  return objectKey;
}

export async function getInterviewMediaUrl(objectKey: string) {
  const storage = getStorage();
  return storage.getPresignedUrl(objectKey, 3600);
}
