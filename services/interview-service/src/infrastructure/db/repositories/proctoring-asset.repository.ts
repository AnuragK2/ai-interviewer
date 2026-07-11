import { prisma } from "../prisma.client";

type ProctoringAssetType = "SNAPSHOT" | "RECORDING";

export const proctoringAssetRepository = {
  listByInterviewId(interviewId: string) {
    return prisma.proctoringAsset.findMany({
      where: { interviewId },
      orderBy: { capturedAt: "asc" },
    });
  },

  create(data: {
    interviewId: string;
    type: ProctoringAssetType;
    objectKey: string;
    mimeType: string;
    signal?: string | null;
  }) {
    return prisma.proctoringAsset.create({ data });
  },
};
