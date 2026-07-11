import { describe, expect, test } from "bun:test";
import { scanUploadBuffer } from "../src/scan-upload";

describe("scanUploadBuffer", () => {
  test("rejects blocked executable extensions", () => {
    const result = scanUploadBuffer({
      buffer: Buffer.from("MZ"),
      mimeType: "application/octet-stream",
      fileName: "malware.exe",
    });

    expect(result.ok).toBe(false);
  });

  test("accepts plain text resumes", () => {
    const result = scanUploadBuffer({
      buffer: Buffer.from("Jane Doe\nSoftware Engineer\nSkills: TypeScript"),
      mimeType: "text/plain",
      fileName: "resume.txt",
      allowedMimeTypes: ["text/plain"],
    });

    expect(result.ok).toBe(true);
  });

  test("rejects suspicious script content", () => {
    const result = scanUploadBuffer({
      buffer: Buffer.from('<script>alert("xss")</script>'),
      mimeType: "text/plain",
      fileName: "resume.txt",
      allowedMimeTypes: ["text/plain"],
    });

    expect(result.ok).toBe(false);
  });
});
