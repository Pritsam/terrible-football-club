import { Trophy } from "lucide-react";

export interface MvpEntry {
  player_id: string;
  points: number;
  goals: number;
  assists: number;
  name?: string;
}

interface MatchMvpProps {
  mvps: MvpEntry[];
}

export function MatchMvp({ mvps }: MatchMvpProps) {
  if (mvps.length === 0) return null;

  const isTied = mvps.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-amber-500" />
        <p className="text-sm font-medium text-foreground">
          {isTied ? "Match MVPs" : "Match MVP"}
          {isTied && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tied)</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {mvps.map((mvp) => (
          <div
            key={mvp.player_id}
            className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold uppercase text-amber-600">
              {(mvp.name || "?")[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {mvp.name || "Unknown player"}
              </p>
              <p className="text-xs text-muted-foreground">
                {mvp.points}pts · {mvp.goals}G · {mvp.assists}A
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
