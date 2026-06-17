"use client";

import { useActionState, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Calendar, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { createMatch } from "@/lib/matches/actions";
import { createMatchSchema, type CreateMatchInput } from "@/lib/validations/matches";

export interface MatchSummary {
  id: string;
  match_date: string;
}

interface MatchesSectionProps {
  leagueId: string;
  matches: MatchSummary[];
  isAdmin: boolean;
  isActive: boolean;
}

function formatMatchDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MatchesSection({ leagueId, matches, isAdmin, isActive }: MatchesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction] = useActionState(createMatch, undefined);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMatchInput>({ resolver: zodResolver(createMatchSchema) });

  const onValid = (data: CreateMatchInput) => {
    const fd = new FormData();
    fd.set("league_id", leagueId);
    fd.set("match_date", data.match_date);
    startTransition(() => formAction(fd));
  };

  const handleCancel = () => {
    reset();
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Matches{" "}
            <span className="text-muted-foreground font-normal">({matches.length})</span>
          </p>
        </div>
        {isAdmin && isActive && !showForm && (
          <Button size="xs" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="size-3" />
            Add match
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-3">
          <Field data-invalid={!!errors.match_date}>
            <FieldLabel htmlFor="match_date">Match date</FieldLabel>
            <Input
              id="match_date"
              type="date"
              aria-invalid={!!errors.match_date}
              {...register("match_date")}
            />
            <FieldError errors={[errors.match_date]} />
          </Field>
          {state?.error && <FieldError>{state.error}</FieldError>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Scheduling…" : "Schedule"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {matches.length === 0 && !showForm ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {isAdmin && isActive
            ? "No matches yet. Add the first one above."
            : "No matches scheduled yet."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/40">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/leagues/${leagueId}/matches/${match.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm hover:text-foreground text-foreground/80 transition-colors"
              >
                <span className="font-medium">{formatMatchDate(match.match_date)}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
