"use client";

import { useState, useRef, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Check, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { updateProfile } from "@/lib/profile/actions";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  initialName: string;
  initialAvatarUrl: string;
  email: string;
  userId: string;
}

export function ProfileForm({ initialName, initialAvatarUrl, email, userId }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, undefined);
  const [isPending, startTransition] = useTransition();

  const [previewSrc, setPreviewSrc] = useState<string>(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setPreviewSrc(URL.createObjectURL(file));

    setIsUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      const supabase = createClient();
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(`${userId}/avatar`, compressed, {
          upsert: true,
          contentType: compressed.type,
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(`${userId}/avatar`);

      setValue("avatar_url", `${urlData.publicUrl}?t=${Date.now()}`, { shouldDirty: true });
    } catch {
      setUploadError("Failed to upload image. Please try again.");
      setPreviewSrc(initialAvatarUrl);
      setValue("avatar_url", initialAvatarUrl, { shouldDirty: false });
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initials = initialName ? initialName[0].toUpperCase() : email[0]?.toUpperCase() ?? "?";

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

        <Field data-invalid={!!uploadError}>
          <FieldLabel>Avatar</FieldLabel>

          {/* Hidden RHF field — holds the Supabase Storage URL after upload */}
          <input type="hidden" {...register("avatar_url")} />

          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
              {previewSrc ? (
                <Image
                  src={previewSrc}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-primary/10">
                  {initials === "?" ? (
                    <User className="size-6 text-muted-foreground" />
                  ) : (
                    <span className="font-heading text-xl tracking-wide text-primary uppercase">
                      {initials}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading || isPending}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="size-3.5" />
                {isUploading ? "Uploading…" : previewSrc ? "Change photo" : "Upload photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, or WebP · Compressed to 300 KB automatically
              </p>
            </div>
          </div>

          {uploadError && <FieldError>{uploadError}</FieldError>}
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
          <Button type="submit" disabled={isPending || isUploading} className="w-full">
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
