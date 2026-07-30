import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, Eye, NotebookPen, Sparkles } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { markSummaryViewed } from "../../actions";

export default async function FamilyDiaryPage() {
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: links, error: linksError } = await supabase
    .from("guardian_links")
    .select("child_id")
    .eq("membership_id", membership.id)
    .eq("active", true)
    .eq("can_view_routine", true);
  if (linksError) throw linksError;
  const childIds = links?.map((link) => link.child_id) ?? [];

  const { data: summaries, error: summariesError } = childIds.length
    ? await supabase
        .from("daily_summaries")
        .select(
          "id, school_id, narrative, published_at, children(first_name), summary_views(first_viewed_at, viewer_id)",
        )
        .in("child_id", childIds)
        .order("published_at", { ascending: false })
        .limit(30)
    : { data: [], error: null };
  if (summariesError) throw summariesError;
  const [latest, ...history] = summaries ?? [];
  const latestChild = latest
    ? Array.isArray(latest.children)
      ? latest.children[0]
      : latest.children
    : null;
  const viewed = latest?.summary_views?.some((view) => view.viewer_id === user.id);

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#2a7bd0]">
          DIÁRIO DE BORDO
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">
          Como foi o dia
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#6e89a8]">
          Resumos publicados pela escola após a saída.
        </p>
      </header>

      {latest ? (
        <section className="mt-6 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#086bd5] via-[#0759bd] to-[#063e91] text-white shadow-[0_18px_42px_rgba(7,77,164,.28)]">
          <div className="p-6">
            <span className="text-[8px] font-extrabold tracking-[.15em] text-[#b9dcff]">
              MAIS RECENTE
            </span>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-[-.04em]">
              O dia de {latestChild?.first_name}
            </h2>
            <p className="mt-3 text-xs leading-5 text-[#e0efff]">{latest.narrative}</p>
            <small className="mt-4 flex items-center gap-1.5 text-[9px] text-[#b9d8f8]">
              <Clock3 size={12} />
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(latest.published_at))}
            </small>
          </div>
          <div className="border-t border-white/10 bg-white/5 p-4">
            <form action={markSummaryViewed}>
              <input type="hidden" name="summaryId" value={latest.id} />
              <input type="hidden" name="schoolId" value={latest.school_id} />
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[10px] font-bold text-[#0759bd] shadow-sm">
                {viewed ? <CheckCircle2 size={16} /> : <Eye size={16} />}
                {viewed ? "Visualização confirmada" : "Confirmo que visualizei"}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-[#cbdff4] bg-white px-6 py-12 text-center">
          <NotebookPen className="mx-auto text-[#6ba4dd]" size={30} />
          <strong className="mt-3 block text-sm text-[#15395f]">Diário ainda não publicado</strong>
        </div>
      )}

      {history.length ? (
        <section className="mt-7">
          <h2 className="text-xs font-extrabold tracking-[.12em] text-[#51789f]">
            DIAS ANTERIORES
          </h2>
          <div className="mt-3 grid gap-3">
            {history.map((summary) => {
              const child = Array.isArray(summary.children)
                ? summary.children[0]
                : summary.children;
              const date = new Date(summary.published_at);
              return (
                <article
                  key={summary.id}
                  className="flex gap-3 rounded-2xl border border-[#dce9f8] bg-white p-4 shadow-[0_7px_22px_rgba(18,91,170,.06)]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7f2ff] text-center text-[#0864ca]">
                    <strong className="block text-sm leading-3">{date.getDate()}</strong>
                    <small className="block text-[7px] font-extrabold uppercase">
                      {new Intl.DateTimeFormat("pt-BR", { month: "short" })
                        .format(date)
                        .replace(".", "")}
                    </small>
                  </span>
                  <span className="min-w-0">
                    <strong className="text-xs text-[#15395f]">O dia de {child?.first_name}</strong>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#71879e]">
                      {summary.narrative}
                    </p>
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#d9e9fa] bg-[#eef6ff] p-4">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-[#1874d1]" />
        <p className="text-[10px] leading-4 text-[#587694]">
          Os textos utilizam somente os registros feitos pela escola, sem inventar
          interpretações sobre humor ou saúde.
        </p>
      </div>
    </div>
  );
}
