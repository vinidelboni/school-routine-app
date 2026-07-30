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

const blueTones = [
  "from-[#e8f2ff] to-[#d9eaff] text-[#1265c8]",
  "from-[#edf6ff] to-[#e1efff] text-[#2178d7]",
  "from-[#e6f1ff] to-[#d7e9ff] text-[#0f69cc]",
  "from-[#edf5ff] to-[#dcecff] text-[#2674c8]",
  "from-[#e7f3ff] to-[#d9edff] text-[#1474cf]",
  "from-[#eef6ff] to-[#dfedff] text-[#235fbb]",
];

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
        <span className="text-[9px] font-extrabold tracking-[.18em] text-[#7aa8da]">
          BEM-VINDO
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">
          Olá, {firstName}!
        </h1>
        <p className="mt-1 text-xs text-[#6e89a8]">
          O que você quer acompanhar hoje?
        </p>
      </header>

      <nav aria-label="Atalhos da família" className="mt-5 grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut, index) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.label}
              href={shortcut.href}
              className="group relative flex min-h-36 flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.65rem] border border-[#dce9f8] bg-white px-3 py-5 text-center shadow-[0_12px_30px_rgba(18,91,170,.09)] transition hover:-translate-y-0.5 hover:border-[#bad7f6] hover:shadow-[0_16px_35px_rgba(18,91,170,.14)] active:scale-[.98]"
            >
              <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#9fc9f4] to-transparent opacity-70" />
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${blueTones[index]} shadow-[inset_0_1px_0_rgba(255,255,255,.9)] transition group-hover:scale-105`}
              >
                <Icon size={27} strokeWidth={1.8} />
              </span>
              <strong className="text-[11px] leading-4 text-[#15395f]">
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
