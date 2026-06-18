export type MatchResult = "win" | "loss" | "draw";

export interface StatEntry {
  player_id: string;
  goals: number;
  assists: number;
  result: MatchResult;
}

export function calculatePoints(entry: Pick<StatEntry, "goals" | "assists" | "result">): number {
  return entry.goals * 2 + entry.assists + (entry.result === "win" ? 5 : 0);
}

export function calculateFinalRating(totalPoints: number, matchesPlayed: number): number {
  if (matchesPlayed === 0) return 0;
  return totalPoints / matchesPlayed;
}

export interface ScoredEntry extends StatEntry {
  points: number;
  result_rank: number;
}

function toResultRank(result: MatchResult): number {
  if (result === "win") return 2;
  if (result === "draw") return 1;
  return 0;
}

export function getMvps(entries: StatEntry[]): ScoredEntry[] {
  if (entries.length === 0) return [];

  const scored: ScoredEntry[] = entries.map((e) => ({
    ...e,
    points: calculatePoints(e),
    result_rank: toResultRank(e.result),
  }));

  scored.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.result_rank !== a.result_rank) return b.result_rank - a.result_rank;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.assists - a.assists;
  });

  const top = scored[0];
  return scored.filter(
    (e) =>
      e.points === top.points &&
      e.result_rank === top.result_rank &&
      e.goals === top.goals &&
      e.assists === top.assists,
  );
}
