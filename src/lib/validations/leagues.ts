import { z } from "zod";

export const createLeagueSchema = z.object({
  name: z
    .string()
    .min(1, "League name is required")
    .max(50, "League name must be 50 characters or fewer"),
});

export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;

export const joinLeagueSchema = z.object({
  invite_code: z
    .string()
    .min(1, "Invite code is required")
    .length(8, "Invite code must be 8 characters")
    .regex(/^[a-f0-9]+$/i, "Invalid invite code format"),
});

export type JoinLeagueInput = z.infer<typeof joinLeagueSchema>;
