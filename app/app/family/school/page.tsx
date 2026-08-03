import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
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
    countKey: "communications",
  },
  {
    href: "/app/family/occurrences",
    label: "Ocorrências",
    description: "Informações oficiais da direção",
    icon: AlertTriangle,
    countKey: "occurrences",
  },
  {
    href: "/app/family/requests",
    label: "Avisos à escola",
    description: "Falta, atraso, retirada e período",
    icon: MessageSquareText,
    countKey: null,
  },
  {
    href: "/app/family/medications",
    label: "Medicamentos",
    description: "Solicitações estruturadas e retornos",
    icon: Pill,
    countKey: "medications",
  },
  {
    href: "/app/family/documents",
    label: "Financeiro",
    description: "Boletos disponibilizados pela escola",
    icon: FileText,
    countKey: "documents",
  },
  {
    href: "/app/family/library",
    label: "Biblioteca",
    description: "Circulares, normas e materiais da escola",
    icon: LibraryBig,
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
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b78d4] via-[#0759bd] to-[#063b8f] p-5 text-white shadow-[0_16px_34px_rgba(7,89,189,.2)]">
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[26px] border-white/[.07]"
        />
        <span className="relative text-[9px] font-extrabold tracking-[.16em] text-[#bdddff]">
          ESCOLA
        </span>
        <h1 className="relative mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em]">
          Central da família
        </h1>
        <p className="relative mt-2 text-xs leading-5 text-[#d9ebff]">
          {pending
            ? `Você tem ${pending} item${pending > 1 ? "s" : ""} que precisa${pending > 1 ? "m" : ""} de atenção.`
            : "Tudo acompanhado por aqui."}
        </p>
      </header>

      <nav
        aria-label="Serviços da escola"
        className="mt-7 grid grid-cols-3 gap-x-3 gap-y-8 px-1"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const count = item.countKey ? counts[item.countKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.description}
              className="group flex min-w-0 flex-col items-center gap-3 rounded-2xl text-center outline-none transition hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#2d83e6]/20 active:scale-[.97]"
            >
              <span className="relative grid h-[4.85rem] w-[4.85rem] place-items-center rounded-full border border-white/50 bg-gradient-to-b from-[#14abe4] via-[#086dcc] to-[#092a9c] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_12px_24px_rgba(17,70,157,.2)] transition duration-300 group-hover:scale-105 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_16px_28px_rgba(17,70,157,.27)]">
                <span
                  aria-hidden="true"
                  className="absolute inset-[5px] rounded-full border border-white/10"
                />
                <Icon className="relative" size={33} strokeWidth={1.75} />
                {count ? (
                  <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#f7f8fa] bg-[#ff4d63] px-1 text-[8px] font-extrabold text-white shadow-sm">
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </span>
              <strong className="max-w-[7rem] text-[11px] leading-4 text-[#27364c]">
                {item.label}
              </strong>
              <span className="sr-only">{item.description}</span>
            </Link>
          );
        })}
      </nav>

      <p className="mt-8 rounded-2xl bg-[#eef5fd] px-4 py-3 text-center text-[9px] leading-4 text-[#61758d]">
        A comunicação acontece por fluxos estruturados. Nenhum canal cria conversa
        direta ou atendimento permanente com a professora.
      </p>
    </div>
  );
}
