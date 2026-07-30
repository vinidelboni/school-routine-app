import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  detail?: string;
  kind: "routine" | "communication" | "request" | "occurrence" | "medication" | "photo";
  href?: string;
};

const kindStyles = {
  routine: "bg-[#dcebe2] text-[#315645]",
  communication: "bg-[#f4e4d3] text-[#8a5a38]",
  request: "bg-[#e4e9f2] text-[#536681]",
  occurrence: "bg-[#f5ded8] text-[#9b4035]",
  medication: "bg-[#eae3f2] text-[#67557e]",
  photo: "bg-[#e7eee8] text-[#557164]",
} as const;

const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarView({
  year,
  month,
  events,
  basePath,
  compact = false,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  basePath: string;
  compact?: boolean;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previous = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const todayKey = toDateKey(new Date());
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const current = eventsByDate.get(event.date) ?? [];
    current.push(event);
    eventsByDate.set(event.date, current);
  }
  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(firstDay);
  const monthEvents = events
    .filter((event) => {
      const date = new Date(`${event.date}T12:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    })
    .toSorted((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-3xl border border-[#dfe2dc] bg-white">
        <div className="flex items-center justify-between border-b border-[#e9eae5] px-3 py-3">
          <Link
            href={`${basePath}?month=${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`}
            aria-label="Mês anterior"
            className="grid h-9 w-9 place-items-center rounded-full text-[#557164] active:bg-[#edf1ee]"
          >
            <ChevronLeft size={19} />
          </Link>
          <strong className="capitalize text-sm">{monthLabel}</strong>
          <Link
            href={`${basePath}?month=${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`}
            aria-label="Próximo mês"
            className="grid h-9 w-9 place-items-center rounded-full text-[#557164] active:bg-[#edf1ee]"
          >
            <ChevronRight size={19} />
          </Link>
        </div>
        <div className="grid grid-cols-7 px-2 pt-2">
          {weekdayLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="py-2 text-center text-[8px] font-extrabold text-[#929994]">
              {label}
            </span>
          ))}
          {cells.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} className={compact ? "h-12" : "h-16"} />;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            return (
              <div
                key={dateKey}
                className={`flex ${compact ? "h-12" : "h-16"} flex-col items-center border-t border-[#f0f0ec] pt-1.5`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${
                  dateKey === todayKey ? "bg-[#315645] text-white" : "text-[#4f5c55]"
                }`}>
                  {day}
                </span>
                {dayEvents.length ? (
                  <span className="mt-1 flex max-w-full gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <i
                        key={event.id}
                        title={event.title}
                        className={`h-1.5 w-1.5 rounded-full ${kindStyles[event.kind].split(" ")[0]}`}
                      />
                    ))}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-[#4d5e55]">Neste mês</h2>
          <span className="text-[9px] text-[#8c948f]">{monthEvents.length} registros</span>
        </div>
        <div className="mt-2 grid gap-2">
          {monthEvents.map((event) => {
            const content = (
              <>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${kindStyles[event.kind]}`}>
                  <CalendarDays size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{event.title}</strong>
                  <small className="mt-1 block truncate text-[9px] text-[#7c8680]">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${event.date}T12:00:00`))}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </small>
                </span>
                {event.href ? <ChevronRight size={15} className="text-[#a0a7a3]" /> : null}
              </>
            );
            return event.href ? (
              <Link key={event.id} href={event.href} className="flex items-center gap-3 rounded-2xl border border-[#e2e3de] bg-white p-3 active:bg-[#f3f4f1]">
                {content}
              </Link>
            ) : (
              <article key={event.id} className="flex items-center gap-3 rounded-2xl border border-[#e2e3de] bg-white p-3">
                {content}
              </article>
            );
          })}
          {!monthEvents.length ? (
            <div className="rounded-2xl border border-dashed border-[#d8ddd8] bg-white p-8 text-center text-[11px] text-[#7c8680]">
              Nenhum registro neste mês.
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export function parseCalendarMonth(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (year >= 2020 && year <= 2100 && month >= 0 && month <= 11) return { year, month };
  }
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() };
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
