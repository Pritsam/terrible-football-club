"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function updateProfile(
  _prev: { error: string } | { success: true } | undefined,
  formData: FormData,
): Promise<{ error: string } | { success: true } | undefined> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "Not authenticated" };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    avatar_url: formData.get("avatar_url") || "",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid input" };
  }

  const { name, avatar_url } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({ name, avatar_url: avatar_url || null })
    .eq("id", userData.user.id);

  if (error) {
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}
