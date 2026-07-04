export const env = {
  port: Number(process.env.PORT) || 3001,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiRealtimeModel: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2",
  openaiRealtimeVoice: process.env.OPENAI_REALTIME_VOICE ?? "marin",
  githubToken: process.env.GITHUB_TOKEN,
  proxyUrl: process.env.PROXY_URL,
  databaseUrl: process.env.DATABASE_URL,
} as const;
