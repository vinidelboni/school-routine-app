import { redirect } from "next/navigation";
import { CheckCircle2, FileText, FolderOpen, UsersRound } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { DocumentUploader } from "./document-uploader";

const categoryLabels = {
  circular: "Circular",
  policy: "Normas e políticas",
  calendar: "Calendário",
  pedagogical: "Pedagógico",
  health: "Saúde",
  other: "Outros",
} as const;

const scopeLabels = { school: "Toda a escola", classroom: "Turma", child: "Criança" } as const;
type SearchParams = Promise<{ success?: string }>;

export default async function DirectionDocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const [{ data: classrooms }, { data: children }, { data: documents }] = await Promise.all([
    supabase.from("classrooms").select("id, name").eq("school_id", membership.school_id).eq("active", true).order("name"),
    supabase.from("children").select("id, first_name, last_name").eq("school_id", membership.school_id).eq("active", true).order("first_name"),
    supabase.from("school_documents").select("id, title, description, category, scope, original_filename, published_at, classrooms(name), children(first_name, last_name), school_document_recipients(id, viewed_at)").eq("school_id", membership.school_id).order("published_at", { ascending: false }),
  ]);

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">DOCUMENTOS DA ESCOLA</span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Biblioteca de documentos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61758d]">Centralize circulares, normas, calendários e materiais em um ambiente privado.</p>
      </header>

      {query.success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd]"><CheckCircle2 size={20} /><strong className="text-sm">Documento publicado para as famílias!</strong></div> : null}

      <section className="mt-7 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <DocumentUploader
          schoolId={membership.school_id}
          classrooms={(classrooms ?? []).map((item) => ({ id: item.id, name: item.name }))}
          childOptions={(children ?? []).map((item) => ({ id: item.id, name: `${item.first_name} ${item.last_name}` }))}
        />
        <div className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
          <div className="flex items-center justify-between gap-3">
            <span><span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">PUBLICADOS</span><h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Acervo da escola</h2></span>
            <span className="rounded-full bg-[#edf5fd] px-3 py-1.5 text-[10px] font-bold text-[#0759bd]">{documents?.length ?? 0} arquivos</span>
          </div>
          <div className="mt-5 grid gap-3">
            {documents?.map((document) => {
              const classroom = Array.isArray(document.classrooms) ? document.classrooms[0] : document.classrooms;
              const child = Array.isArray(document.children) ? document.children[0] : document.children;
              const recipients = document.school_document_recipients ?? [];
              const viewed = recipients.filter((recipient) => recipient.viewed_at).length;
              const target = document.scope === "classroom" ? classroom?.name : document.scope === "child" ? `${child?.first_name} ${child?.last_name}` : scopeLabels.school;
              return (
                <article key={document.id} className="rounded-2xl border border-[#e3eaf2] p-4">
                  <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f2ff] text-[#176bc2]"><FileText size={19} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{document.title}</strong><small className="mt-1 block text-[10px] text-[#6f8299]">{categoryLabels[document.category]} · {target}</small></span></div>
                  {document.description ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#61758d]">{document.description}</p> : null}
                  <div className="mt-3 flex items-center justify-between border-t border-[#e9eef5] pt-3 text-[9px] font-bold text-[#386b9f]"><span className="flex items-center gap-1.5"><UsersRound size={14} /> {viewed}/{recipients.length} visualizações</span><span>{new Intl.DateTimeFormat("pt-BR").format(new Date(document.published_at))}</span></div>
                </article>
              );
            })}
            {!documents?.length ? <div className="rounded-2xl border border-dashed border-[#dce6f2] p-10 text-center text-xs text-[#6f8299]"><FolderOpen className="mx-auto mb-2" size={24} />Nenhum documento publicado.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
