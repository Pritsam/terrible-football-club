"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createLeague } from "@/lib/leagues/actions";
import { createLeagueSchema, type CreateLeagueInput } from "@/lib/validations/leagues";

export function CreateLeagueForm() {
  const [state, formAction] = useActionState(createLeague, undefined);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeagueInput>({
    resolver: zodResolver(createLeagueSchema),
  });

  const onValid = (data: CreateLeagueInput) => {
    const formData = new FormData();
    formData.set("name", data.name);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">League name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Sunday League FC"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        {state && "error" in state ? (
          <FieldError>{state.error}</FieldError>
        ) : null}

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating…" : "Create league"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
