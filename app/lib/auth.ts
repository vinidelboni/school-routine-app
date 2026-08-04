import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export const getCurrentContext = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect("/login");

  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };

  const [{ data: membership, error }, { data: profile }] = await Promise.all([
    supabase.from("school_memberships").select("id, school_id, role, status, schools(id, name, slug)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  if (error) throw error;
  if (!membership) redirect("/login?error=no-active-membership");

  return { supabase, user, membership, profile };
});
