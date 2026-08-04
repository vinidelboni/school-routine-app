import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, MapPin, XCircle } from "lucide-react";
import { CalendarView, type CalendarEvent } from "../../../components/calendar-view";
import { getCurrentContext } from "../../../lib/auth";
import { getCalendarRange, parseCalendarMonth, parseCalendarPeriod, toSaoPauloDateKey } from "../../../lib/calendar";
import { respondToSchoolEvent } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

const kindLabels = { event: "Evento", meeting: "Reunião", trip: "Passeio" } as const;

function eventKindLabel(value: string) {
  return kindLabels[value as keyof typeof kindLabels];
}

export default async function FamilyCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; period?: string }>;
}) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { month: requestedMonth, period: requestedPeriod } = await searchParams;
  const { year, month } = parseCalendarMonth(requestedMonth);
  const period = parseCalendarPeriod(requestedPeriod);
  const range = getCalendarRange(year, month, period);
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const periodOptions = [
    { value: "week", label: "Semana" },
    { value: "month", label: "Mês" },
    { value: "year", label: "Ano corrente" },
  ] as const;

  const [{ data: calendarItems }, { data: eventRecipients }] =
    await Promise.all([
      supabase.rpc("get_family_calendar_items", { target_membership_id: membership.id, range_start: range.start, range_end: range.end }),
      supabase.from("school_event_recipients").select("id, viewed_at, response, child_id, children(first_name), school_events!inner(id, kind, title, description, location, starts_at, ends_at, requires_response, response_deadline, status)").eq("membership_id", membership.id).eq("school_events.status", "published").gte("school_events.starts_at", `${range.start}T00:00:00-03:00`).lt("school_events.starts_at", `${range.end}T00:00:00-03:00`).limit(50),
    ]);

  const events: CalendarEvent[] = (calendarItems ?? []).map((item) => ({
    id: item.item_id,
    date: item.item_date,
    title: item.title,
    detail: item.detail ?? undefined,
    kind: item.kind as CalendarEvent["kind"],
    href: item.href,
  }));
  eventRecipients?.forEach((recipient) => {
    const event = Array.isArray(recipient.school_events) ? recipient.school_events[0] : recipient.school_events;
    if (event?.status === "published") events.push({ id: `school-event-${recipient.id}`, date: toSaoPauloDateKey(event.starts_at), title: event.title, detail: `${eventKindLabel(event.kind)}${event.location ? ` · ${event.location}` : ""}`, kind: "schoolEvent" });
  });
  const upcoming = (eventRecipients ?? []).filter((recipient) => {
    const event = Array.isArray(recipient.school_events) ? recipient.school_events[0] : recipient.school_events;
    return event?.status === "published" && new Date(event.starts_at) >= new Date(new Date().setHours(0, 0, 0, 0));
  }).toSorted((a, b) => {
    const eventA = Array.isArray(a.school_events) ? a.school_events[0] : a.school_events;
    const eventB = Array.isArray(b.school_events) ? b.school_events[0] : b.school_events;
    return eventA.starts_at.localeCompare(eventB.starts_at);
  }).slice(0, 5);

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.18em] text-[#6f91c3]">
          CALENDÁRIO
        </span>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#172b4d]">
              Calendário escolar
            </h1>
            <p className="mt-1 text-xs text-[#77869d]">
              Selecione um dia para ver os detalhes.
            </p>
          </div>
          <Link
            href="/app/family/history"
            className="shrink-0 rounded-full bg-[#e7effb] px-3 py-2 text-[9px] font-extrabold text-[#2d62b4]"
          >
            Histórico
          </Link>
        </div>
      </header>
      <nav aria-label="Período carregado" className="mt-5 grid grid-cols-3 rounded-2xl bg-[#e7effb] p-1">
        {periodOptions.map((option) => <Link key={option.value} href={`/app/family/calendar?month=${option.value === "year" ? currentMonthKey : monthKey}&period=${option.value}`} aria-current={period === option.value ? "page" : undefined} className={`rounded-xl px-1 py-2.5 text-center text-[9px] font-extrabold transition ${period === option.value ? "bg-white text-[#1768c5] shadow-sm" : "text-[#68809e]"}`}>{option.label}</Link>)}
      </nav>
      {upcoming.length ? <section className="mt-5"><div className="flex items-center justify-between px-1"><h2 className="text-xs font-extrabold text-[#27364c]">Próximos compromissos</h2><small className="text-[9px] text-[#7b8ba0]">{upcoming.length} na agenda</small></div><div className="mt-2 grid gap-3">{upcoming.map((recipient) => { const event = Array.isArray(recipient.school_events) ? recipient.school_events[0] : recipient.school_events; const child = Array.isArray(recipient.children) ? recipient.children[0] : recipient.children; const responded = recipient.response !== "pending"; const deadlinePassed = Boolean(event.response_deadline && event.response_deadline < new Date().toISOString().slice(0, 10)); return <article key={recipient.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(35,73,128,.06)]"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f1ff] text-[#1768c5]"><CalendarClock size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#27364c]">{event.title}</strong><small className="mt-1 block text-[9px] text-[#7b8ba0]">{eventKindLabel(event.kind)} · {child?.first_name} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(event.starts_at))}</small>{event.location ? <small className="mt-1 flex items-center gap-1 text-[9px] text-[#61758d]"><MapPin size={11} />{event.location}</small> : null}</span></div><p className="mt-3 text-xs leading-5 text-[#61758d]">{event.description}</p>{event.requires_response ? responded ? <p className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-[10px] font-bold ${recipient.response === "attending" ? "bg-[#e9f6ef] text-[#28704e]" : "bg-[#fff0f1] text-[#a34336]"}`}>{recipient.response === "attending" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{recipient.response === "attending" ? "Presença confirmada" : "Ausência informada"}</p> : deadlinePassed ? <p className="mt-3 rounded-xl bg-[#fff4e6] p-3 text-[10px] font-bold text-[#91612f]">Prazo para resposta encerrado.</p> : <div className="mt-3 grid grid-cols-2 gap-2"><form action={respondToSchoolEvent}><input type="hidden" name="recipientId" value={recipient.id} /><input type="hidden" name="response" value="attending" /><SubmitButton idleLabel="Participarei" pendingLabel="Salvando..." className="w-full rounded-xl bg-[#1768c5] px-3 py-3 text-[10px] font-bold text-white" /></form><form action={respondToSchoolEvent}><input type="hidden" name="recipientId" value={recipient.id} /><input type="hidden" name="response" value="not_attending" /><SubmitButton idleLabel="Não participarei" pendingLabel="Salvando..." className="w-full rounded-xl border border-[#d8e2ee] px-3 py-3 text-[10px] font-bold text-[#61758d]" /></form></div> : recipient.viewed_at ? <p className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[#1768c5]"><CheckCircle2 size={14} /> Visto</p> : <form action={respondToSchoolEvent} className="mt-3"><input type="hidden" name="recipientId" value={recipient.id} /><input type="hidden" name="response" value="viewed" /><SubmitButton idleLabel="Marcar como visto" pendingLabel="Registrando..." className="w-full rounded-xl bg-[#1768c5] px-3 py-3 text-[10px] font-bold text-white" /></form>}</article>; })}</div></section> : null}
      <CalendarView year={year} month={month} events={events} basePath="/app/family/calendar" compact period={period} loadedStart={range.start} loadedEnd={range.end} />
    </div>
  );
}
