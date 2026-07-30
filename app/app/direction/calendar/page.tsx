import { redirect } from "next/navigation";
import { CalendarView, type CalendarEvent } from "../../../components/calendar-view";
import { getCurrentContext } from "../../../lib/auth";
import { parseCalendarMonth } from "../../../lib/calendar";

export default async function DirectionCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const { month: requestedMonth } = await searchParams;
  const { year, month } = parseCalendarMonth(requestedMonth);

  const [{ data: schoolDays }, { data: communications }, { data: requests }, { data: occurrences }, { data: medications }] =
    await Promise.all([
      supabase.from("school_days").select("id, day, status, classrooms(name)").order("day", { ascending: false }).limit(200),
      supabase.from("communications").select("id, title, event_date, published_at").order("published_at", { ascending: false }).limit(150),
      supabase.from("family_requests").select("id, request_type, effective_date, children(first_name, last_name)").order("effective_date", { ascending: false }).limit(150),
      supabase.from("occurrences").select("id, title, occurred_at, children(first_name, last_name)").order("occurred_at", { ascending: false }).limit(150),
      supabase.from("medication_requests").select("id, medication_name, starts_on, scheduled_time, children(first_name, last_name)").order("starts_on", { ascending: false }).limit(150),
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

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">CALENDÁRIO DA ESCOLA</span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Histórico e próximos compromissos</h1>
        <p className="mt-2 text-sm text-[#69746f]">Uma visão unificada das turmas, famílias, comunicados e ocorrências.</p>
      </header>
      <CalendarView year={year} month={month} events={events} basePath="/app/direction/calendar" />
    </div>
  );
}
