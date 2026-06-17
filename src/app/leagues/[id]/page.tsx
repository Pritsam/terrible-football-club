import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { InvitePanel } from "@/components/leagues/invite-panel";
import { createClient } from "@/lib/supabase/server";

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

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, status, invite_code, created_by, created_at")
    .eq("id", id)
    .single();

  if (!league) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("league_memberships")
    .select("role")
    .eq("league_id", id)
    .eq("user_id", data.user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const isAdmin = membership.role === "admin";

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

        <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:200ms]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <p className="font-heading text-lg tracking-wide text-foreground">
                Matches & leaderboard coming soon
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Members, match creation, and stat submissions are being built next.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
