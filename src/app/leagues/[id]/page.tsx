import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { InvitePanel } from "@/components/leagues/invite-panel";
import { MembersList } from "@/components/leagues/members-list";
import { LeagueSettingsPanel } from "@/components/leagues/league-settings-panel";
import { createClient } from "@/lib/supabase/server";
import type { LeagueMember } from "@/components/leagues/members-list";

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const [leagueResult, membershipResult, membersResult] = await Promise.all([
    supabase
      .from("leagues")
      .select("id, name, status, invite_code, created_by, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("league_memberships")
      .select("role")
      .eq("league_id", id)
      .eq("user_id", data.user.id)
      .single(),
    supabase
      .from("league_memberships")
      .select("id, user_id, role, created_at, profiles(name, email, avatar_url)")
      .eq("league_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const league = leagueResult.data;
  const membership = membershipResult.data;

  if (!league || !membership) {
    notFound();
  }

  const isAdmin = membership.role === "admin";
  const members = (membersResult.data ?? []) as unknown as LeagueMember[];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="animate-fade-up">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            My leagues
          </Link>
        </div>

        <div className="animate-fade-up flex items-start justify-between gap-4 [animation-delay:50ms]">
          <div>
            <h1 className="font-heading text-3xl tracking-wide text-foreground uppercase">
              {league.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  league.status === "active"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {league.status === "active" ? "Active" : "Closed"}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground">
                  <Shield className="size-3" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <InvitePanel inviteCode={league.invite_code as string} />
        )}

        <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:150ms]">
          <CardContent className="py-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Members{" "}
                <span className="text-muted-foreground font-normal">({members.length})</span>
              </p>
            </div>
            <MembersList
              leagueId={id}
              members={members}
              currentUserId={data.user.id}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:200ms]">
            <CardContent className="py-5">
              <p className="mb-4 text-sm font-medium text-foreground">League settings</p>
              <LeagueSettingsPanel leagueId={id} status={league.status} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
