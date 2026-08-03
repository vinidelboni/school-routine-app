import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Megaphone,
  NotebookPen,
  ReceiptText,
  Utensils,
} from "lucide-react";
import { getCurrentContext } from "../../lib/auth";

export default async function FamilyPage() {
  const { supabase, user, membership, profile } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const [
    { data: link, error: linkError },
    { count: unreadCommunications },
    { count: pendingOccurrences },
    { count: unreadDocuments },
    { count: unreadEvents },
  ] = await Promise.all([
    supabase
      .from("guardian_links")
      .select("child_id")
      .eq("membership_id", membership.id)
      .eq("active", true)
      .eq("can_view_routine", true)
      .limit(1)
      .maybeSingle(),
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
      .from("school_event_recipients")
      .select("*, school_events!inner(status)", { count: "exact", head: true })
      .eq("membership_id", membership.id)
      .eq("school_events.status", "published")
      .is("viewed_at", null),
  ]);
  if (linkError) throw linkError;

  const summary = link
    ? (
        await supabase
          .from("daily_summaries")
          .select("id")
          .eq("child_id", link.child_id)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    : null;
  const summaryViewed = summary
    ? (
        await supabase
          .from("summary_views")
          .select("summary_id")
          .eq("summary_id", summary.id)
          .eq("viewer_id", user.id)
          .maybeSingle()
      ).data
    : null;

  const shortcuts = [
    {
      label: "Financeiro",
      href: "/app/family/documents",
      icon: ReceiptText,
      badge: unreadDocuments ?? 0,
    },
    {
      label: "Calendário",
      href: "/app/family/calendar",
      icon: CalendarDays,
      badge: unreadEvents ?? 0,
    },
    {
      label: "Recados",
      href: "/app/family/communications",
      icon: Megaphone,
      badge: unreadCommunications ?? 0,
    },
    {
      label: "Ocorrências",
      href: "/app/family/occurrences",
      icon: ClipboardList,
      badge: pendingOccurrences ?? 0,
    },
    {
      label: "Alimentação",
      href: "/app/family/food",
      icon: Utensils,
      badge: 0,
    },
    {
      label: "Diário",
      href: "/app/family/diary",
      icon: NotebookPen,
      badge: summary && !summaryViewed ? 1 : 0,
    },
  ];
  const attentionItems = [
    pendingOccurrences
      ? {
          label: `${pendingOccurrences} ocorrência${pendingOccurrences > 1 ? "s" : ""} para confirmar`,
          href: "/app/family/occurrences",
          icon: ClipboardList,
          urgent: true,
        }
      : null,
    unreadCommunications
      ? {
          label: `${unreadCommunications} recado${unreadCommunications > 1 ? "s" : ""} novo${unreadCommunications > 1 ? "s" : ""}`,
          href: "/app/family/communications",
          icon: Megaphone,
          urgent: false,
        }
      : null,
    unreadDocuments
      ? {
          label: `${unreadDocuments} boleto${unreadDocuments > 1 ? "s" : ""} disponível${unreadDocuments > 1 ? "is" : ""}`,
          href: "/app/family/documents",
          icon: ReceiptText,
          urgent: false,
        }
      : null,
    unreadEvents
      ? {
          label: `${unreadEvents} compromisso${unreadEvents > 1 ? "s" : ""} novo${unreadEvents > 1 ? "s" : ""}`,
          href: "/app/family/calendar",
          icon: CalendarDays,
          urgent: false,
        }
      : null,
    summary && !summaryViewed
      ? {
          label: "O diário de hoje está disponível",
          href: "/app/family/diary",
          icon: NotebookPen,
          urgent: false,
        }
      : null,
  ].filter((item) => item !== null);
  const firstName = profile?.full_name?.split(" ")[0] ?? "Família";

  return (
    <div className="mx-auto max-w-2xl">
      <header className="px-1 pb-2 pt-2">
        <span className="text-[9px] font-extrabold tracking-[.18em] text-[#6f91c3]">
          BEM-VINDO
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#172b4d]">
          Olá, {firstName}!
        </h1>
        <p className="mt-1 text-xs text-[#77869d]">
          O que você quer acompanhar hoje?
        </p>
      </header>

      {attentionItems.length ? (
        <section className="mt-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-[#27364c]">Para você</h2>
            <small className="text-[9px] font-bold text-[#7b8ba2]">
              {attentionItems.length} pendência{attentionItems.length > 1 ? "s" : ""}
            </small>
          </div>
          <div className="mt-2 divide-y divide-[#e5eaf1] overflow-hidden rounded-2xl bg-white px-3 shadow-[0_8px_24px_rgba(35,73,128,.06)]">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-14 items-center gap-3 py-3 active:bg-[#f4f7fb]"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      item.urgent
                        ? "bg-[#fff0f1] text-[#d94b5c]"
                        : "bg-[#e8f1ff] text-[#2d69be]"
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <strong className="min-w-0 flex-1 text-[11px] text-[#27364c]">
                    {item.label}
                  </strong>
                  <ChevronRight size={15} className="text-[#9aa7b8]" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <nav
        aria-label="Atalhos da família"
        className={`${attentionItems.length ? "mt-7" : "mt-8"} grid grid-cols-3 gap-x-3 gap-y-8 px-1`}
      >
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.label}
              href={shortcut.href}
              className="group flex min-w-0 flex-col items-center gap-3 rounded-2xl text-center outline-none transition hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#2d83e6]/20 active:scale-[.97]"
            >
              <span className="relative grid h-[4.85rem] w-[4.85rem] place-items-center rounded-full border border-white/50 bg-gradient-to-b from-[#14abe4] via-[#086dcc] to-[#092a9c] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_12px_24px_rgba(17,70,157,.2)] transition duration-300 group-hover:scale-105 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_16px_28px_rgba(17,70,157,.27)]">
                <span
                  aria-hidden="true"
                  className="absolute inset-[5px] rounded-full border border-white/10"
                />
                <Icon className="relative" size={33} strokeWidth={1.75} />
                {shortcut.badge ? (
                  <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#f7f8fa] bg-[#ff4d63] px-1 text-[8px] font-extrabold text-white shadow-sm">
                    {shortcut.badge > 9 ? "9+" : shortcut.badge}
                  </span>
                ) : null}
              </span>
              <strong className="max-w-[7rem] text-[11px] leading-4 text-[#27364c]">
                {shortcut.label}
              </strong>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
