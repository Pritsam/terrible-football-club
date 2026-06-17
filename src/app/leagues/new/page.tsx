import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { CreateLeagueForm } from "@/components/leagues/create-league-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewLeaguePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="animate-fade-up">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to dashboard
          </Link>
        </div>

        <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:100ms]">
          <CardHeader>
            <CardTitle className="font-heading text-xl tracking-wide uppercase">
              Create a league
            </CardTitle>
            <CardDescription>
              You&apos;ll be the admin. Share the invite code once it&apos;s created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateLeagueForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
