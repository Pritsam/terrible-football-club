import { z } from "zod";

const dateString = z
  .string()
  .min(1, "Date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

export const createMatchSchema = z.object({
  match_date: dateString,
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
