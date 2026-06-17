"use client";

import { useActionState, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { updateMatchDate, deleteMatch } from "@/lib/matches/actions";
import { createMatchSchema, type CreateMatchInput } from "@/lib/validations/matches";

interface MatchActionsProps {
  matchId: string;
  leagueId: string;
  currentDate: string;
}

export function MatchActions({ matchId, leagueId, currentDate }: MatchActionsProps) {
  const [editState, editAction] = useActionState(updateMatchDate, undefined);
  const [deleteState, deleteAction] = useActionState(deleteMatch, undefined);
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMatchInput>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: { match_date: currentDate },
  });

  const onValid = (data: CreateMatchInput) => {
    const fd = new FormData();
    fd.set("match_id", matchId);
    fd.set("league_id", leagueId);
    fd.set("match_date", data.match_date);
    startTransition(() => editAction(fd));
  };

  const handleDelete = () => {
    const fd = new FormData();
    fd.set("match_id", matchId);
    fd.set("league_id", leagueId);
    startTransition(() => deleteAction(fd));
  };

  const handleCancelEdit = () => {
    reset({ match_date: currentDate });
    setShowEdit(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {showEdit ? (
        <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-3">
          <Field data-invalid={!!errors.match_date}>
            <FieldLabel htmlFor="edit_date">Match date</FieldLabel>
            <Input
              id="edit_date"
              type="date"
              aria-invalid={!!errors.match_date}
              {...register("match_date")}
            />
            <FieldError errors={[errors.match_date]} />
          </Field>
          {editState?.error && <FieldError>{editState.error}</FieldError>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save date"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEdit(true)}
          className="w-fit"
        >
          <Pencil className="size-3.5" />
          Edit date
        </Button>
      )}

      <div className="border-t border-border/50 pt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-destructive">Delete match</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Removes all stat submissions for this match. Cannot be undone.
          </p>
        </div>
        {confirmDelete ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting…" : "Confirm delete"}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        )}
        {deleteState?.error && <FieldError>{deleteState.error}</FieldError>}
      </div>
    </div>
  );
}
