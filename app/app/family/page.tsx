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

      <nav aria-label="Atalhos da família" className="mt-5 grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.label}
              href={shortcut.href}
              className="group relative flex min-h-36 flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.65rem] border border-[#e5e9ef] bg-white px-3 py-5 text-center shadow-[0_10px_26px_rgba(35,73,128,.07)] transition hover:-translate-y-0.5 hover:border-[#cad6e7] hover:shadow-[0_15px_32px_rgba(35,73,128,.12)] active:scale-[.98]"
            >
              <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-gradient-to-b from-[#f7f8fa] to-[#eceff3] text-[#2d62b4] shadow-[inset_0_1px_0_white,0_5px_14px_rgba(42,91,167,.08)] ring-1 ring-[#e6e9ee] transition group-hover:scale-105">
                <Icon size={31} strokeWidth={1.85} />
              </span>
              <strong className="text-[11px] leading-4 text-[#27364c]">
                {shortcut.label}
              </strong>
              {shortcut.badge ? (
                <span className="absolute right-3 top-3 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#ff4d63] px-1 text-[8px] font-extrabold text-white shadow-sm">
                  {shortcut.badge > 9 ? "9+" : shortcut.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
