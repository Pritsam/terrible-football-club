"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { GoogleButton } from "@/components/auth/google-button";
import { login } from "@/lib/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, undefined);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (state && "success" in state) {
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  const onValid = (data: LoginInput) => {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        {state && "error" in state ? (
          <FieldError>{state.error}</FieldError>
        ) : null}

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </Field>

        <FieldSeparator>or</FieldSeparator>

        <GoogleButton />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
