"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLeagueSchema } from "@/lib/validations/leagues";

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
