import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarView, type CalendarEvent } from "../../../components/calendar-view";
import { getCurrentContext } from "../../../lib/auth";
import { parseCalendarMonth } from "../../../lib/calendar";

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
      <CalendarView year={year} month={month} events={events} basePath="/app/family/calendar" compact />
    </div>
  );
}
