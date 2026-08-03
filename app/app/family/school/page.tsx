import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  LibraryBig,
  Megaphone,
  MessageSquareText,
  Pill,
} from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

const items = [
  {
    href: "/app/family/communications",
    label: "Comunicados",
    description: "Recados, eventos e autorizações",
    icon: Megaphone,
    tone: "bg-[#f4e6d8] text-[#986d4e]",
    countKey: "communications",
  },
  {
    href: "/app/family/occurrences",
    label: "Ocorrências",
    description: "Informações oficiais da direção",
    icon: AlertTriangle,
    tone: "bg-[#f8e2dc] text-[#a34336]",
    countKey: "occurrences",
  },
  {
    href: "/app/family/requests",
    label: "Avisos à escola",
    description: "Falta, atraso, retirada e período",
    icon: MessageSquareText,
    tone: "bg-[#e3ece8] text-[#3e705a]",
    countKey: null,
  },
  {
    href: "/app/family/medications",
    label: "Medicamentos",
    description: "Solicitações estruturadas e retornos",
    icon: Pill,
    tone: "bg-[#ebe6f3] text-[#685885]",
    countKey: "medications",
  },
  {
    href: "/app/family/documents",
    label: "Financeiro",
    description: "Boletos disponibilizados pela escola",
    icon: FileText,
    tone: "bg-[#e7edf4] text-[#4f6680]",
    countKey: "documents",
  },
  {
    href: "/app/family/library",
    label: "Biblioteca",
    description: "Circulares, normas e materiais da escola",
    icon: LibraryBig,
    tone: "bg-[#e5f1ff] text-[#1768c5]",
    countKey: "library",
  },
] as const;

export default async function FamilySchoolPage() {
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const [
    { count: communications },
    { count: occurrences },
    { count: medications },
    { count: documents },
    { count: library },
  ] = await Promise.all([
    supabase
      .from("communication_recipients")
      .select("*", { count: "exact", head: true })
      .eq("membership_id", membership.id)
      .is("viewed_at", null),
    supabase
      .from("occurrence_recipients")
      .select("*", { count: "exact", head: true })
      .eq("membership_id", membership.id)
      .is("acknowledged_at", null),
    supabase
      .from("medication_requests")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)
      .in("status", ["submitted", "accepted"]),
    supabase
      .from("billing_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "distributed")
      .is("viewed_at", null),
    supabase
      .from("school_document_recipients")
      .select("*", { count: "exact", head: true })
      .eq("membership_id", membership.id)
      .is("viewed_at", null),
  ]);
  const counts = {
    communications: communications ?? 0,
    occurrences: occurrences ?? 0,
    medications: medications ?? 0,
    documents: documents ?? 0,
    library: library ?? 0,
  };
  const pending = Object.values(counts).reduce((total, count) => total + count, 0);

  return (
    <div>
      <header className="rounded-3xl bg-[#315645] p-5 text-white">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#c6d8ce]">
          ESCOLA
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em]">
          Central da família
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#d6e3dc]">
          {pending
            ? `Você tem ${pending} item${pending > 1 ? "s" : ""} que precisa${pending > 1 ? "m" : ""} de atenção.`
            : "Tudo acompanhado por aqui."}
        </p>
      </header>

      <section className="mt-4 overflow-hidden rounded-3xl border border-[#e0e2dc] bg-white">
        {items.map((item, index) => {
          const Icon = item.icon;
          const count = item.countKey ? counts[item.countKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-4 transition active:bg-[#f2f3ef] ${
                index ? "border-t border-[#ecece7]" : ""
              }`}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{item.label}</strong>
                <small className="mt-0.5 block truncate text-[10px] text-[#7c8680]">
                  {item.description}
                </small>
              </span>
              {count ? (
                <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-[#b85f48] px-1.5 text-[9px] font-extrabold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
              <ChevronRight size={17} className="shrink-0 text-[#a3aaa6]" />
            </Link>
          );
        })}
      </section>

      <p className="mt-4 px-3 text-center text-[9px] leading-4 text-[#8a928d]">
        A comunicação acontece por fluxos estruturados. Nenhum canal cria conversa
        direta ou atendimento permanente com a professora.
      </p>
    </div>
  );
}
