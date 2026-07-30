import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, ChevronRight, Clock3 } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

export default async function FamilyHistoryPage() {
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: links, error: linksError } = await supabase
    .from("guardian_links")
    .select("child_id, children(first_name, last_name)")
    .eq("membership_id", membership.id)
    .eq("active", true)
    .eq("can_view_routine", true);
  if (linksError) throw linksError;

  const childIds = links?.map((link) => link.child_id) ?? [];
  const { data: summaries, error: summariesError } = childIds.length
    ? await supabase
        .from("daily_summaries")
        .select("id, narrative, published_at, child_id, children(first_name)")
        .in("child_id", childIds)
        .order("published_at", { ascending: false })
        .limit(30)
    : { data: [], error: null };
  if (summariesError) throw summariesError;

  const summaryIds = summaries?.map((summary) => summary.id) ?? [];
  const { data: views, error: viewsError } = summaryIds.length
    ? await supabase
        .from("summary_views")
        .select("summary_id")
        .eq("viewer_id", user.id)
        .in("summary_id", summaryIds)
    : { data: [], error: null };
  if (viewsError) throw viewsError;
  const viewedIds = new Set(views?.map((view) => view.summary_id));

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#557164]">
          AGENDA
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em]">
          Histórico da rotina
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#69746f]">
          Os resumos publicados pela escola ficam organizados por dia.
        </p>
        <div className="mt-4 flex rounded-xl bg-[#e9ece7] p-1 text-[10px] font-bold">
          <Link href="/app/family/calendar" className="flex-1 px-3 py-2 text-center text-[#77827c]">
            Calendário
          </Link>
          <span className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-[#315645] shadow-sm">
            Histórico
          </span>
        </div>
      </header>

      <section className="relative mt-6 grid gap-3">
        {summaries?.map((summary) => {
          const child = Array.isArray(summary.children)
            ? summary.children[0]
            : summary.children;
          const date = new Date(summary.published_at);
          return (
            <Link
              key={summary.id}
              href="/app/family/diary"
              className="group flex gap-3 rounded-2xl border border-[#e1e2dc] bg-white p-4 shadow-[0_5px_18px_rgba(49,86,69,.05)] transition active:scale-[.99]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e5efe9] text-center text-[#315645]">
                <strong className="block text-base leading-4">{date.getDate()}</strong>
                <small className="block text-[8px] font-extrabold uppercase">
                  {new Intl.DateTimeFormat("pt-BR", { month: "short" })
                    .format(date)
                    .replace(".", "")}
                </small>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <strong className="text-sm">O dia de {child?.first_name}</strong>
                  {viewedIds.has(summary.id) ? (
                    <CheckCircle2 size={15} className="shrink-0 text-[#4e8069]" />
                  ) : (
                    <span className="rounded-full bg-[#f4dfc8] px-2 py-1 text-[8px] font-bold text-[#80512f]">
                      Novo
                    </span>
                  )}
                </span>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#69746f]">
                  {summary.narrative}
                </p>
                <small className="mt-2 flex items-center gap-1 text-[9px] text-[#909792]">
                  <Clock3 size={11} />
                  {new Intl.DateTimeFormat("pt-BR", {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(date)}
                </small>
              </span>
              <ChevronRight
                size={16}
                className="self-center text-[#a4aaa6] transition group-hover:translate-x-0.5"
              />
            </Link>
          );
        })}
        {!summaries?.length ? (
          <div className="rounded-3xl border border-dashed border-[#d7dcd7] bg-white px-6 py-12 text-center">
            <BookOpen className="mx-auto text-[#89a194]" size={28} />
            <strong className="mt-3 block text-sm">Nenhuma agenda publicada</strong>
            <p className="mt-1 text-[11px] leading-5 text-[#7c8680]">
              Assim que a escola concluir a rotina, o resumo aparecerá aqui.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
