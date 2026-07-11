import { proctoringAssetRepository } from "../../infrastructure/db/repositories/proctoring-asset.repository";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";
import { getInterviewMediaUrl, storeInterviewMedia } from "../../infrastructure/storage/interview-media.storage";
import { scanUploadBuffer } from "@ai-interviewer/file-security";

export class InterviewMediaError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "InterviewMediaError";
  }
}

export async function storeInterviewRecording(
  interviewId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
) {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw new InterviewMediaError("Interview not found.", 404);

  const scan = scanUploadBuffer({
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
    allowedMimeTypes: ["video/webm", "video/mp4", "audio/webm"],
  });
  if (!scan.ok) throw new InterviewMediaError(scan.reason, 400);

  const objectKey = await storeInterviewMedia(
    interviewId,
    "recording",
    file.originalname || "recording.webm",
    file.buffer,
    file.mimetype || "video/webm",
  );

  const asset = await proctoringAssetRepository.create({
    interviewId,
    type: "RECORDING",
    objectKey,
    mimeType: file.mimetype || "video/webm",
  });

  return asset;
}

export async function storeProctoringSnapshot(
  interviewId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
  signal?: string | null,
) {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw new InterviewMediaError("Interview not found.", 404);

  const scan = scanUploadBuffer({
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (!scan.ok) throw new InterviewMediaError(scan.reason, 400);

  const objectKey = await storeInterviewMedia(
    interviewId,
    "snapshot",
    file.originalname || "snapshot.jpg",
    file.buffer,
    file.mimetype || "image/jpeg",
  );

  return proctoringAssetRepository.create({
    interviewId,
    type: "SNAPSHOT",
    objectKey,
    mimeType: file.mimetype || "image/jpeg",
    signal: signal ?? null,
  });
}

type ProctoringAssetRecord = Awaited<ReturnType<typeof proctoringAssetRepository.listByInterviewId>>[number];

export async function listInterviewMediaAssets(interviewId: string) {
  const assets = await proctoringAssetRepository.listByInterviewId(interviewId);
  return Promise.all(
    assets.map(async (asset: ProctoringAssetRecord) => ({
      id: asset.id,
      type: asset.type,
      mimeType: asset.mimeType,
      signal: asset.signal,
      capturedAt: asset.capturedAt.toISOString(),
      url: await getInterviewMediaUrl(asset.objectKey),
    })),
  );
}
