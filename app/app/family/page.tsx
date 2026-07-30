import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  Megaphone,
  NotebookPen,
  ReceiptText,
  Sparkles,
  Utensils,
} from "lucide-react";
import { getCurrentContext } from "../../lib/auth";
import { markSummaryViewed } from "../actions";

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
      .select("child_id, children(id, first_name, last_name)")
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

  const child = link
    ? Array.isArray(link.children)
      ? link.children[0]
      : link.children
    : null;
  const summary = child
    ? (
        await supabase
          .from("daily_summaries")
          .select("id, school_id, narrative, snapshot, published_at")
          .eq("child_id", child.id)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    : null;
  const viewed = summary
    ? (
        await supabase
          .from("summary_views")
          .select("first_viewed_at")
          .eq("summary_id", summary.id)
          .eq("viewer_id", user.id)
          .maybeSingle()
      ).data
    : null;
  const snapshot =
    summary &&
    typeof summary.snapshot === "object" &&
    summary.snapshot &&
    !Array.isArray(summary.snapshot)
      ? summary.snapshot
      : {};
  const lunch = snapshot["meal:lunch"];
  const lunchLabel =
    typeof lunch === "object" && lunch && !Array.isArray(lunch) && "label" in lunch
      ? String(lunch.label)
      : "Registro não informado";
  const firstName = profile?.full_name?.split(" ")[0] ?? "Família";

  const shortcuts = [
    {
      label: "Financeiro",
      href: "/app/family/documents",
      icon: ReceiptText,
      badge: unreadDocuments ?? 0,
      tone: "bg-[#e7edf4] text-[#4e6b86]",
    },
    {
      label: "Calendário Escolar",
      href: "/app/family/calendar",
      icon: CalendarDays,
      badge: 0,
      tone: "bg-[#e5efe9] text-[#386d56]",
    },
    {
      label: "Mural de Recados",
      href: "/app/family/communications",
      icon: Megaphone,
      badge: unreadCommunications ?? 0,
      tone: "bg-[#f6e8d8] text-[#99603a]",
    },
    {
      label: "Ocorrências",
      href: "/app/family/occurrences",
      icon: ClipboardList,
      badge: pendingOccurrences ?? 0,
      tone: "bg-[#f7e1dc] text-[#a2483c]",
    },
    {
      label: "Alimentação",
      href: "#alimentacao",
      icon: Utensils,
      badge: 0,
      tone: "bg-[#f3ead8] text-[#8a6938]",
    },
    {
      label: "Diário de Bordo",
      href: "#diario-de-bordo",
      icon: NotebookPen,
      badge: summary && !viewed ? 1 : 0,
      tone: "bg-[#e9e5f2] text-[#685987]",
    },
  ];
  const attentionCount =
    (unreadCommunications ?? 0) + (pendingOccurrences ?? 0) + (unreadDocuments ?? 0);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="px-1 pb-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.15em] text-[#708078]">
          BEM-VINDO
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em]">
          Olá, {firstName}!
        </h1>
        <p className="mt-1 text-[11px] text-[#7c8680]">
          O que você quer acompanhar hoje?
        </p>
      </header>

      <nav aria-label="Atalhos da família" className="mt-4 grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.label}
              href={shortcut.href}
              className="relative flex min-h-32 flex-col items-center justify-center gap-3 rounded-3xl border border-[#e0e2dc] bg-white px-3 py-5 text-center shadow-[0_8px_22px_rgba(49,86,69,.06)] transition active:scale-[.98] active:bg-[#f2f4f1]"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${shortcut.tone}`}>
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <strong className="text-[11px] leading-4 text-[#34433b]">{shortcut.label}</strong>
              {shortcut.badge ? (
                <span className="absolute right-3 top-3 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#b85f48] px-1 text-[8px] font-extrabold text-white">
                  {shortcut.badge > 9 ? "9+" : shortcut.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {attentionCount ? (
        <Link
          href={(pendingOccurrences ?? 0) ? "/app/family/occurrences" : "/app/family/communications"}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e5c8b8] bg-[#fff8ef] p-4"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5dfd3] text-[#a2543f]">
            <AlertTriangle size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <small className="text-[8px] font-extrabold tracking-[.12em] text-[#9a623b]">
              REQUER SUA ATENÇÃO
            </small>
            <strong className="mt-1 block text-xs">
              {attentionCount} item{attentionCount > 1 ? "s" : ""} aguardando você
            </strong>
          </span>
          <ChevronRight size={16} className="text-[#a28777]" />
        </Link>
      ) : null}

      <section
        id="alimentacao"
        className="mt-5 scroll-mt-36 rounded-3xl border border-[#e0e2dc] bg-white p-5"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f3ead8] text-[#8a6938]">
            <Utensils size={21} />
          </span>
          <span>
            <small className="text-[8px] font-extrabold tracking-[.12em] text-[#8a6938]">
              ALIMENTAÇÃO DO DIA
            </small>
            <strong className="mt-1 block text-sm">Almoço · {lunchLabel}</strong>
          </span>
        </div>
      </section>

      <section
        id="diario-de-bordo"
        className="mt-4 scroll-mt-36 overflow-hidden rounded-3xl bg-[#315645] text-white"
      >
        {summary && child ? (
          <>
            <div className="p-6">
              <span className="text-[8px] font-extrabold tracking-[.15em] text-[#c4d6cc]">
                DIÁRIO DE BORDO
              </span>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-[-.04em]">
                O dia de {child.first_name}
              </h2>
              <p className="mt-3 text-xs leading-5 text-[#d8e5de]">{summary.narrative}</p>
              <small className="mt-4 block text-[9px] text-[#b8cbc1]">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(new Date(summary.published_at))}
              </small>
            </div>
            <div className="border-t border-white/10 bg-white/5 p-4">
              <form action={markSummaryViewed}>
                <input type="hidden" name="summaryId" value={summary.id} />
                <input type="hidden" name="schoolId" value={summary.school_id} />
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[10px] font-bold text-[#315645]">
                  {viewed ? <CheckCircle2 size={16} /> : <Eye size={16} />}
                  {viewed ? "Visualização confirmada" : "Confirmo que visualizei"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="p-7">
            <NotebookPen size={23} className="text-[#c4d6cc]" />
            <h2 className="mt-3 text-lg font-bold">Diário ainda não publicado</h2>
            <p className="mt-1 text-xs text-[#d8e5de]">
              O resumo aparecerá após a saída da criança.
            </p>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-[#dfe1d9] bg-white p-4">
        <div className="flex items-start gap-3">
          <Sparkles size={17} className="mt-0.5 text-[#42715d]" />
          <p className="text-[10px] leading-4 text-[#69746f]">
            O Diário de Bordo utiliza somente registros feitos pela escola, sem
            inventar interpretações sobre humor ou saúde.
          </p>
        </div>
      </section>
    </div>
  );
}
