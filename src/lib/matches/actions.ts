"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createMatchSchema } from "@/lib/validations/matches";

export type MatchActionResult = { error: string } | undefined;

export async function createMatch(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const leagueId = formData.get("league_id") as string;
  if (!leagueId) return { error: "Invalid request." };

  const parsed = createMatchSchema.safeParse({
    match_date: formData.get("match_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      league_id: leagueId,
      match_date: parsed.data.match_date,
      created_by: authData.user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A match already exists for this date." };
    }
    return { error: error.message };
  }

  redirect(`/leagues/${leagueId}/matches/${match.id}`);
}

export async function updateMatchDate(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const matchId = formData.get("match_id") as string;
  const leagueId = formData.get("league_id") as string;

  if (!matchId || !leagueId) return { error: "Invalid request." };

  const parsed = createMatchSchema.safeParse({
    match_date: formData.get("match_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("matches")
    .update({ match_date: parsed.data.match_date })
    .eq("id", matchId)
    .eq("league_id", leagueId);

  if (error) {
    if (error.code === "23505") {
      return { error: "A match already exists for this date." };
    }
    return { error: error.message };
  }

  redirect(`/leagues/${leagueId}/matches/${matchId}`);
}

export async function deleteMatch(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const matchId = formData.get("match_id") as string;
  const leagueId = formData.get("league_id") as string;

  if (!matchId || !leagueId) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("league_id", leagueId);

  if (error) return { error: error.message };

  redirect(`/leagues/${leagueId}`);
}
