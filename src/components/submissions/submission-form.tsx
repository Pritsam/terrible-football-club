"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { submitStatsSchema, type SubmitStatsInput } from "@/lib/validations/submissions";

interface SubmissionFormProps {
  defaultValues?: Partial<SubmitStatsInput>;
  isPending: boolean;
  error?: string;
  submitLabel?: string;
  idPrefix?: string;
  onSubmit: (data: SubmitStatsInput) => void;
  onCancel?: () => void;
}

export function SubmissionForm({
  defaultValues,
  isPending,
  error,
  submitLabel = "Submit",
  idPrefix = "stats",
  onSubmit,
  onCancel,
}: SubmissionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitStatsInput>({
    resolver: zodResolver(submitStatsSchema),
    defaultValues: { goals: 0, assists: 0, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field data-invalid={!!errors.goals}>
          <FieldLabel htmlFor={`${idPrefix}-goals`}>Goals</FieldLabel>
          <Input
            id={`${idPrefix}-goals`}
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.goals}
            {...register("goals", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.goals]} />
        </Field>
        <Field data-invalid={!!errors.assists}>
          <FieldLabel htmlFor={`${idPrefix}-assists`}>Assists</FieldLabel>
          <Input
            id={`${idPrefix}-assists`}
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.assists}
            {...register("assists", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.assists]} />
        </Field>
      </div>

      <Field data-invalid={!!errors.result}>
        <FieldLabel>Result</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {(["win", "loss", "draw"] as const).map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center justify-center rounded-md border border-border/60 px-3 py-2 text-sm font-medium capitalize transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary hover:border-border"
            >
              <input
                type="radio"
                value={option}
                className="sr-only"
                {...register("result")}
              />
              {option}
            </label>
          ))}
        </div>
        <FieldError errors={[errors.result]} />
      </Field>

      {error && <FieldError>{error}</FieldError>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
