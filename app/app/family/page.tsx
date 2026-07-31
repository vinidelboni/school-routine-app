import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
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
      label: "Calendário Escolar",
      href: "/app/family/calendar",
      icon: CalendarDays,
      badge: 0,
    },
    {
      label: "Mural de Recados",
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
      label: "Diário de Bordo",
      href: "/app/family/diary",
      icon: NotebookPen,
      badge: summary && !summaryViewed ? 1 : 0,
    },
  ];
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

      <nav
        aria-label="Atalhos da família"
        className="mt-7 grid grid-cols-3 gap-x-3 gap-y-8 px-1"
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
