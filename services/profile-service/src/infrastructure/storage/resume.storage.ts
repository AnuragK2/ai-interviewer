import { getObjectStorage } from "@ai-interviewer/object-storage";
import { env } from "../../config/env";

export function buildResumeObjectKey(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `resumes/${userId}/${Date.now()}-${safeName}`;
}

export async function storeResumeFile(userId: string, fileName: string, buffer: Buffer, mimeType: string) {
  const storage = getObjectStorage({
    endPoint: env.minioEndpoint,
    port: env.minioPort,
    useSSL: env.minioUseSsl,
    accessKey: env.minioAccessKey,
    secretKey: env.minioSecretKey,
    defaultBucket: env.minioBucket,
  });

  const objectKey = buildResumeObjectKey(userId, fileName);
  await storage.putObject(objectKey, buffer, {
    "Content-Type": mimeType,
    "x-amz-meta-user-id": userId,
  });

  return objectKey;
}

export async function getResumeDownloadUrl(objectKey: string) {
  const storage = getObjectStorage({
    endPoint: env.minioEndpoint,
    port: env.minioPort,
    useSSL: env.minioUseSsl,
    accessKey: env.minioAccessKey,
    secretKey: env.minioSecretKey,
    defaultBucket: env.minioBucket,
  });

  return storage.getPresignedUrl(objectKey, 3600);
}

export async function deleteResumeFile(objectKey: string) {
  const storage = getObjectStorage({
    endPoint: env.minioEndpoint,
    port: env.minioPort,
    useSSL: env.minioUseSsl,
    accessKey: env.minioAccessKey,
    secretKey: env.minioSecretKey,
    defaultBucket: env.minioBucket,
  });

  await storage.removeObject(objectKey);
}
