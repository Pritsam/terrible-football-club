"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitStatsSchema, rejectSubmissionSchema } from "@/lib/validations/submissions";

export type SubmissionActionResult = { error: string } | undefined;

function parseIds(formData: FormData): {
  matchId: string;
  leagueId: string;
  submissionId?: string;
  playerId?: string;
} | null {
  const matchId = formData.get("match_id") as string;
  const leagueId = formData.get("league_id") as string;
  if (!matchId || !leagueId) return null;
  return {
    matchId,
    leagueId,
    submissionId: (formData.get("submission_id") as string) || undefined,
    playerId: (formData.get("player_id") as string) || undefined,
  };
}

function parseStats(formData: FormData) {
  return submitStatsSchema.safeParse({
    goals: Number(formData.get("goals")),
    assists: Number(formData.get("assists")),
    result: formData.get("result"),
  });
}

export async function submitStats(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids) return { error: "Invalid request." };

  const parsed = parseStats(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase.from("stat_submissions").insert({
    match_id: ids.matchId,
    player_id: authData.user.id,
    submitted_by: authData.user.id,
    ...parsed.data,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already submitted stats for this match." };
    return { error: error.message };
  }

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function editPendingSubmission(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.submissionId) return { error: "Invalid request." };

  const parsed = parseStats(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stat_submissions")
    .update({ ...parsed.data, submitted_by: authData.user.id })
    .eq("id", ids.submissionId);

  if (error) return { error: error.message };

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function resubmitRejected(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.submissionId) return { error: "Invalid request." };

  const parsed = parseStats(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stat_submissions")
    .update({
      ...parsed.data,
      submitted_by: authData.user.id,
      status: "pending",
      rejection_reason: null,
    })
    .eq("id", ids.submissionId);

  if (error) return { error: error.message };

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function requestEditApproved(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.submissionId) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stat_submissions")
    .update({ status: "pending", submitted_by: authData.user.id })
    .eq("id", ids.submissionId);

  if (error) return { error: error.message };

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function adminCreateSubmission(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.playerId) return { error: "Invalid request." };

  const parsed = parseStats(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase.from("stat_submissions").insert({
    match_id: ids.matchId,
    player_id: ids.playerId,
    submitted_by: authData.user.id,
    ...parsed.data,
    status: "approved",
    reviewed_by: authData.user.id,
    reviewed_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") return { error: "This player already has a submission for this match." };
    return { error: error.message };
  }

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function adminEditSubmission(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.submissionId) return { error: "Invalid request." };

  const parsed = parseStats(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stat_submissions")
    .update({ ...parsed.data, submitted_by: authData.user.id })
    .eq("id", ids.submissionId);

  if (error) return { error: error.message };

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function approveSubmission(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.submissionId) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stat_submissions")
    .update({
      status: "approved",
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", ids.submissionId);

  if (error) return { error: error.message };

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}

export async function rejectSubmission(
  _prevState: SubmissionActionResult,
  formData: FormData,
): Promise<SubmissionActionResult> {
  const ids = parseIds(formData);
  if (!ids?.submissionId) return { error: "Invalid request." };

  const parsed = rejectSubmissionSchema.safeParse({
    rejection_reason: formData.get("rejection_reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stat_submissions")
    .update({
      status: "rejected",
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: parsed.data.rejection_reason,
    })
    .eq("id", ids.submissionId);

  if (error) return { error: error.message };

  redirect(`/leagues/${ids.leagueId}/matches/${ids.matchId}`);
}
