import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Eye, Sparkles, Utensils } from "lucide-react";
import { getCurrentContext } from "../../lib/auth";
import {
  communicationKindLabels,
  type CommunicationKind,
} from "../../lib/communications";
import { markSummaryViewed } from "../actions";
import { ResponseActions } from "./communications/response-actions";

export default async function FamilyPage() {
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const [{ data: link, error: linkError }, { data: notifications, error: notificationsError }, { data: occurrenceAlerts, error: occurrenceAlertsError }] =
    await Promise.all([
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
        .select(
          "id, viewed_at, response, children(first_name), communications!inner(kind, scope, title, body, published_at)",
        )
        .eq("membership_id", membership.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("occurrence_recipients")
        .select("id, acknowledged_at, occurrences!inner(severity, title, children(first_name))")
        .eq("membership_id", membership.id)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false })
        .limit(2),
    ]);
  if (linkError) throw linkError;
  if (notificationsError) throw notificationsError;
  if (occurrenceAlertsError) throw occurrenceAlertsError;

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
          .select("first_viewed_at, last_viewed_at")
          .eq("summary_id", summary.id)
          .eq("viewer_id", user.id)
          .maybeSingle()
      ).data
    : null;

  const unread = notifications?.filter((notification) => !notification.viewed_at).length ?? 0;
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

  return (
    <div className="mx-auto max-w-2xl">
      {occurrenceAlerts?.length ? (
        <section className="mb-4 rounded-2xl border border-[#d99a8d] bg-[#fff6f3] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-[#a34336]" size={20} />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-extrabold tracking-[.12em] text-[#a34336]">REQUER SUA CIÊNCIA</span>
              {occurrenceAlerts.map((alert) => {
                const occurrence = Array.isArray(alert.occurrences) ? alert.occurrences[0] : alert.occurrences;
                const relatedChild = Array.isArray(occurrence.children) ? occurrence.children[0] : occurrence.children;
                return <strong key={alert.id} className="mt-1 block text-sm">{occurrence.title} · {relatedChild?.first_name}</strong>;
              })}
            </div>
            <Link href="/app/family/occurrences" className="flex shrink-0 items-center gap-1 rounded-xl bg-[#a34336] px-3 py-2 text-[10px] font-bold text-white">
              Ver <ChevronRight size={13} />
            </Link>
          </div>
        </section>
      ) : null}
      <section className="rounded-3xl border border-[#d9ded8] bg-[#fffefa] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.14em] text-[#557164]">
              <Bell size={14} /> COMUNICADOS DA ESCOLA
            </span>
            <h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-[-.04em]">
              {unread ? `${unread} novidade${unread > 1 ? "s" : ""}` : "Tudo acompanhado"}
            </h1>
          </div>
          <Link href="/app/family/communications" className="flex items-center gap-1 rounded-xl bg-[#315645] px-3 py-2 text-[10px] font-bold text-white">
            Ver todos <ChevronRight size={13} />
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {notifications?.map((notification) => {
            const communication = Array.isArray(notification.communications)
              ? notification.communications[0]
              : notification.communications;
            const relatedChild = Array.isArray(notification.children)
              ? notification.children[0]
              : notification.children;
            const kind = communication.kind as CommunicationKind;
            return (
              <article
                key={notification.id}
                className={`rounded-2xl border p-4 ${
                  notification.viewed_at
                    ? "border-[#e5e5df] bg-white"
                    : "border-[#e4c6ac] bg-[#fff8ed]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-extrabold tracking-[.1em] text-[#9a623b]">
                      {communicationKindLabels[kind].toUpperCase()}
                    </span>
                    <strong className="mt-1 block text-sm">{communication.title}</strong>
                    {communication.scope === "child" ? (
                      <small className="mt-1 block text-[#7c8680]">
                        Exclusivo para a família de {relatedChild?.first_name}
                      </small>
                    ) : (
                      <small className="mt-1 block text-[#7c8680]">Comunicado geral da escola</small>
                    )}
                  </div>
                  {!notification.viewed_at ? (
                    <span className="rounded-full bg-[#f4dfc8] px-2.5 py-1 text-[9px] font-bold text-[#80512f]">
                      Novo
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#56635d]">{communication.body}</p>
                {!notification.response ? (
                  <div className="mt-3 border-t border-[#e8ded3] pt-3">
                    <ResponseActions
                      recipientId={notification.id}
                      kind={kind}
                      viewed={Boolean(notification.viewed_at)}
                    />
                  </div>
                ) : (
                  <span className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#315645]">
                    <CheckCircle2 size={14} /> Respondido
                  </span>
                )}
              </article>
            );
          })}
          {!notifications?.length ? (
            <p className="rounded-xl border border-dashed border-[#dfe1d9] p-5 text-center text-xs text-[#7c8680]">
              Nenhum comunicado disponível.
            </p>
          ) : null}
        </div>
      </section>

      {summary && child ? (
        <>
          <header className="mt-5 rounded-3xl bg-[#315645] p-7 text-white">
            <span className="text-[9px] font-extrabold tracking-[.16em] text-[#c4d6cc]">RESUMO PUBLICADO</span>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">O dia de {child.first_name}</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#d8e5de]">{summary.narrative}</p>
            <span className="mt-6 block text-[10px] text-[#b8cbc1]">
              Publicado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(summary.published_at))}
            </span>
          </header>
          <section className="mt-4 rounded-2xl border border-[#dfe1d9] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4e6d8] text-[#986d4e]"><Utensils size={21} /></span>
              <div><strong className="block text-sm">Alimentação</strong><span className="text-[10px] text-[#858d88]">Almoço</span></div>
              <strong className="ml-auto rounded-full bg-[#e6efe9] px-3 py-1.5 text-[10px] text-[#47705d]">{lunchLabel}</strong>
            </div>
          </section>
          <section className="mt-4 rounded-2xl border border-[#dfe1d9] bg-white p-6">
            <div className="flex items-start gap-3">
              <Sparkles size={19} className="mt-0.5 text-[#42715d]" />
              <div><strong className="block text-sm">Como este texto foi criado</strong><p className="mt-2 text-xs leading-5 text-[#69746f]">O resumo utiliza regras previsíveis e somente os registros feitos pela escola. Nenhuma interpretação sobre humor ou saúde foi inventada.</p></div>
            </div>
          </section>
          <form action={markSummaryViewed} className="mt-4">
            <input type="hidden" name="summaryId" value={summary.id} />
            <input type="hidden" name="schoolId" value={summary.school_id} />
            <button className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-bold ${viewed ? "bg-[#e3ede7] text-[#42705a]" : "bg-[#315645] text-white"}`}>
              {viewed ? <CheckCircle2 size={18} /> : <Eye size={18} />}
              {viewed ? "Visualização registrada" : "Registrar que visualizei"}
            </button>
          </form>
          <p className="mt-3 text-center text-[9px] text-[#858d88]">A escola vê apenas que o resumo foi acessado, nunca utiliza isso para avaliar a professora.</p>
        </>
      ) : (
        <section className="mt-5 rounded-2xl border border-[#dfe1d9] bg-white p-8">
          <h2 className="font-[var(--font-display)] text-2xl font-bold">Ainda não há resumo</h2>
          <p className="mt-2 text-sm text-[#69746f]">
            {child ? "A escola ainda não publicou nenhum resumo." : "Nenhuma criança está vinculada a este acesso."}
          </p>
        </section>
      )}
    </div>
  );
}
