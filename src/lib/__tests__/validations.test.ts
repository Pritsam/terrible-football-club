import { describe, it, expect } from "vitest";
import { submitStatsSchema, rejectSubmissionSchema } from "../validations/submissions";
import { createLeagueSchema, joinLeagueSchema } from "../validations/leagues";
import { createMatchSchema } from "../validations/matches";

describe("submitStatsSchema", () => {
  it("accepts valid input", () => {
    const result = submitStatsSchema.safeParse({ goals: 2, assists: 1, result: "win" });
    expect(result.success).toBe(true);
  });

  it("accepts zeros for goals and assists", () => {
    const result = submitStatsSchema.safeParse({ goals: 0, assists: 0, result: "draw" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid result values", () => {
    for (const result of ["win", "loss", "draw"] as const) {
      const parsed = submitStatsSchema.safeParse({ goals: 0, assists: 0, result });
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects negative goals", () => {
    const result = submitStatsSchema.safeParse({ goals: -1, assists: 0, result: "win" });
    expect(result.success).toBe(false);
  });

  it("rejects negative assists", () => {
    const result = submitStatsSchema.safeParse({ goals: 0, assists: -1, result: "win" });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer goals", () => {
    const result = submitStatsSchema.safeParse({ goals: 1.5, assists: 0, result: "win" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid result enum value", () => {
    const result = submitStatsSchema.safeParse({ goals: 0, assists: 0, result: "tie" });
    expect(result.success).toBe(false);
  });

  it("rejects missing result", () => {
    const result = submitStatsSchema.safeParse({ goals: 0, assists: 0 });
    expect(result.success).toBe(false);
  });
});

describe("rejectSubmissionSchema", () => {
  it("accepts a valid rejection reason", () => {
    const result = rejectSubmissionSchema.safeParse({ rejection_reason: "Stats look wrong" });
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = rejectSubmissionSchema.safeParse({ rejection_reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects string over 500 chars", () => {
    const result = rejectSubmissionSchema.safeParse({
      rejection_reason: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 500 chars", () => {
    const result = rejectSubmissionSchema.safeParse({
      rejection_reason: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

describe("createLeagueSchema", () => {
  it("accepts a valid league name", () => {
    const result = createLeagueSchema.safeParse({ name: "Sunday League" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createLeagueSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 50 chars", () => {
    const result = createLeagueSchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 50 chars", () => {
    const result = createLeagueSchema.safeParse({ name: "a".repeat(50) });
    expect(result.success).toBe(true);
  });
});

describe("joinLeagueSchema", () => {
  it("accepts a valid 8-char hex invite code", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "a1b2c3d4" });
    expect(result.success).toBe(true);
  });

  it("accepts uppercase hex characters", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "A1B2C3D4" });
    expect(result.success).toBe(true);
  });

  it("rejects codes that are not 8 chars", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "a1b2c3" });
    expect(result.success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "xyz12345" });
    expect(result.success).toBe(false);
  });

  it("rejects empty invite code", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "" });
    expect(result.success).toBe(false);
  });
});

describe("createMatchSchema", () => {
  it("accepts a valid date string", () => {
    const result = createMatchSchema.safeParse({ match_date: "2026-06-15" });
    expect(result.success).toBe(true);
  });

  it("rejects empty date", () => {
    const result = createMatchSchema.safeParse({ match_date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-ISO date format", () => {
    const result = createMatchSchema.safeParse({ match_date: "15/06/2026" });
    expect(result.success).toBe(false);
  });

  it("rejects partial date strings", () => {
    const result = createMatchSchema.safeParse({ match_date: "2026-06" });
    expect(result.success).toBe(false);
  });
});
