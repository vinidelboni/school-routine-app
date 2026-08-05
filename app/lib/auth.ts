import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";

export const ACTIVE_MEMBERSHIP_COOKIE = "somamais-active-membership";

export const getCurrentContext = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect("/login");

  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };

  const [{ data: memberships, error }, { data: profile }, cookieStore] = await Promise.all([
    supabase.from("school_memberships").select("id, school_id, role, status, schools(id, name, slug)").eq("user_id", user.id).eq("status", "active").order("created_at"),
    supabase.from("profiles").select("full_name, avatar_path").eq("id", user.id).single(),
    cookies(),
  ]);

  if (error) throw error;
  const selectedMembershipId = cookieStore.get(ACTIVE_MEMBERSHIP_COOKIE)?.value;
  const membership = memberships?.find((item) => item.id === selectedMembershipId) ?? memberships?.[0];
  if (!membership) redirect("/login?error=no-active-membership");

  return { supabase, user, membership, memberships: memberships ?? [], profile };
});
