import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentContext } from "../../../../../lib/auth";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ recipientId: string }> }) {
  const { recipientId } = await params;
  const id = z.uuid().parse(recipientId);
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { data: recipient } = await supabase.from("school_document_recipients").select("id, school_documents!inner(original_filename, storage_path)").eq("id", id).eq("membership_id", membership.id).maybeSingle();
  const document = recipient ? (Array.isArray(recipient.school_documents) ? recipient.school_documents[0] : recipient.school_documents) : null;
  if (!recipient || !document?.storage_path) return NextResponse.json({ error: "PDF não disponível." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from("school-documents").createSignedUrl(document.storage_path, 60, { download: document.original_filename });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Não foi possível abrir o PDF." }, { status: 404 });
  await admin.from("school_document_recipients").update({ viewed_at: new Date().toISOString() }).eq("id", recipient.id).eq("membership_id", membership.id);
  return NextResponse.redirect(data.signedUrl);
}
