import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center gap-1 text-center"
        >
          <span className="font-heading text-3xl tracking-wide text-foreground uppercase">
            Terrible <span className="text-primary">FC</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Fantasy League Tracker
          </span>
        </Link>

        <Card className="bg-card/80 shadow-2xl shadow-black/40 ring-foreground/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl tracking-wide">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      </div>
    </main>
  );
}
