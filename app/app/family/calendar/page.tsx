import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarView, parseCalendarMonth, type CalendarEvent } from "../../../components/calendar-view";
import { getCurrentContext } from "../../../lib/auth";

export default async function FamilyCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { month: requestedMonth } = await searchParams;
  const { year, month } = parseCalendarMonth(requestedMonth);

  const [{ data: summaries }, { data: communications }, { data: requests }, { data: occurrences }, { data: medications }] =
    await Promise.all([
      supabase.from("daily_summaries").select("id, narrative, school_days(day), children(first_name)").order("published_at", { ascending: false }).limit(100),
      supabase.from("communication_recipients").select("id, communications!inner(title, event_date, published_at)").eq("membership_id", membership.id).limit(100),
      supabase.from("family_requests").select("id, request_type, effective_date, children(first_name)").order("effective_date", { ascending: false }).limit(100),
      supabase.from("occurrence_recipients").select("id, occurrences!inner(title, occurred_at)").eq("membership_id", membership.id).limit(100),
      supabase.from("medication_requests").select("id, medication_name, starts_on, scheduled_time, children(first_name)").limit(100),
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

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#557164]">CALENDÁRIO</span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em]">A vida escolar em um só lugar</h1>
        <div className="mt-4 flex rounded-xl bg-[#e9ece7] p-1 text-[10px] font-bold">
          <span className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-[#315645] shadow-sm">Calendário</span>
          <Link href="/app/family/history" className="flex-1 px-3 py-2 text-center text-[#77827c]">Histórico</Link>
        </div>
      </header>
      <CalendarView year={year} month={month} events={events} basePath="/app/family/calendar" compact />
    </div>
  );
}
