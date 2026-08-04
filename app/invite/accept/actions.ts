"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export async function acceptInvite(formData: FormData) {
  const parsed = z.object({
    password: z.string().min(8).max(72),
    confirmation: z.string(),
  }).safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success || parsed.data.password !== parsed.data.confirmation) {
    redirect("/invite/accept?error=password");
  }

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login?error=invalid-invite");

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (passwordError) redirect("/invite/accept?error=update");

  const { error: activationError } = await supabase.rpc("activate_current_user_invites");
  if (activationError) redirect("/invite/accept?error=activation");
  redirect("/app");
}
