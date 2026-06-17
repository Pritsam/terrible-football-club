import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { JoinViaLinkForm } from "@/components/leagues/join-via-link-form";
import { createClient } from "@/lib/supabase/server";

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect(`/login?redirect=/join/${code}`);
  }

  const { data: leagues } = await supabase.rpc("get_league_by_invite_code", {
    p_invite_code: code,
  });

  if (!leagues || leagues.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
          <Card className="w-full bg-card/80 ring-foreground/10">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Users className="size-6" />
              </div>
              <div>
                <p className="font-heading text-lg tracking-wide text-foreground">
                  Invalid invite link
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This invite link is no longer valid or the league is closed.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/">Back to my leagues</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const league = leagues[0] as { id: string; name: string };

  const { data: existing } = await supabase
    .from("league_memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", authData.user.id)
    .single();

  if (existing) {
    redirect(`/leagues/${league.id}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
        <Card className="w-full bg-card/80 ring-foreground/10">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">You&apos;ve been invited to join</p>
              <p className="font-heading mt-1 text-2xl tracking-wide text-foreground uppercase">
                {league.name}
              </p>
            </div>
            <JoinViaLinkForm inviteCode={code} />
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
