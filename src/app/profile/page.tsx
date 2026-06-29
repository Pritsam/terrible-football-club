import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url")
    .eq("id", userData.user.id)
    .single();

  const name = profile?.name ?? "";
  const email = profile?.email ?? userData.user.email ?? "";
  const avatarUrl = profile?.avatar_url ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="animate-fade-up">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
        </div>

        <div className="animate-fade-up [animation-delay:50ms]">
          <h1 className="font-heading text-3xl tracking-wide text-foreground uppercase">
            Your Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your display name and avatar.
          </p>
        </div>

<Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:150ms]">
          <CardContent className="py-5">
            <ProfileForm
              initialName={name}
              initialAvatarUrl={avatarUrl}
              email={email}
              userId={userData.user.id}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
