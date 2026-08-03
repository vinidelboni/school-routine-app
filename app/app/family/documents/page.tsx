import { redirect } from "next/navigation";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { CopyBarcodeButton } from "./copy-barcode-button";

export default async function FamilyDocumentsPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: documents } = await supabase
    .from("billing_documents")
    .select(
      "id, original_filename, storage_path, due_date, payment_reference, viewed_at, children(first_name, last_name), billing_batches(title, reference_month)",
    )
    .eq("status", "distributed")
    .order("created_at", { ascending: false });

  return (
    <div>
      <header>
        <span className="text-[9px] font-extrabold tracking-[.18em] text-[#6f91c3]">
          FINANCEIRO
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#172b4d]">
          Boletos
        </h1>
        <p className="mt-1 text-xs text-[#77869d]">Documentos enviados pela escola.</p>
      </header>
      <section className="mt-5 grid gap-3">
        {documents?.map((document) => {
          const child = Array.isArray(document.children)
            ? document.children[0]
            : document.children;
          const batch = Array.isArray(document.billing_batches)
            ? document.billing_batches[0]
            : document.billing_batches;
          return (
            <article
              key={document.id}
              className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(35,73,128,.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e6d8] text-[#986d4e]">
                    <FileText size={19} />
                  </span>
                  <span>
                    <strong className="block text-sm text-[#27364c]">{batch?.title}</strong>
                    <small className="mt-1 block text-[9px] text-[#7c8680]">
                      {child?.first_name} · vence em {document.due_date}
                    </small>
                  </span>
                </span>
                {document.viewed_at ? <span className="flex items-center gap-1 text-[9px] font-bold text-[#315645]"><CheckCircle2 size={14} /> Visualizado</span> : null}
              </div>
              <div className="mt-4 rounded-xl bg-[#f5f8fc] p-3">
                <span className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#71879e]">Linha digitável</span>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-[11px] leading-5 text-[#294968]">{document.payment_reference.replace(/(\d{5})(?=\d)/g, "$1 ")}</code>
                  <CopyBarcodeButton value={document.payment_reference} />
                </div>
              </div>
              {document.storage_path ? (
                <a href={`/app/family/documents/${document.id}/download`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1768c5] px-4 py-3 text-[10px] font-bold text-white">
                  <Download size={15} /> Abrir PDF seguro
                </a>
              ) : (
                <p className="mt-3 rounded-xl bg-[#fff4e6] p-3 text-center text-[10px] font-bold text-[#91612f]">Documento antigo sem PDF armazenado.</p>
              )}
            </article>
          );
        })}
        {!documents?.length ? (
          <div className="rounded-2xl border border-dashed border-[#dfe1d9] bg-white p-10 text-center text-xs text-[#7c8680]">
            Nenhum documento disponibilizado.
          </div>
        ) : null}
      </section>
    </div>
  );
}
