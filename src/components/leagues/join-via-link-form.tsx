"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { joinLeague } from "@/lib/leagues/actions";

interface JoinViaLinkFormProps {
  inviteCode: string;
}

export function JoinViaLinkForm({ inviteCode }: JoinViaLinkFormProps) {
  const [state, formAction] = useActionState(joinLeague, undefined);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("invite_code", inviteCode);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 w-full flex flex-col gap-2">
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Joining…" : "Join league"}
      </Button>
      {state && "error" in state ? <FieldError>{state.error}</FieldError> : null}
    </form>
  );
}
