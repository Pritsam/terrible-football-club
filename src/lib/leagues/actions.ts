"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLeagueSchema, joinLeagueSchema } from "@/lib/validations/leagues";

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
