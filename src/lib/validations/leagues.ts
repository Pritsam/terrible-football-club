import { z } from "zod";

export const createLeagueSchema = z.object({
  name: z
    .string()
    .min(1, "League name is required")
    .max(50, "League name must be 50 characters or fewer"),
});

export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;
