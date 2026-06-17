"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { joinLeague } from "@/lib/leagues/actions";
import { joinLeagueSchema, type JoinLeagueInput } from "@/lib/validations/leagues";

export function JoinLeagueForm() {
  const [state, formAction] = useActionState(joinLeague, undefined);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinLeagueInput>({
    resolver: zodResolver(joinLeagueSchema),
  });

  const onValid = (data: JoinLeagueInput) => {
    const formData = new FormData();
    formData.set("invite_code", data.invite_code);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.invite_code}>
          <FieldLabel htmlFor="invite_code">Invite code</FieldLabel>
          <Input
            id="invite_code"
            type="text"
            placeholder="e.g. a1b2c3d4"
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!errors.invite_code}
            {...register("invite_code")}
          />
          <FieldError errors={[errors.invite_code]} />
        </Field>

        {state && "error" in state ? (
          <FieldError>{state.error}</FieldError>
        ) : null}

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Joining…" : "Join league"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
