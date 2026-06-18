import { z } from "zod";

const nonNegativeInt = z.number().int("Must be a whole number").min(0, "Cannot be negative");

export const submitStatsSchema = z.object({
  goals: nonNegativeInt,
  assists: nonNegativeInt,
  result: z.enum(["win", "loss", "draw"], { error: "Select a result" }),
});

export type SubmitStatsInput = z.infer<typeof submitStatsSchema>;

export const rejectSubmissionSchema = z.object({
  rejection_reason: z.string().min(1, "Rejection reason is required").max(500),
});

export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
