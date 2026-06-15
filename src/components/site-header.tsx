import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl tracking-wide text-foreground uppercase"
        >
          Terrible <span className="text-primary">FC</span>
        </Link>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
