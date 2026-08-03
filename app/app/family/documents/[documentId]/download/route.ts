import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentContext } from "../../../../../lib/auth";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const id = z.uuid().parse(documentId);
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { data: document } = await supabase
    .from("billing_documents")
    .select("id, original_filename, storage_path, status")
    .eq("id", id)
    .eq("status", "distributed")
    .maybeSingle();

  if (!document?.storage_path) return NextResponse.json({ error: "PDF não disponível." }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from("billing-documents")
    .createSignedUrl(document.storage_path, 60, { download: document.original_filename });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Não foi possível abrir o PDF." }, { status: 404 });

  await supabase.from("billing_documents").update({ viewed_at: new Date().toISOString() }).eq("id", document.id);
  return NextResponse.redirect(data.signedUrl);
}
