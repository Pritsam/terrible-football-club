import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", data.user.id)
    .single();

  const displayName = profile?.name ?? profile?.email ?? data.user.email;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="animate-fade-up">
          <h1 className="font-heading text-3xl tracking-wide text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your leagues, matches, and leaderboard will live here.
          </p>
        </div>

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
                League creation and joining are coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
