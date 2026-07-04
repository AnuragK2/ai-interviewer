const BLOCKED_PATTERNS = [
  /\bchatgpt\b/i,
  /\bclaude\b/i,
  /\bgpt-?4\b/i,
  /\bignore (all|previous) instructions\b/i,
  /\bwrite (the|my) (code|answer) for me\b/i,
];

export function moderateUserText(text: string): { allowed: boolean; reason?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: true };

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: "Disallowed assistance or prompt-injection language was detected.",
      };
    }
  }

  return { allowed: true };
}

export function scoreInterview(messages: Array<{ participant: "User" | "Assistant"; message: string }>) {
  const userMessages = messages.filter((message) => message.participant === "User");
  const assistantMessages = messages.filter((message) => message.participant === "Assistant");

  if (userMessages.length === 0) return 0;

  const totalUserChars = userMessages.reduce((sum, message) => sum + message.message.trim().length, 0);
  const avgUserChars = totalUserChars / userMessages.length;
  const exchangeBonus = Math.min(40, userMessages.length * 8);
  const depthBonus = Math.min(40, Math.round(avgUserChars / 8));
  const balanceBonus = assistantMessages.length > 0 ? 20 : 0;

  return Math.max(0, Math.min(100, exchangeBonus + depthBonus + balanceBonus));
}
