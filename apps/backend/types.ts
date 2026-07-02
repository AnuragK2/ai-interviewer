import { z } from "zod";
export const preInterviewBody = z.object({
    linkedinUrl: z.string().url(),
    githubUrl: z.string().url(),
});

export type PreInterviewBody = z.infer<typeof preInterviewBody>;