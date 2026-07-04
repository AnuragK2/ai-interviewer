const env =
  typeof import.meta !== "undefined" && import.meta.env && typeof import.meta.env === "object"
    ? import.meta.env
    : undefined;

export const BACKEND_URL =
  (env?.VITE_BACKEND_URL as string | undefined) ??
  (typeof process !== "undefined" ? process.env?.BACKEND_URL : undefined) ??
  "http://localhost:3001";
