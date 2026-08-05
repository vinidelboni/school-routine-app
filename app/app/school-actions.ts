"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACTIVE_MEMBERSHIP_COOKIE } from "../lib/auth";
import { createSupabaseServerClient } from "../lib/supabase/server";

export async function selectSchool(formData: FormData) {
  const membershipId = z.string().uuid().parse(formData.get("membershipId"));
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membership, error } = await supabase.from("school_memberships")
    .select("id").eq("id", membershipId).eq("user_id", userId)
    .eq("status", "active").maybeSingle();
  if (error) throw error;
  if (!membership) redirect("/app");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_MEMBERSHIP_COOKIE, membership.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/app");
}
