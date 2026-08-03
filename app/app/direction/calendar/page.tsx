import { redirect } from "next/navigation";
import { CalendarView, type CalendarEvent } from "../../../components/calendar-view";
import { CalendarClock, CheckCircle2, MapPin, XCircle } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { parseCalendarMonth, toSaoPauloDateKey } from "../../../lib/calendar";
import { cancelSchoolEvent } from "../../actions";
import { SubmitButton } from "../registry/submit-button";
import { EventForm } from "./event-form";

const kindLabels = { event: "Evento", meeting: "Reunião", trip: "Passeio" } as const;

export default async function DirectionCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; success?: string }>;
}) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const { month: requestedMonth, success } = await searchParams;
  const { year, month } = parseCalendarMonth(requestedMonth);

  const [{ data: schoolDays }, { data: communications }, { data: requests }, { data: occurrences }, { data: medications }, { data: schoolEvents }, { data: classrooms }, { data: children }] =
    await Promise.all([
      supabase.from("school_days").select("id, day, status, classrooms(name)").order("day", { ascending: false }).limit(200),
      supabase.from("communications").select("id, title, event_date, published_at").order("published_at", { ascending: false }).limit(150),
      supabase.from("family_requests").select("id, request_type, effective_date, children(first_name, last_name)").order("effective_date", { ascending: false }).limit(150),
      supabase.from("occurrences").select("id, title, occurred_at, children(first_name, last_name)").order("occurred_at", { ascending: false }).limit(150),
      supabase.from("medication_requests").select("id, medication_name, starts_on, scheduled_time, children(first_name, last_name)").order("starts_on", { ascending: false }).limit(150),
      supabase.from("school_events").select("id, kind, title, description, location, starts_at, ends_at, requires_response, response_deadline, status, classrooms(name), children(first_name, last_name), school_event_recipients(id, response, viewed_at)").eq("school_id", membership.school_id).order("starts_at", { ascending: true }).limit(200),
      supabase.from("classrooms").select("id, name").eq("school_id", membership.school_id).eq("active", true).order("name"),
      supabase.from("children").select("id, first_name, last_name").eq("school_id", membership.school_id).eq("active", true).order("first_name"),
    ]);
  const events: CalendarEvent[] = [];
  schoolDays?.forEach((item) => {
    const classroom = Array.isArray(item.classrooms) ? item.classrooms[0] : item.classrooms;
    events.push({ id: `day-${item.id}`, date: item.day, title: classroom?.name ?? "Turma", detail: item.status === "published" ? "Agendas publicadas" : "Rotina em andamento", kind: "routine", href: "/app/direction" });
  });
  communications?.forEach((item) => events.push({ id: `communication-${item.id}`, date: item.event_date ?? item.published_at.slice(0, 10), title: item.title, kind: "communication", href: "/app/direction/communications" }));
  requests?.forEach((item) => {
    const child = Array.isArray(item.children) ? item.children[0] : item.children;
    events.push({ id: `request-${item.id}`, date: item.effective_date, title: `${child?.first_name} ${child?.last_name}`, detail: item.request_type.replaceAll("_", " "), kind: "request", href: "/app/direction/requests" });
  });
  occurrences?.forEach((item) => {
    const child = Array.isArray(item.children) ? item.children[0] : item.children;
    events.push({ id: `occurrence-${item.id}`, date: item.occurred_at.slice(0, 10), title: item.title, detail: `${child?.first_name} ${child?.last_name}`, kind: "occurrence", href: "/app/direction/occurrences" });
  });
  medications?.forEach((item) => {
    const child = Array.isArray(item.children) ? item.children[0] : item.children;
    events.push({ id: `medication-${item.id}`, date: item.starts_on, title: item.medication_name, detail: `${child?.first_name} ${child?.last_name} · ${item.scheduled_time.slice(0, 5)}`, kind: "medication", href: "/app/direction/medications" });
  });
  schoolEvents?.filter((item) => item.status === "published").forEach((item) => events.push({ id: `school-event-${item.id}`, date: toSaoPauloDateKey(item.starts_at), title: item.title, detail: `${kindLabels[item.kind]}${item.location ? ` · ${item.location}` : ""}`, kind: "schoolEvent" }));
  const upcomingEvents = schoolEvents?.filter((item) => item.status === "published" && new Date(item.starts_at) >= new Date(new Date().setHours(0, 0, 0, 0))).slice(0, 8) ?? [];

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">CALENDÁRIO DA ESCOLA</span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Histórico e próximos compromissos</h1>
        <p className="mt-2 text-sm text-[#61758d]">Uma visão unificada das turmas, famílias, comunicados e ocorrências.</p>
      </header>
      {success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd]"><CheckCircle2 size={20} /><strong className="text-sm">Compromisso publicado no calendário!</strong></div> : null}
      <section className="mt-7 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <EventForm classrooms={(classrooms ?? []).map((item) => ({ id: item.id, name: item.name }))} childOptions={(children ?? []).map((item) => ({ id: item.id, name: `${item.first_name} ${item.last_name}` }))} />
        <div className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]"><span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">PRÓXIMOS</span><h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Agenda oficial</h2><div className="mt-5 grid gap-3">{upcomingEvents.map((item) => { const recipients = item.school_event_recipients ?? []; const answered = recipients.filter((recipient) => recipient.response !== "pending").length; return <article key={item.id} className="rounded-2xl border border-[#e3eaf2] p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f2ff] text-[#176bc2]"><CalendarClock size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong><small className="mt-1 flex flex-wrap items-center gap-1 text-[9px] text-[#61758d]">{kindLabels[item.kind]} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.starts_at))}{item.location ? <><MapPin size={11} />{item.location}</> : null}</small></span></div>{item.requires_response ? <p className="mt-3 rounded-xl bg-[#f3f8fe] p-2.5 text-[9px] font-bold text-[#386b9f]">{answered}/{recipients.length} respostas · prazo {item.response_deadline}</p> : <p className="mt-3 text-[9px] text-[#6f8299]">{recipients.filter((recipient) => recipient.viewed_at).length}/{recipients.length} visualizações</p>}<form action={cancelSchoolEvent} className="mt-3"><input type="hidden" name="eventId" value={item.id} /><SubmitButton idleLabel={<><XCircle size={13} /> Cancelar compromisso</>} pendingLabel="Cancelando..." className="flex items-center gap-1.5 text-[9px] font-bold text-[#a34336]" /></form></article>; })}{!upcomingEvents.length ? <p className="rounded-2xl border border-dashed border-[#dce6f2] p-8 text-center text-xs text-[#6f8299]">Nenhum compromisso futuro.</p> : null}</div></div>
      </section>
      <CalendarView year={year} month={month} events={events} basePath="/app/direction/calendar" />
    </div>
  );
}
