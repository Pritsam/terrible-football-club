import { Trophy } from "lucide-react";

export interface LeaderboardEntry {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  matches_played: number;
  goals: number;
  assists: number;
  wins: number;
  losses: number;
  draws: number;
  total_points: number;
  final_rating: number;
  mvp_count: number;
}

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

function displayName(entry: LeaderboardEntry): string {
  return entry.name || "Unknown";
}

function formatRating(rating: number): string {
  return Number(rating).toFixed(2);
}

export function LeaderboardSection({ entries, currentUserId }: LeaderboardSectionProps) {
  const sorted = [...entries].sort((a, b) => {
    const ratingDiff = Number(b.final_rating) - Number(a.final_rating);
    if (ratingDiff !== 0) return ratingDiff;
    return b.goals - a.goals;
  });

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No leaderboard data yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="pb-2 pr-3 text-left text-xs font-medium text-muted-foreground w-8">#</th>
              <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Player</th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Rating</th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Pts</th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">GP</th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">G</th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">A</th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">W</th>
              <th className="pb-2 text-right text-xs font-medium text-muted-foreground">MVP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sorted.map((entry, index) => {
              const isCurrentUser = entry.user_id === currentUserId;
              const rank = index + 1;

              return (
                <tr
                  key={entry.user_id}
                  className={isCurrentUser ? "bg-primary/5" : ""}
                >
                  <td className="py-2.5 pr-3 font-medium text-muted-foreground">
                    {rank <= 3 ? (
                      <span
                        className={
                          rank === 1
                            ? "text-amber-500 font-bold"
                            : rank === 2
                              ? "text-slate-400 font-semibold"
                              : "text-amber-700 font-semibold"
                        }
                      >
                        {rank}
                      </span>
                    ) : (
                      <span>{rank}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase">
                        {displayName(entry)[0]}
                      </div>
                      <span className={`font-medium ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                        {displayName(entry)}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-foreground">
                    {formatRating(entry.final_rating)}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                    {entry.total_points}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                    {entry.matches_played}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                    {entry.goals}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                    {entry.assists}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                    {entry.wins}
                  </td>
                  <td className="py-2.5 text-right">
                    {entry.mvp_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 tabular-nums">
                        <Trophy className="size-3" />
                        {entry.mvp_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Rating = total points ÷ matches played · 2pts/goal · 1pt/assist · 5pts/win
      </p>
    </div>
  );
}
