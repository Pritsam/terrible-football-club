import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <AuthShell
      title="Create your account"
      description="Join the league and start logging your stats."
      footer="By signing up you agree to play fairly and report your own results."
    >
      <SignupForm />
    </AuthShell>
  );
}
