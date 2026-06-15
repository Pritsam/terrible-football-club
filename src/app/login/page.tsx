import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to track your matches and check the table."
      footer="New to the league? Ask your admin for an invite link."
    >
      <LoginForm />
    </AuthShell>
  );
}
