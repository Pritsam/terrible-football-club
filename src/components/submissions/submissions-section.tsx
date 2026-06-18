"use client";

import { useActionState, useTransition, useState } from "react";
import { Check, Clock, X, Pencil, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { SubmissionForm } from "@/components/submissions/submission-form";
import {
  submitStats,
  editPendingSubmission,
  resubmitRejected,
  requestEditApproved,
  adminCreateSubmission,
  adminEditSubmission,
  approveSubmission,
  rejectSubmission,
} from "@/lib/submissions/actions";
import type { SubmitStatsInput } from "@/lib/validations/submissions";

export interface Submission {
  id: string;
  player_id: string;
  submitted_by: string;
  goals: number;
  assists: number;
  result: "win" | "loss" | "draw";
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  profiles: { name: string | null; email: string } | null;
}

export interface MemberProfile {
  user_id: string;
  profiles: { name: string | null; email: string } | null;
}

interface SubmissionsSectionProps {
  matchId: string;
  leagueId: string;
  currentUserId: string;
  isAdmin: boolean;
  isActive: boolean;
  submissions: Submission[];
  members: MemberProfile[];
}

function playerName(profiles: { name: string | null; email: string } | null): string {
  return profiles?.name || profiles?.email?.split("@")[0] || "Unknown";
}

function StatusBadge({ status }: { status: Submission["status"] }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
        <Check className="size-3" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
        <X className="size-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Clock className="size-3" />
      Pending
    </span>
  );
}

function StatsSummary({ goals, assists, result }: { goals: number; assists: number; result: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-foreground font-medium">{goals}G / {assists}A</span>
      <span className="capitalize text-muted-foreground">{result}</span>
    </div>
  );
}

function OwnSubmission({
  submission,
  matchId,
  leagueId,
  isActive,
}: {
  submission: Submission | undefined;
  matchId: string;
  leagueId: string;
  isActive: boolean;
}) {
  const [submitState, submitAction] = useActionState(submitStats, undefined);
  const [editState, editAction] = useActionState(editPendingSubmission, undefined);
  const [resubmitState, resubmitAction] = useActionState(resubmitRejected, undefined);
  const [requestState, requestAction] = useActionState(requestEditApproved, undefined);
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);

  const hidden = (id: string, name: string, value: string) => (
    <input type="hidden" name={name} value={value} key={id} />
  );

  if (!submission) {
    if (!isActive) return null;
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Your submission</p>
        <SubmissionForm
          idPrefix="own-submit"
          isPending={isPending}
          error={submitState?.error}
          submitLabel="Submit stats"
          onSubmit={(data: SubmitStatsInput) => {
            const fd = new FormData();
            fd.set("match_id", matchId);
            fd.set("league_id", leagueId);
            fd.set("goals", String(data.goals));
            fd.set("assists", String(data.assists));
            fd.set("result", data.result);
            startTransition(() => submitAction(fd));
          }}
        />
      </div>
    );
  }

  if (submission.status === "pending") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Your submission</p>
          <StatusBadge status="pending" />
        </div>
        {showEdit ? (
          <SubmissionForm
            idPrefix="own-edit"
            defaultValues={submission}
            isPending={isPending}
            error={editState?.error}
            submitLabel="Save changes"
            onSubmit={(data: SubmitStatsInput) => {
              const fd = new FormData();
              fd.set("match_id", matchId);
              fd.set("league_id", leagueId);
              fd.set("submission_id", submission.id);
              fd.set("goals", String(data.goals));
              fd.set("assists", String(data.assists));
              fd.set("result", data.result);
              startTransition(() => editAction(fd));
            }}
            onCancel={() => setShowEdit(false)}
          />
        ) : (
          <>
            <StatsSummary goals={submission.goals} assists={submission.assists} result={submission.result} />
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => setShowEdit(true)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}
          </>
        )}
        {hidden("r1", "match_id", matchId)}
        {hidden("r2", "league_id", leagueId)}
      </div>
    );
  }

  if (submission.status === "approved") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Your submission</p>
          <StatusBadge status="approved" />
        </div>
        <StatsSummary goals={submission.goals} assists={submission.assists} result={submission.result} />
        {isActive && (
          <div className="flex flex-col gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.set("match_id", matchId);
                fd.set("league_id", leagueId);
                fd.set("submission_id", submission.id);
                startTransition(() => requestAction(fd));
              }}
            >
              <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                {isPending ? "Requesting…" : "Request edit"}
              </Button>
            </form>
            {requestState?.error && <FieldError>{requestState.error}</FieldError>}
            <p className="text-xs text-muted-foreground">
              This will reopen your submission for editing and require re-approval.
            </p>
          </div>
        )}
      </div>
    );
  }

  // rejected
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Your submission</p>
        <StatusBadge status="rejected" />
      </div>
      {submission.rejection_reason && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span className="font-medium">Rejection reason: </span>
          {submission.rejection_reason}
        </div>
      )}
      {isActive ? (
        <>
          <p className="text-xs text-muted-foreground">Edit your stats and resubmit below.</p>
          <SubmissionForm
            idPrefix="own-resubmit"
            defaultValues={submission}
            isPending={isPending}
            error={resubmitState?.error}
            submitLabel="Resubmit"
            onSubmit={(data: SubmitStatsInput) => {
              const fd = new FormData();
              fd.set("match_id", matchId);
              fd.set("league_id", leagueId);
              fd.set("submission_id", submission.id);
              fd.set("goals", String(data.goals));
              fd.set("assists", String(data.assists));
              fd.set("result", data.result);
              startTransition(() => resubmitAction(fd));
            }}
          />
        </>
      ) : (
        <StatsSummary goals={submission.goals} assists={submission.assists} result={submission.result} />
      )}
    </div>
  );
}

function AdminSubmissionRow({
  submission,
  matchId,
  leagueId,
}: {
  submission: Submission;
  matchId: string;
  leagueId: string;
}) {
  const [approveState, approveAction] = useActionState(approveSubmission, undefined);
  const [rejectState, rejectAction] = useActionState(rejectSubmission, undefined);
  const [editState, editAction] = useActionState(adminEditSubmission, undefined);
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () => {
    const fd = new FormData();
    fd.set("match_id", matchId);
    fd.set("league_id", leagueId);
    fd.set("submission_id", submission.id);
    startTransition(() => approveAction(fd));
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("match_id", matchId);
    fd.set("league_id", leagueId);
    fd.set("submission_id", submission.id);
    fd.set("rejection_reason", rejectionReason);
    startTransition(() => rejectAction(fd));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs font-medium text-foreground uppercase">
            {playerName(submission.profiles)[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {playerName(submission.profiles)}
            </span>
            <StatsSummary goals={submission.goals} assists={submission.assists} result={submission.result} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} />
          {submission.status === "pending" && !showRejectForm && !showEditForm && (
            <>
              <Button
                size="xs"
                variant="outline"
                disabled={isPending}
                onClick={handleApprove}
                className="text-primary border-primary/40 hover:bg-primary/10"
              >
                <Check className="size-3" />
                Approve
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={isPending}
                onClick={() => setShowRejectForm(true)}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                <X className="size-3" />
                Reject
              </Button>
            </>
          )}
          {submission.status === "approved" && !showEditForm && (
            <Button
              size="xs"
              variant="outline"
              disabled={isPending}
              onClick={() => setShowEditForm(true)}
            >
              <Pencil className="size-3" />
              Edit
            </Button>
          )}
          {submission.status === "rejected" && !showEditForm && (
            <Button
              size="xs"
              variant="outline"
              disabled={isPending}
              onClick={handleApprove}
              className="text-primary border-primary/40 hover:bg-primary/10"
            >
              <Check className="size-3" />
              Approve
            </Button>
          )}
        </div>
      </div>

      {approveState?.error && <FieldError>{approveState.error}</FieldError>}

      {showRejectForm && (
        <form onSubmit={handleReject} className="mt-1 flex flex-col gap-2 pl-10">
          <Field>
            <FieldLabel htmlFor={`reason-${submission.id}`}>Rejection reason</FieldLabel>
            <Input
              id={`reason-${submission.id}`}
              placeholder="Explain why this submission was rejected…"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </Field>
          {rejectState?.error && <FieldError>{rejectState.error}</FieldError>}
          <div className="flex gap-2">
            <Button type="submit" size="xs" variant="destructive" disabled={isPending}>
              {isPending ? "Rejecting…" : "Confirm reject"}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {showEditForm && (
        <div className="mt-1 pl-10">
          <SubmissionForm
            idPrefix={`admin-edit-${submission.id}`}
            defaultValues={submission}
            isPending={isPending}
            error={editState?.error}
            submitLabel="Save changes"
            onSubmit={(data: SubmitStatsInput) => {
              const fd = new FormData();
              fd.set("match_id", matchId);
              fd.set("league_id", leagueId);
              fd.set("submission_id", submission.id);
              fd.set("goals", String(data.goals));
              fd.set("assists", String(data.assists));
              fd.set("result", data.result);
              startTransition(() => editAction(fd));
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}
    </div>
  );
}

function AdminCreateForm({
  matchId,
  leagueId,
  unsubmittedMembers,
}: {
  matchId: string;
  leagueId: string;
  unsubmittedMembers: MemberProfile[];
}) {
  const [state, formAction] = useActionState(adminCreateSubmission, undefined);
  const [isPending, startTransition] = useTransition();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (unsubmittedMembers.length === 0) return null;

  return (
    <div className="border-t border-border/40 pt-4">
      {showForm ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Add submission for player</p>
          <Field>
            <FieldLabel htmlFor="admin_player_select">Player</FieldLabel>
            <select
              id="admin_player_select"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-border/60 bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a player…</option>
              {unsubmittedMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {playerName(m.profiles)}
                </option>
              ))}
            </select>
          </Field>
          {selectedPlayerId && (
            <SubmissionForm
              idPrefix="admin-create"
              isPending={isPending}
              error={state?.error}
              submitLabel="Submit (auto-approved)"
              onSubmit={(data: SubmitStatsInput) => {
                const fd = new FormData();
                fd.set("match_id", matchId);
                fd.set("league_id", leagueId);
                fd.set("player_id", selectedPlayerId);
                fd.set("goals", String(data.goals));
                fd.set("assists", String(data.assists));
                fd.set("result", data.result);
                startTransition(() => formAction(fd));
              }}
              onCancel={() => {
                setShowForm(false);
                setSelectedPlayerId("");
              }}
            />
          )}
          {!selectedPlayerId && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-fit"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-fit"
        >
          <UserPlus className="size-3.5" />
          Add submission for player
        </Button>
      )}
    </div>
  );
}

export function SubmissionsSection({
  matchId,
  leagueId,
  currentUserId,
  isAdmin,
  isActive,
  submissions,
  members,
}: SubmissionsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const ownSubmission = submissions.find((s) => s.player_id === currentUserId);
  const othersSubmissions = submissions.filter((s) => s.player_id !== currentUserId);
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  const submittedPlayerIds = new Set(submissions.map((s) => s.player_id));
  const unsubmittedMembers = members.filter((m) => !submittedPlayerIds.has(m.user_id));

  const displayedOthers = showAll ? othersSubmissions : othersSubmissions.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {(ownSubmission || isActive) && (
        <OwnSubmission
          submission={ownSubmission}
          matchId={matchId}
          leagueId={leagueId}
          isActive={isActive}
        />
      )}

      {submissions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              All submissions{" "}
              <span className="font-normal text-muted-foreground">({submissions.length})</span>
            </p>
            {isAdmin && pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                {pendingCount} pending
              </span>
            )}
          </div>

          <div className="flex flex-col divide-y divide-border/40">
            {ownSubmission && (
              <div className="py-3">
                {isAdmin ? (
                  <AdminSubmissionRow
                    submission={ownSubmission}
                    matchId={matchId}
                    leagueId={leagueId}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary uppercase">
                        {playerName(ownSubmission.profiles)[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {playerName(ownSubmission.profiles)}{" "}
                          <span className="text-xs text-muted-foreground">(you)</span>
                        </span>
                        <StatsSummary
                          goals={ownSubmission.goals}
                          assists={ownSubmission.assists}
                          result={ownSubmission.result}
                        />
                      </div>
                    </div>
                    <StatusBadge status={ownSubmission.status} />
                  </div>
                )}
              </div>
            )}

            {displayedOthers.map((sub) => (
              <div key={sub.id} className="py-3">
                {isAdmin ? (
                  <AdminSubmissionRow
                    submission={sub}
                    matchId={matchId}
                    leagueId={leagueId}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs font-medium text-foreground uppercase">
                        {playerName(sub.profiles)[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {playerName(sub.profiles)}
                        </span>
                        <StatsSummary
                          goals={sub.goals}
                          assists={sub.assists}
                          result={sub.result}
                        />
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {othersSubmissions.length > 3 && (
            <Button
              size="sm"
              variant="ghost"
              className="w-fit text-muted-foreground"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="size-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  Show {othersSubmissions.length - 3} more
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {isAdmin && isActive && (
        <AdminCreateForm
          matchId={matchId}
          leagueId={leagueId}
          unsubmittedMembers={unsubmittedMembers}
        />
      )}

      {submissions.length === 0 && !isActive && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No stat submissions for this match.
        </p>
      )}
    </div>
  );
}
