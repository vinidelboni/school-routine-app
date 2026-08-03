import { redirect } from "next/navigation";
import { CheckCircle2, Download, FileText, FolderOpen } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

const categoryLabels = { circular: "Circular", policy: "Normas", calendar: "Calendário", pedagogical: "Pedagógico", health: "Saúde", other: "Outros" } as const;

export default async function FamilyLibraryPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: recipients } = await supabase
    .from("school_document_recipients")
    .select("id, viewed_at, child_id, children(first_name, last_name), school_documents!inner(id, title, description, category, original_filename, published_at)")
    .eq("membership_id", membership.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <header><span className="text-[9px] font-extrabold tracking-[.18em] text-[#6f91c3]">ESCOLA</span><h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#172b4d]">Biblioteca</h1><p className="mt-1 text-xs text-[#77869d]">Documentos compartilhados pela escola.</p></header>
      <section className="mt-5 grid gap-3">
        {recipients?.map((recipient) => {
          const document = Array.isArray(recipient.school_documents) ? recipient.school_documents[0] : recipient.school_documents;
          const child = Array.isArray(recipient.children) ? recipient.children[0] : recipient.children;
          if (!document) return null;
          return (
            <article key={recipient.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(35,73,128,.06)]">
              <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#eaf5ff] to-[#dcecff] text-[#1768c5]"><FileText size={20} /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-start justify-between gap-2"><strong className="block text-sm text-[#27364c]">{document.title}</strong>{recipient.viewed_at ? <span className="flex items-center gap-1 text-[9px] font-bold text-[#1768c5]"><CheckCircle2 size={13} /> Visualizado</span> : <span className="rounded-full bg-[#e8f3ff] px-2 py-1 text-[8px] font-extrabold text-[#1768c5]">NOVO</span>}</span><small className="mt-1 block text-[9px] text-[#7b8ba0]">{categoryLabels[document.category as keyof typeof categoryLabels]} · {child?.first_name}</small></span></div>
              {document.description ? <p className="mt-3 text-xs leading-5 text-[#61758d]">{document.description}</p> : null}
              <a href={`/app/family/library/${recipient.id}/download`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1768c5] px-4 py-3 text-[10px] font-bold text-white"><Download size={15} /> Abrir PDF seguro</a>
            </article>
          );
        })}
        {!recipients?.length ? <div className="rounded-2xl border border-dashed border-[#d8e2ee] bg-white p-10 text-center text-xs text-[#7b8ba0]"><FolderOpen className="mx-auto mb-2" size={24} />Nenhum documento disponível.</div> : null}
      </section>
    </div>
  );
}
