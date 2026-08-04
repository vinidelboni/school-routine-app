"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  detail?: string;
  kind: "routine" | "communication" | "request" | "occurrence" | "medication" | "photo" | "schoolEvent";
  href?: string;
};

const kindStyles = {
  routine: "bg-[#dcebe2] text-[#315645]",
  communication: "bg-[#f4e4d3] text-[#8a5a38]",
  request: "bg-[#e4e9f2] text-[#536681]",
  occurrence: "bg-[#f5ded8] text-[#9b4035]",
  medication: "bg-[#eae3f2] text-[#67557e]",
  photo: "bg-[#e7eee8] text-[#557164]",
  schoolEvent: "bg-[#dcecff] text-[#1768c5]",
} as const;

const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
const kindLabels = {
  routine: "Rotina",
  communication: "Comunicados",
  request: "Solicitações",
  occurrence: "Ocorrências",
  medication: "Medicamentos",
  photo: "Atividades",
  schoolEvent: "Eventos escolares",
} as const;
const kindOrder: CalendarEvent["kind"][] = [
  "routine",
  "communication",
  "request",
  "occurrence",
  "medication",
  "photo",
  "schoolEvent",
];

export function CalendarView({
  year,
  month,
  events,
  basePath,
  compact = false,
  period,
  loadedStart,
  loadedEnd,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  basePath: string;
  compact?: boolean;
  period?: string;
  loadedStart?: string;
  loadedEnd?: string;
}) {
  const [selectedKind, setSelectedKind] = useState<"all" | CalendarEvent["kind"]>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
  const visibleEvents =
    compact && selectedDate
      ? monthEvents.filter((event) => event.date === selectedDate)
      : compact
        ? []
        : monthEvents;
  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
      }).format(new Date(`${selectedDate}T12:00:00`))
    : null;

  return (
    <>
      <section
        className={
          compact
            ? "mt-6 overflow-hidden"
            : "mt-5 overflow-hidden rounded-3xl border border-[#dfe2dc] bg-white"
        }
      >
        <div
          className={`flex items-center justify-between px-3 py-3 ${
            compact ? "" : "border-b border-[#e9eae5]"
          }`}
        >
          <Link
            href={`${basePath}?month=${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}${period ? `&period=${period}` : ""}`}
            aria-label="Mês anterior"
            className={`grid h-9 w-9 place-items-center rounded-full ${
              compact
                ? "bg-[#e7effb] text-[#2d62b4] active:bg-[#dbe8f9]"
                : "text-[#2d62b4] active:bg-[#e7effb]"
            }`}
          >
            <ChevronLeft size={19} />
          </Link>
          <strong
            className={`capitalize ${
              compact ? "text-base text-[#172b4d]" : "text-sm"
            }`}
          >
            {monthLabel}
          </strong>
          <Link
            href={`${basePath}?month=${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}${period ? `&period=${period}` : ""}`}
            aria-label="Próximo mês"
            className={`grid h-9 w-9 place-items-center rounded-full ${
              compact
                ? "bg-[#e7effb] text-[#2d62b4] active:bg-[#dbe8f9]"
                : "text-[#2d62b4] active:bg-[#e7effb]"
            }`}
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
            const isLoaded = !loadedStart || !loadedEnd || (dateKey >= loadedStart && dateKey < loadedEnd);
            return (
              <button
                type="button"
                key={dateKey}
                aria-label={`${day} de ${monthLabel}${dayEvents.length ? `, ${dayEvents.length} registros` : ""}`}
                aria-pressed={compact ? selectedDate === dateKey : undefined}
                disabled={!compact || !isLoaded}
                onClick={compact ? () => setSelectedDate(dateKey) : undefined}
                className={`flex ${compact ? "h-14 cursor-pointer rounded-xl" : "h-16 border-t border-[#f0f0ec]"} flex-col items-center pt-1.5 transition ${
                  compact && selectedDate === dateKey ? "bg-[#e7effb]" : !isLoaded ? "opacity-35" : ""
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold ${
                    compact && selectedDate === dateKey
                      ? "bg-gradient-to-b from-[#169fe0] to-[#1253b5] text-white shadow-[0_5px_12px_rgba(18,83,181,.25)]"
                      : dateKey === todayKey
                        ? compact
                          ? "ring-1 ring-[#2d83e6] text-[#2d62b4]"
                          : "bg-gradient-to-b from-[#169fe0] to-[#1253b5] text-white shadow-[0_5px_12px_rgba(18,83,181,.25)]"
                        : compact
                          ? "text-[#4a5b74]"
                          : "text-[#4f5c55]"
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length ? (
                  <span className="mt-1 flex max-w-full gap-0.5" aria-hidden="true">
                    {compact ? (
                      <i className="h-1.5 w-1.5 rounded-full bg-[#2386df]" />
                    ) : (
                      dayEvents.slice(0, 3).map((event) => (
                        <i
                          key={event.id}
                          title={event.title}
                          className="h-1.5 w-1.5 rounded-full bg-[#2386df]"
                        />
                      ))
                    )}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className={compact ? "mt-7" : "mt-5"}>
        <div className="flex items-center justify-between px-1">
          <h2 className={`font-extrabold ${compact ? "text-sm text-[#172b4d]" : "text-xs text-[#4d5e55]"}`}>
            {compact ? selectedDateLabel ?? "Detalhes do dia" : "Neste mês"}
          </h2>
          <span className="flex items-center gap-2">
            <small className="text-[9px] text-[#8c948f]">
              {compact ? visibleEvents.length : monthEvents.length} registros
            </small>
            {availableKinds.size ? (
              <button
                type="button"
                aria-label="Filtrar registros"
                aria-expanded={filterOpen}
                aria-controls="calendar-filter-options"
                onClick={() => setFilterOpen((open) => !open)}
                className={`relative grid h-9 w-9 place-items-center rounded-full border transition ${
                  effectiveKind === "all"
                    ? "border-[#cddff2] bg-white text-[#2d62b4] active:bg-[#e7effb]"
                    : "border-[#0759bd] bg-[#0759bd] text-white"
                }`}
              >
                <ListFilter size={17} />
                {effectiveKind !== "all" ? (
                  <i className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#f7f5ef] bg-[#d78c62]" />
                ) : null}
              </button>
            ) : null}
          </span>
        </div>
        {availableKinds.size && filterOpen ? (
          <div
            id="calendar-filter-options"
            className="mt-3 rounded-2xl border border-[#dfe2dc] bg-white p-2 shadow-[0_10px_30px_rgba(49,86,69,.09)]"
            role="group"
            aria-label="Filtrar registros do calendário"
          >
            <FilterButton
              active={effectiveKind === "all"}
              label="Todos"
              count={monthEventsUnfiltered.length}
              onClick={() => {
                setSelectedKind("all");
                setFilterOpen(false);
              }}
            />
            {kindOrder
              .filter((kind) => availableKinds.has(kind))
              .map((kind) => (
                <FilterButton
                  key={kind}
                  active={effectiveKind === kind}
                  label={kindLabels[kind]}
                  count={monthEventsUnfiltered.filter((event) => event.kind === kind).length}
                  onClick={() => {
                    setSelectedKind(kind);
                    setFilterOpen(false);
                  }}
                  dotClass="bg-[#2386df]"
                />
              ))}
          </div>
        ) : null}
        <div
          className={
            compact && visibleEvents.length
              ? "mt-3 divide-y divide-[#e5eaf1] rounded-2xl bg-white px-3"
              : "mt-2 grid gap-2"
          }
        >
          {visibleEvents.map((event) => {
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
              <Link key={event.id} href={event.href} className={`flex items-center gap-3 p-3 active:bg-[#f3f4f1] ${compact ? "" : "rounded-2xl border border-[#e2e3de] bg-white"}`}>
                {content}
              </Link>
            ) : (
              <article key={event.id} className={`flex items-center gap-3 p-3 ${compact ? "" : "rounded-2xl border border-[#e2e3de] bg-white"}`}>
                {content}
              </article>
            );
          })}
          {compact && !selectedDate ? (
            <div className="py-8 text-center text-[11px] text-[#8794a8]">
              Toque em uma data para consultar a rotina, os eventos e os avisos.
            </div>
          ) : null}
          {selectedDate && !visibleEvents.length ? (
            <div className="py-8 text-center text-[11px] text-[#8794a8]">
              Nenhum registro para este dia.
            </div>
          ) : null}
          {!compact && !monthEvents.length ? (
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
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[10px] font-bold transition ${
        active
          ? "bg-[#e7f2ff] text-[#0759bd]"
          : "text-[#536b84] active:bg-[#edf5fd]"
      }`}
    >
      {dotClass ? (
        <i className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      ) : (
        <i className="h-2.5 w-2.5 rounded-full bg-[#a9b0ac]" />
      )}
      <span className="flex-1">{label}</span>
      <span className="text-[#9aa19d]">{count}</span>
      {active ? <Check size={15} /> : <span className="w-[15px]" />}
    </button>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
