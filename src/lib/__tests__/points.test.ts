import { describe, it, expect } from "vitest";
import { calculatePoints, calculateFinalRating, getMvps } from "../points";

describe("calculatePoints", () => {
  it("awards 2 per goal", () => {
    expect(calculatePoints({ goals: 3, assists: 0, result: "draw" })).toBe(6);
  });

  it("awards 1 per assist", () => {
    expect(calculatePoints({ goals: 0, assists: 4, result: "draw" })).toBe(4);
  });

  it("awards 5 for a win", () => {
    expect(calculatePoints({ goals: 0, assists: 0, result: "win" })).toBe(5);
  });

  it("awards 0 for a draw", () => {
    expect(calculatePoints({ goals: 0, assists: 0, result: "draw" })).toBe(0);
  });

  it("awards 0 for a loss", () => {
    expect(calculatePoints({ goals: 0, assists: 0, result: "loss" })).toBe(0);
  });

  it("combines goals, assists, and win bonus correctly", () => {
    expect(calculatePoints({ goals: 2, assists: 1, result: "win" })).toBe(10);
  });

  it("combines goals and assists without win bonus on loss", () => {
    expect(calculatePoints({ goals: 2, assists: 3, result: "loss" })).toBe(7);
  });
});

describe("calculateFinalRating", () => {
  it("returns 0 when matches played is 0", () => {
    expect(calculateFinalRating(20, 0)).toBe(0);
  });

  it("divides total points by matches played", () => {
    expect(calculateFinalRating(20, 4)).toBe(5);
  });

  it("handles fractional ratings", () => {
    expect(calculateFinalRating(10, 3)).toBeCloseTo(3.333, 3);
  });

  it("returns 0 when both inputs are 0", () => {
    expect(calculateFinalRating(0, 0)).toBe(0);
  });
});

describe("getMvps", () => {
  it("returns empty array for no entries", () => {
    expect(getMvps([])).toEqual([]);
  });

  it("returns single MVP when one player has highest points", () => {
    const entries = [
      { player_id: "a", goals: 2, assists: 1, result: "win" as const },
      { player_id: "b", goals: 0, assists: 0, result: "win" as const },
    ];
    const mvps = getMvps(entries);
    expect(mvps).toHaveLength(1);
    expect(mvps[0].player_id).toBe("a");
    expect(mvps[0].points).toBe(10);
  });

  it("breaks ties by result rank (win > draw > loss)", () => {
    const entries = [
      { player_id: "a", goals: 1, assists: 0, result: "draw" as const },
      { player_id: "b", goals: 1, assists: 0, result: "win" as const },
    ];
    const mvps = getMvps(entries);
    expect(mvps).toHaveLength(1);
    expect(mvps[0].player_id).toBe("b");
  });

  it("breaks ties by goals when points and result are equal", () => {
    const entries = [
      { player_id: "a", goals: 1, assists: 3, result: "win" as const },
      { player_id: "b", goals: 2, assists: 2, result: "win" as const },
    ];
    const mvps = getMvps(entries);
    expect(mvps).toHaveLength(1);
    expect(mvps[0].player_id).toBe("b");
  });

  it("breaks ties by assists when points, result, and goals are equal", () => {
    const entries = [
      { player_id: "a", goals: 2, assists: 2, result: "win" as const },
      { player_id: "b", goals: 2, assists: 3, result: "win" as const },
    ];
    const mvps = getMvps(entries);
    expect(mvps).toHaveLength(1);
    expect(mvps[0].player_id).toBe("b");
  });

  it("returns multiple MVPs when all tiebreakers are equal", () => {
    const entries = [
      { player_id: "a", goals: 1, assists: 1, result: "win" as const },
      { player_id: "b", goals: 1, assists: 1, result: "win" as const },
    ];
    const mvps = getMvps(entries);
    expect(mvps).toHaveLength(2);
    expect(mvps.map((m) => m.player_id).sort()).toEqual(["a", "b"]);
  });

  it("returns MVP with correct points and result_rank attached", () => {
    const entries = [{ player_id: "a", goals: 2, assists: 1, result: "win" as const }];
    const mvps = getMvps(entries);
    expect(mvps[0].points).toBe(10);
    expect(mvps[0].result_rank).toBe(2);
  });

  it("handles a single entry", () => {
    const entries = [{ player_id: "solo", goals: 0, assists: 0, result: "loss" as const }];
    const mvps = getMvps(entries);
    expect(mvps).toHaveLength(1);
    expect(mvps[0].player_id).toBe("solo");
  });
});
