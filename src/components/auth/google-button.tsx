"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { signInWithGoogle } from "@/lib/auth/actions";

export function GoogleButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={handleClick}
      >
        <GoogleIcon className="size-4" />
        {isPending ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M12 10.8v3.6h5.1c-.2 1.2-1.6 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.8 12 6.8c1.7 0 2.9.7 3.6 1.3l2.5-2.4C16.6 4.2 14.5 3.3 12 3.3 7 3.3 2.9 7.4 2.9 12.4S7 21.5 12 21.5c5.4 0 9.5-3.8 9.5-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
