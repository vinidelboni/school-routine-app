"use client";

import Link from "next/link";
import { useState } from "react";
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
const kindLabels = {
  routine: "Rotina",
  communication: "Comunicados",
  request: "Solicitações",
  occurrence: "Ocorrências",
  medication: "Medicamentos",
  photo: "Atividades",
} as const;
const kindOrder: CalendarEvent["kind"][] = [
  "routine",
  "communication",
  "request",
  "occurrence",
  "medication",
  "photo",
];

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
  const [selectedKind, setSelectedKind] = useState<"all" | CalendarEvent["kind"]>("all");
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previous = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const todayKey = toDateKey(new Date());
  const monthEventsUnfiltered = events
    .filter((event) => {
      const date = new Date(`${event.date}T12:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    })
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const availableKinds = new Set(monthEventsUnfiltered.map((event) => event.kind));
  const effectiveKind =
    selectedKind === "all" || availableKinds.has(selectedKind) ? selectedKind : "all";
  const filteredEvents =
    effectiveKind === "all"
      ? events
      : events.filter((event) => event.kind === effectiveKind);
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of filteredEvents) {
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
  const monthEvents =
    effectiveKind === "all"
      ? monthEventsUnfiltered
      : monthEventsUnfiltered.filter((event) => event.kind === effectiveKind);

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
        {availableKinds.size ? (
          <div
            className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none]"
            role="group"
            aria-label="Filtrar registros do calendário"
          >
            <FilterButton
              active={effectiveKind === "all"}
              label="Todos"
              count={monthEventsUnfiltered.length}
              onClick={() => setSelectedKind("all")}
            />
            {kindOrder
              .filter((kind) => availableKinds.has(kind))
              .map((kind) => (
                <FilterButton
                  key={kind}
                  active={effectiveKind === kind}
                  label={kindLabels[kind]}
                  count={monthEventsUnfiltered.filter((event) => event.kind === kind).length}
                  onClick={() => setSelectedKind(kind)}
                  dotClass={kindStyles[kind].split(" ")[0]}
                />
              ))}
          </div>
        ) : null}
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

function FilterButton({
  active,
  label,
  count,
  onClick,
  dotClass,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[9px] font-bold transition ${
        active
          ? "border-[#315645] bg-[#315645] text-white"
          : "border-[#dfe2dc] bg-white text-[#64716a] active:bg-[#f0f2ef]"
      }`}
    >
      {dotClass && !active ? <i className={`h-2 w-2 rounded-full ${dotClass}`} /> : null}
      {label}
      <span className={active ? "text-white/70" : "text-[#9aa19d]"}>{count}</span>
    </button>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
