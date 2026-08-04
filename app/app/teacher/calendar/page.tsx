import { redirect } from "next/navigation";
import { CalendarView, type CalendarEvent } from "../../../components/calendar-view";
import { getCurrentContext } from "../../../lib/auth";
import { parseCalendarMonth, toSaoPauloDateKey } from "../../../lib/calendar";

const kindLabels = { event: "Evento", meeting: "Reunião", trip: "Passeio" } as const;

export default async function TeacherCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "teacher") redirect("/app");
  const { month: requestedMonth } = await searchParams;
  const { year, month } = parseCalendarMonth(requestedMonth);

  const [{ data: schoolDays }, { data: handoffs }, { data: photos }, { data: schoolEvents }] = await Promise.all([
    supabase.from("school_days").select("id, day, status, classrooms(name)").order("day", { ascending: false }).limit(150),
    supabase.from("shift_handoffs").select("id, created_at, note, classrooms(name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("photo_publications").select("id, activity_date, caption, classrooms(name)").order("activity_date", { ascending: false }).limit(100),
    supabase.from("school_events").select("id, kind, title, location, starts_at, status").eq("status", "published").order("starts_at", { ascending: true }).limit(150),
  ]);
  const events: CalendarEvent[] = [];
  schoolDays?.forEach((item) => {
    const classroom = Array.isArray(item.classrooms) ? item.classrooms[0] : item.classrooms;
    events.push({ id: `day-${item.id}`, date: item.day, title: classroom?.name ?? "Rotina da turma", detail: item.status === "published" ? "Agendas publicadas" : "Em preenchimento", kind: "routine", href: "/app/teacher" });
  });
  handoffs?.forEach((item) => {
    const classroom = Array.isArray(item.classrooms) ? item.classrooms[0] : item.classrooms;
    events.push({ id: `handoff-${item.id}`, date: item.created_at.slice(0, 10), title: `Passagem de turno · ${classroom?.name}`, detail: item.note, kind: "request", href: "/app/teacher" });
  });
  photos?.forEach((item) => {
    const classroom = Array.isArray(item.classrooms) ? item.classrooms[0] : item.classrooms;
    events.push({ id: `photo-${item.id}`, date: item.activity_date, title: item.caption, detail: classroom?.name, kind: "photo", href: "/app/teacher/photos" });
  });
  schoolEvents?.forEach((item) => events.push({ id: `school-event-${item.id}`, date: toSaoPauloDateKey(item.starts_at), title: item.title, detail: `${kindLabels[item.kind]}${item.location ? ` · ${item.location}` : ""}`, kind: "schoolEvent" }));

  return (
    <div>
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0759bd] via-[#0b6ed1] to-[#19a5e9] px-6 py-7 text-white shadow-[0_18px_45px_rgba(7,89,189,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[40px] border-white/[.07]" />
        <div className="relative"><span className="text-[9px] font-extrabold tracking-[.16em] text-[#c3e5ff]">CALENDÁRIO DA TURMA</span>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Rotinas e pendências por dia</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#d8ecff]">Consulte dias publicados, compromissos, passagens de turno e atividades.</p></div>
      </header>
      <CalendarView year={year} month={month} events={events} basePath="/app/teacher/calendar" />
    </div>
  );
}
