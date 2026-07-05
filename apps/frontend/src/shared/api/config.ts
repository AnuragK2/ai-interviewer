export const BACKEND_URL =
  (typeof process !== "undefined" ? process.env.BACKEND_URL : undefined) ??
  "http://localhost:8080";
