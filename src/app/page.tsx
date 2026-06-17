import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("league_memberships")
    .select("role, leagues(id, name, status)")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  const leagues = (memberships ?? [])
    .map((m) => ({
      role: m.role as string,
      league: (m.leagues as unknown) as { id: string; name: string; status: string } | null,
    }))
    .filter((m) => m.league !== null);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="animate-fade-up flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl tracking-wide text-foreground uppercase">
              My Leagues
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {leagues.length === 0
                ? "Create a league or join one with an invite code."
                : `${leagues.length} league${leagues.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/leagues/new">
              <Plus className="size-4" />
              New league
            </Link>
          </Button>
        </div>

        {leagues.length === 0 ? (
          <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:100ms]">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Trophy className="size-6" />
              </div>
              <div>
                <p className="font-heading text-lg tracking-wide text-foreground">
                  No leagues yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first league to get started.
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link href="/leagues/new">
                  <Plus className="size-4" />
                  Create a league
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {leagues.map(({ role, league }, i) => (
              <li
                key={league!.id}
                className="animate-fade-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <Link href={`/leagues/${league!.id}`} className="block">
                  <Card className="bg-card/80 ring-foreground/10 transition-colors hover:bg-card">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-heading text-base tracking-wide text-foreground uppercase truncate">
                          {league!.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={league!.status} />
                          <RoleBadge role={role} />
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-primary/15 text-primary"
          : "bg-muted/50 text-muted-foreground"
      }`}
    >
      {isActive ? "Active" : "Closed"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground">
      {isAdmin ? "Admin" : "Player"}
    </span>
  );
}
