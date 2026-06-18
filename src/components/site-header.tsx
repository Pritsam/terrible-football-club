import Link from "next/link";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  let name = "";
  let avatarUrl = "";

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", data.user.id)
      .single();

    name = profile?.name ?? "";
    avatarUrl = profile?.avatar_url ?? "";
  }

  const initials = name ? name[0].toUpperCase() : data.user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl tracking-wide text-foreground uppercase"
        >
          Terrible <span className="text-primary">FC</span>
        </Link>

        {data.user && (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full p-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Your profile"
            >
              {avatarUrl ? (
                <div className="relative size-7 overflow-hidden rounded-full ring-1 ring-border">
                  <Image
                    src={avatarUrl}
                    alt={name || "Avatar"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 ring-1 ring-border">
                  {initials === "?" ? (
                    <User className="size-3.5 text-muted-foreground" />
                  ) : (
                    <span className="font-heading text-xs tracking-wide text-primary uppercase">
                      {initials}
                    </span>
                  )}
                </div>
              )}
              <span className="hidden sm:inline">{name || "Profile"}</span>
            </Link>

            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        )}

        {!data.user && (
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
