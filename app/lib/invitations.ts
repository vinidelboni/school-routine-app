import "server-only";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "./supabase/admin";

export async function getInviteRedirectUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configuredUrl) return `${configuredUrl}/invite/session`;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Não foi possível determinar o endereço do aplicativo.");
  return `${protocol}://${host}/invite/session`;
}

export async function inviteNewUser(email: string, fullName: string) {
  const admin = createSupabaseAdminClient();
  const redirectTo = await getInviteRedirectUrl();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: fullName },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new Error("Este e-mail já possui uma conta. O vínculo com múltiplas escolas será tratado na próxima etapa.");
    }
    throw error;
  }
  if (!data.user) throw new Error("O provedor não retornou o usuário convidado.");
  return { admin, invitedUser: data.user };
}
