"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { updateProfile } from "@/lib/profile/actions";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";

interface ProfileFormProps {
  initialName: string;
  initialAvatarUrl: string;
  email: string;
}

export function ProfileForm({ initialName, initialAvatarUrl, email }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, undefined);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialName,
      avatar_url: initialAvatarUrl,
    },
  });

  const onValid = (data: UpdateProfileInput) => {
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("avatar_url", data.avatar_url ?? "");
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input
            id="profile-email"
            type="email"
            value={email}
            disabled
            className="opacity-60"
          />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
        </Field>

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="profile-name">Display name</FieldLabel>
          <Input
            id="profile-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.avatar_url}>
          <FieldLabel htmlFor="profile-avatar">Avatar URL</FieldLabel>
          <Input
            id="profile-avatar"
            type="url"
            placeholder="https://example.com/your-photo.jpg"
            aria-invalid={!!errors.avatar_url}
            {...register("avatar_url")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a public image URL to use as your avatar.
          </p>
          <FieldError errors={[errors.avatar_url]} />
        </Field>

        {state && "error" in state && (
          <FieldError>{state.error}</FieldError>
        )}

        {state && "success" in state && (
          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            <Check className="size-4 shrink-0" />
            Profile updated successfully.
          </div>
        )}

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
