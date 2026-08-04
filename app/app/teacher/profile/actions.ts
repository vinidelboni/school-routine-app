"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentContext } from "../../../lib/auth";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";

export async function updateTeacherAvatar(formData: FormData) {
  const file = formData.get("avatar");
  if (!(file instanceof File) || !file.size || file.size > 3_145_728) {
    redirect("/app/teacher/profile?error=invalid-avatar");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  const isWebp = bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  const detected = isJpeg ? { extension: "jpg", mime: "image/jpeg" } : isPng ? { extension: "png", mime: "image/png" } : isWebp ? { extension: "webp", mime: "image/webp" } : null;
  if (!detected) redirect("/app/teacher/profile?error=invalid-avatar");

  const { user, membership, profile } = await getCurrentContext();
  if (membership.role !== "teacher") redirect("/app");
  const admin = createSupabaseAdminClient();
  const storagePath = `${user.id}/${crypto.randomUUID()}.${detected.extension}`;
  const { error: uploadError } = await admin.storage.from("teacher-avatars").upload(storagePath, bytes, { contentType: detected.mime, cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { error: profileError } = await admin.from("profiles").update({ avatar_path: storagePath }).eq("id", user.id);
  if (profileError) {
    await admin.storage.from("teacher-avatars").remove([storagePath]);
    throw profileError;
  }
  if (profile?.avatar_path) await admin.storage.from("teacher-avatars").remove([profile.avatar_path]);
  await admin.from("audit_logs").insert({ school_id: membership.school_id, actor_id: user.id, action: "teacher.avatar_updated", entity_type: "profile", entity_id: user.id });
  revalidatePath("/app", "layout");
  revalidatePath("/app/teacher/profile");
  redirect("/app/teacher/profile?success=avatar-updated");
}
