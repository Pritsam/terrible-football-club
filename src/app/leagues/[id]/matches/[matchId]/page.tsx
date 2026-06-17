import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { MatchActions } from "@/components/matches/match-actions";
import { createClient } from "@/lib/supabase/server";

interface MatchPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

function formatMatchDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id: leagueId, matchId } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const [leagueResult, membershipResult, matchResult] = await Promise.all([
    supabase
      .from("leagues")
      .select("id, name, status")
      .eq("id", leagueId)
      .single(),
    supabase
      .from("league_memberships")
      .select("role")
      .eq("league_id", leagueId)
      .eq("user_id", authData.user.id)
      .single(),
    supabase
      .from("matches")
      .select("id, match_date, created_at")
      .eq("id", matchId)
      .eq("league_id", leagueId)
      .single(),
  ]);

  const league = leagueResult.data;
  const membership = membershipResult.data;
  const match = matchResult.data;

  if (!league || !membership || !match) {
    notFound();
  }

  const isAdmin = membership.role === "admin";
  const isActive = league.status === "active";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="animate-fade-up">
          <Link
            href={`/leagues/${leagueId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {league.name}
          </Link>
        </div>

        <div className="animate-fade-up [animation-delay:50ms]">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Match
          </p>
          <h1 className="font-heading mt-1 text-3xl tracking-wide text-foreground uppercase">
            {formatMatchDate(match.match_date)}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {isActive ? "Active" : "Closed"}
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground">
                <Shield className="size-3" />
                Admin
              </span>
            )}
          </div>
        </div>

        <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:100ms]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <p className="font-heading text-lg tracking-wide text-foreground">
                Stat submissions coming soon
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Players will be able to submit goals, assists, and match results here.
              </p>
            </div>
          </CardContent>
        </Card>

        {isAdmin && isActive && (
          <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:150ms]">
            <CardContent className="py-5">
              <p className="mb-4 text-sm font-medium text-foreground">Match settings</p>
              <MatchActions
                matchId={matchId}
                leagueId={leagueId}
                currentDate={match.match_date}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
