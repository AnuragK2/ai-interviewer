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

export function buildProfilePhotoObjectKey(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `profile-photos/${userId}/${Date.now()}-${safeName}`;
}

export async function storeProfilePhoto(userId: string, fileName: string, buffer: Buffer, mimeType: string) {
  const storage = getStorage();
  const objectKey = buildProfilePhotoObjectKey(userId, fileName);
  await storage.putObject(objectKey, buffer, {
    "Content-Type": mimeType,
    "x-amz-meta-user-id": userId,
  });
  return objectKey;
}

export async function getProfilePhotoUrl(objectKey: string) {
  const storage = getStorage();
  return storage.getPresignedUrl(objectKey, 3600);
}

export async function deleteProfilePhoto(objectKey: string) {
  const storage = getStorage();
  await storage.removeObject(objectKey);
}
