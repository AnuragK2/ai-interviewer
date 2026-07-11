export type UploadScanResult =
  | { ok: true }
  | { ok: false; reason: string };

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".js",
  ".jar",
  ".sh",
  ".php",
  ".html",
  ".htm",
]);

const SUSPICIOUS_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /onerror\s*=/i,
  /<\?php/i,
  /<%/,
  /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/i,
];

const SIGNATURES: Array<{ mimeType: string; bytes: number[] }> = [
  { mimeType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mimeType: "video/webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: [0x50, 0x4b, 0x03, 0x04],
  },
];

function extensionOf(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function matchesSignature(buffer: Buffer, bytes: number[]) {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

function detectMimeFromBuffer(buffer: Buffer) {
  for (const signature of SIGNATURES) {
    if (matchesSignature(buffer, signature.bytes)) {
      return signature.mimeType;
    }
  }

  if (buffer.length > 0 && buffer.every((byte) => byte === 0x09 || byte === 0x0a || byte === 0x0d || (byte >= 0x20 && byte <= 0x7e))) {
    return "text/plain";
  }

  return null;
}

function scanTextContent(buffer: Buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 64_000)).toString("utf8");
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sample)) {
      return "Suspicious content detected in upload.";
    }
  }
  return null;
}

export function scanUploadBuffer(input: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  allowedMimeTypes?: string[];
}): UploadScanResult {
  const extension = extensionOf(input.fileName);
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, reason: `Blocked file extension: ${extension}` };
  }

  if (input.buffer.length === 0) {
    return { ok: false, reason: "Empty upload." };
  }

  const detectedMime = detectMimeFromBuffer(input.buffer);
  if (detectedMime && input.allowedMimeTypes && !input.allowedMimeTypes.includes(detectedMime)) {
    return { ok: false, reason: "File content does not match allowed upload types." };
  }

  if (
    input.allowedMimeTypes &&
    detectedMime &&
    input.mimeType &&
    !input.mimeType.includes(detectedMime) &&
    !(input.mimeType === "text/plain" && detectedMime === "text/plain")
  ) {
    const declared = input.mimeType.split(";")[0]?.trim();
    if (declared && declared !== detectedMime && !(declared === "text/plain" && detectedMime === "text/plain")) {
      return { ok: false, reason: "Declared MIME type does not match file contents." };
    }
  }

  const suspicious = scanTextContent(input.buffer);
  if (suspicious) {
    return { ok: false, reason: suspicious };
  }

  return { ok: true };
}
