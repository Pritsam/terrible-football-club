import { describe, it, expect } from "vitest";
import { submitStatsSchema, rejectSubmissionSchema } from "../validations/submissions";
import { createLeagueSchema, joinLeagueSchema } from "../validations/leagues";
import { createMatchSchema } from "../validations/matches";
import { updateProfileSchema } from "../validations/profile";

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

  it("rejects date with time component", () => {
    const result = createMatchSchema.safeParse({ match_date: "2026-06-15T00:00:00Z" });
    expect(result.success).toBe(false);
  });
});

describe("submitStatsSchema — boundary values", () => {
  it("accepts large but valid goal counts", () => {
    const result = submitStatsSchema.safeParse({ goals: 99, assists: 0, result: "win" });
    expect(result.success).toBe(true);
  });

  it("rejects string inputs for numeric fields", () => {
    const result = submitStatsSchema.safeParse({ goals: "two", assists: 0, result: "win" });
    expect(result.success).toBe(false);
  });

  it("rejects null result", () => {
    const result = submitStatsSchema.safeParse({ goals: 0, assists: 0, result: null });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields entirely", () => {
    const result = submitStatsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("joinLeagueSchema — boundary values", () => {
  it("rejects 7-char code (one short)", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "a1b2c3d" });
    expect(result.success).toBe(false);
  });

  it("rejects 9-char code (one long)", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "a1b2c3d4e" });
    expect(result.success).toBe(false);
  });

  it("rejects code with special characters", () => {
    const result = joinLeagueSchema.safeParse({ invite_code: "a1b2c3!4" });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts a valid name", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane Smith" });
    expect(result.success).toBe(true);
  });

  it("accepts name with valid avatar URL", () => {
    const result = updateProfileSchema.safeParse({
      name: "Jane",
      avatar_url: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string avatar URL (treated as no avatar)", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane", avatar_url: "" });
    expect(result.success).toBe(true);
  });

  it("accepts missing avatar URL (optional)", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = updateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = updateProfileSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts name of exactly 100 chars", () => {
    const result = updateProfileSchema.safeParse({ name: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("rejects non-URL avatar string", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane", avatar_url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name entirely", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
