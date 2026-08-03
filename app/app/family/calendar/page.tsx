import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, MapPin, XCircle } from "lucide-react";
import { CalendarView, type CalendarEvent } from "../../../components/calendar-view";
import { getCurrentContext } from "../../../lib/auth";
import { parseCalendarMonth, toSaoPauloDateKey } from "../../../lib/calendar";
import { respondToSchoolEvent } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

const kindLabels = { event: "Evento", meeting: "Reunião", trip: "Passeio" } as const;

function eventKindLabel(value: string) {
  return kindLabels[value as keyof typeof kindLabels];
}

export default async function FamilyCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { month: requestedMonth } = await searchParams;
  const { year, month } = parseCalendarMonth(requestedMonth);

  const [{ data: summaries }, { data: communications }, { data: requests }, { data: occurrences }, { data: medications }, { data: eventRecipients }] =
    await Promise.all([
      supabase.from("daily_summaries").select("id, narrative, school_days(day), children(first_name)").order("published_at", { ascending: false }).limit(100),
      supabase.from("communication_recipients").select("id, communications!inner(title, event_date, published_at)").eq("membership_id", membership.id).limit(100),
      supabase.from("family_requests").select("id, request_type, effective_date, children(first_name)").order("effective_date", { ascending: false }).limit(100),
      supabase.from("occurrence_recipients").select("id, occurrences!inner(title, occurred_at)").eq("membership_id", membership.id).limit(100),
      supabase.from("medication_requests").select("id, medication_name, starts_on, scheduled_time, children(first_name)").limit(100),
      supabase.from("school_event_recipients").select("id, viewed_at, response, child_id, children(first_name), school_events!inner(id, kind, title, description, location, starts_at, ends_at, requires_response, response_deadline, status)").eq("membership_id", membership.id).limit(150),
    ]);

  const events: CalendarEvent[] = [];
  summaries?.forEach((item) => {
    const schoolDay = Array.isArray(item.school_days) ? item.school_days[0] : item.school_days;
    const child = Array.isArray(item.children) ? item.children[0] : item.children;
    if (schoolDay?.day) events.push({ id: `summary-${item.id}`, date: schoolDay.day, title: `Agenda de ${child?.first_name}`, detail: item.narrative, kind: "routine", href: "/app/family/history" });
  });
  communications?.forEach((item) => {
    const communication = Array.isArray(item.communications) ? item.communications[0] : item.communications;
    events.push({ id: `communication-${item.id}`, date: communication.event_date ?? communication.published_at.slice(0, 10), title: communication.title, kind: "communication", href: "/app/family/communications" });
  });
  requests?.forEach((item) => {
    const child = Array.isArray(item.children) ? item.children[0] : item.children;
    events.push({ id: `request-${item.id}`, date: item.effective_date, title: `Aviso sobre ${child?.first_name}`, detail: item.request_type.replaceAll("_", " "), kind: "request", href: "/app/family/requests" });
  });
  occurrences?.forEach((item) => {
    const occurrence = Array.isArray(item.occurrences) ? item.occurrences[0] : item.occurrences;
    events.push({ id: `occurrence-${item.id}`, date: occurrence.occurred_at.slice(0, 10), title: occurrence.title, kind: "occurrence", href: "/app/family/occurrences" });
  });
  medications?.forEach((item) => {
    const child = Array.isArray(item.children) ? item.children[0] : item.children;
    events.push({ id: `medication-${item.id}`, date: item.starts_on, title: item.medication_name, detail: `${child?.first_name} · ${item.scheduled_time.slice(0, 5)}`, kind: "medication", href: "/app/family/medications" });
  });
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
      {upcoming.length ? <section className="mt-5"><div className="flex items-center justify-between px-1"><h2 className="text-xs font-extrabold text-[#27364c]">Próximos compromissos</h2><small className="text-[9px] text-[#7b8ba0]">{upcoming.length} na agenda</small></div><div className="mt-2 grid gap-3">{upcoming.map((recipient) => { const event = Array.isArray(recipient.school_events) ? recipient.school_events[0] : recipient.school_events; const child = Array.isArray(recipient.children) ? recipient.children[0] : recipient.children; const responded = recipient.response !== "pending"; const deadlinePassed = Boolean(event.response_deadline && event.response_deadline < new Date().toISOString().slice(0, 10)); return <article key={recipient.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(35,73,128,.06)]"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f1ff] text-[#1768c5]"><CalendarClock size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#27364c]">{event.title}</strong><small className="mt-1 block text-[9px] text-[#7b8ba0]">{eventKindLabel(event.kind)} · {child?.first_name} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(event.starts_at))}</small>{event.location ? <small className="mt-1 flex items-center gap-1 text-[9px] text-[#61758d]"><MapPin size={11} />{event.location}</small> : null}</span></div><p className="mt-3 text-xs leading-5 text-[#61758d]">{event.description}</p>{event.requires_response ? responded ? <p className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-[10px] font-bold ${recipient.response === "attending" ? "bg-[#e9f6ef] text-[#28704e]" : "bg-[#fff0f1] text-[#a34336]"}`}>{recipient.response === "attending" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{recipient.response === "attending" ? "Presença confirmada" : "Ausência informada"}</p> : deadlinePassed ? <p className="mt-3 rounded-xl bg-[#fff4e6] p-3 text-[10px] font-bold text-[#91612f]">Prazo para resposta encerrado.</p> : <div className="mt-3 grid grid-cols-2 gap-2"><form action={respondToSchoolEvent}><input type="hidden" name="recipientId" value={recipient.id} /><input type="hidden" name="response" value="attending" /><SubmitButton idleLabel="Participarei" pendingLabel="Salvando..." className="w-full rounded-xl bg-[#1768c5] px-3 py-3 text-[10px] font-bold text-white" /></form><form action={respondToSchoolEvent}><input type="hidden" name="recipientId" value={recipient.id} /><input type="hidden" name="response" value="not_attending" /><SubmitButton idleLabel="Não participarei" pendingLabel="Salvando..." className="w-full rounded-xl border border-[#d8e2ee] px-3 py-3 text-[10px] font-bold text-[#61758d]" /></form></div> : recipient.viewed_at ? <p className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[#1768c5]"><CheckCircle2 size={14} /> Visto</p> : <form action={respondToSchoolEvent} className="mt-3"><input type="hidden" name="recipientId" value={recipient.id} /><input type="hidden" name="response" value="viewed" /><SubmitButton idleLabel="Marcar como visto" pendingLabel="Registrando..." className="w-full rounded-xl bg-[#1768c5] px-3 py-3 text-[10px] font-bold text-white" /></form>}</article>; })}</div></section> : null}
      <CalendarView year={year} month={month} events={events} basePath="/app/family/calendar" compact />
    </div>
  );
}
