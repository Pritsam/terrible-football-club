"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLeagueSchema, joinLeagueSchema } from "@/lib/validations/leagues";

export type LeagueAdminActionResult = { error: string } | undefined;

export type CreateLeagueActionResult = { error: string } | undefined;

export async function createLeague(
  _prevState: CreateLeagueActionResult,
  formData: FormData,
): Promise<CreateLeagueActionResult> {
  const parsed = createLeagueSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // create_league is a SECURITY DEFINER function that atomically inserts the
  // league and the creator's admin membership, avoiding RLS bootstrap ordering issues.
  const { data: leagueId, error } = await supabase.rpc("create_league", {
    p_name: parsed.data.name,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/leagues/${leagueId as string}`);
}

export type JoinLeagueActionResult = { error: string } | undefined;

export async function joinLeague(
  _prevState: JoinLeagueActionResult,
  formData: FormData,
): Promise<JoinLeagueActionResult> {
  const parsed = joinLeagueSchema.safeParse({
    invite_code: formData.get("invite_code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { error: "You must be signed in to join a league." };
  }

  const { data: leagueId, error: joinError } = await supabase.rpc(
    "join_league_by_invite_code",
    { p_invite_code: parsed.data.invite_code },
  );

  if (joinError) {
    if (joinError.message === "already_member") {
      return { error: "You are already a member of this league." };
    }
    if (joinError.message.includes("Invalid or expired invite code")) {
      return { error: "Invalid invite code. Check the code and try again." };
    }
    return { error: joinError.message };
  }

  redirect(`/leagues/${leagueId as string}`);
}

export async function updateLeagueStatus(
  _prevState: LeagueAdminActionResult,
  formData: FormData,
): Promise<LeagueAdminActionResult> {
  const leagueId = formData.get("league_id") as string;
  const status = formData.get("status") as string;

  if (!leagueId || !["active", "closed", "deleted"].includes(status)) {
    return { error: "Invalid request." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("leagues")
    .update({ status })
    .eq("id", leagueId);

  if (error) return { error: error.message };

  if (status === "deleted") {
    redirect("/");
  }
  redirect(`/leagues/${leagueId}`);
}

export async function updateMemberRole(
  _prevState: LeagueAdminActionResult,
  formData: FormData,
): Promise<LeagueAdminActionResult> {
  const leagueId = formData.get("league_id") as string;
  const membershipId = formData.get("membership_id") as string;
  const role = formData.get("role") as string;

  if (!leagueId || !membershipId || !["admin", "player"].includes(role)) {
    return { error: "Invalid request." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("league_memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("league_id", leagueId);

  if (error) {
    if (error.message.includes("at least one admin")) {
      return { error: "A league must always have at least one admin." };
    }
    return { error: error.message };
  }

  redirect(`/leagues/${leagueId}`);
}

export async function removeMember(
  _prevState: LeagueAdminActionResult,
  formData: FormData,
): Promise<LeagueAdminActionResult> {
  const leagueId = formData.get("league_id") as string;
  const membershipId = formData.get("membership_id") as string;

  if (!leagueId || !membershipId) {
    return { error: "Invalid request." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("league_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("league_id", leagueId);

  if (error) {
    if (error.message.includes("at least one admin")) {
      return { error: "Cannot remove the last admin." };
    }
    return { error: error.message };
  }

  redirect(`/leagues/${leagueId}`);
}
