"use client";

import { useActionState, useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { updateLeagueStatus } from "@/lib/leagues/actions";

interface LeagueSettingsPanelProps {
  leagueId: string;
  status: string;
}

export function LeagueSettingsPanel({ leagueId, status }: LeagueSettingsPanelProps) {
  const [state, action] = useActionState(updateLeagueStatus, undefined);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleStatusChange = (newStatus: "active" | "closed" | "deleted") => {
    const formData = new FormData();
    formData.set("league_id", leagueId);
    formData.set("status", newStatus);
    startTransition(() => action(formData));
    if (newStatus === "deleted") setConfirmDelete(false);
  };

  const isActive = status === "active";

  return (
    <div className="flex flex-col gap-4">
      {state?.error && <FieldError>{state.error}</FieldError>}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {isActive ? "Close league" : "Reopen league"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isActive
              ? "Prevent new matches and stat submissions."
              : "Allow new matches and stat submissions again."}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleStatusChange(isActive ? "closed" : "active")}
          className="shrink-0"
        >
          {isActive ? "Close" : "Reopen"}
        </Button>
      </div>

      <div className="border-t border-border/50 pt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-destructive">Delete league</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Removes all matches and members permanently. Cannot be undone.
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
              onClick={() => handleStatusChange("deleted")}
            >
              {isPending ? "Deleting…" : "Confirm delete"}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
