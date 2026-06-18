import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .max(2048, "URL is too long")
    .or(z.literal(""))
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
