import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ChevronRight, ClipboardList, LibraryBig, Megaphone, ReceiptText } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

export default async function FamilyNotificationsPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const [
    { count: communications },
    { count: occurrences },
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

  const items = [
    {
      label: "Mural de Recados",
      description: "Comunicados novos da escola",
      href: "/app/family/communications",
      count: communications ?? 0,
      icon: Megaphone,
    },
    {
      label: "Ocorrências",
      description: "Registros aguardando sua ciência",
      href: "/app/family/occurrences",
      count: occurrences ?? 0,
      icon: ClipboardList,
    },
    {
      label: "Financeiro",
      description: "Boletos ainda não visualizados",
      href: "/app/family/documents",
      count: documents ?? 0,
      icon: ReceiptText,
    },
    {
      label: "Biblioteca",
      description: "Novos documentos da escola",
      href: "/app/family/library",
      count: library ?? 0,
      icon: LibraryBig,
    },
  ];
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#2a7bd0]">
          CENTRAL
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">
          Notificações
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#6e89a8]">
          {total
            ? `${total} ${total === 1 ? "item precisa" : "itens precisam"} da sua atenção.`
            : "Você está em dia com a escola."}
        </p>
      </header>

      <section className="mt-6 grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-3xl border border-[#dce9f8] bg-white p-4 shadow-[0_9px_26px_rgba(18,91,170,.07)] transition active:scale-[.99]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e5f1ff] text-[#0867cc]">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-[#15395f]">{item.label}</strong>
                <small className="mt-1 block text-[10px] text-[#7b91a8]">
                  {item.count ? `${item.count} pendente${item.count > 1 ? "s" : ""}` : item.description}
                </small>
              </span>
              {item.count ? (
                <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-[#ff4d63] px-1.5 text-[9px] font-extrabold text-white">
                  {item.count > 9 ? "9+" : item.count}
                </span>
              ) : (
                <ChevronRight size={16} className="text-[#99aec3]" />
              )}
            </Link>
          );
        })}
        {!total ? (
          <div className="rounded-3xl border border-dashed border-[#cbdff4] bg-white px-6 py-10 text-center">
            <Bell className="mx-auto text-[#6ba4dd]" size={28} />
            <strong className="mt-3 block text-sm text-[#15395f]">Tudo acompanhado</strong>
            <p className="mt-1 text-[11px] text-[#7890aa]">
              Novos recados, ocorrências, documentos e boletos aparecerão aqui.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
