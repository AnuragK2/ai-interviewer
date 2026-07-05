import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { ParsedResume } from "@ai-interviewer/api-types";
import { extractResumeFields } from "./extract-resume-fields";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

export function isAllowedResumeFile(mimeType: string, fileName: string) {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return ALLOWED_MIME_TYPES.has(mimeType) || ALLOWED_EXTENSIONS.has(extension);
}

async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "text/plain" || extension === ".txt") {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported resume format. Upload a PDF, DOCX, or TXT file.");
}

export async function parseResumeFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ParsedResume> {
  const rawText = (await extractText(buffer, mimeType, fileName)).trim();

  if (!rawText) {
    throw new Error("Could not extract any text from the resume.");
  }

  return extractResumeFields(rawText);
}
