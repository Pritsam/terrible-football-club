import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
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
  const initials = name ? name[0].toUpperCase() : email[0]?.toUpperCase() ?? "?";

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

        <div className="animate-fade-up flex justify-center [animation-delay:100ms]">
          <div className="flex flex-col items-center gap-3">
            {avatarUrl ? (
              <div className="relative size-20 overflow-hidden rounded-full ring-2 ring-border">
                <Image
                  src={avatarUrl}
                  alt={name || "Avatar"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
                {initials === "?" ? (
                  <User className="size-8 text-muted-foreground" />
                ) : (
                  <span className="font-heading text-3xl tracking-wide text-primary uppercase">
                    {initials}
                  </span>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:150ms]">
          <CardContent className="py-5">
            <ProfileForm
              initialName={name}
              initialAvatarUrl={avatarUrl}
              email={email}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
