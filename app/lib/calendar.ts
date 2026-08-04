export function parseCalendarMonth(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (year >= 2020 && year <= 2100 && month >= 0 && month <= 11) {
      return { year, month };
    }
  }
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() };
}

export function toSaoPauloDateKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export type CalendarPeriod = "week" | "month" | "bimester" | "trimester";

export function parseCalendarPeriod(value?: string): CalendarPeriod {
  return value === "month" || value === "bimester" || value === "trimester" ? value : "week";
}

export function getCalendarRange(year: number, month: number, period: CalendarPeriod) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const anchor = isCurrentMonth ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : new Date(year, month, 1);
  let start: Date;
  let end: Date;
  if (period === "week") {
    const mondayOffset = (anchor.getDay() + 6) % 7;
    start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - mondayOffset);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  } else {
    const months = period === "month" ? 1 : period === "bimester" ? 2 : 3;
    start = new Date(year, month, 1);
    end = new Date(year, month + months, 1);
  }
  const toKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { start: toKey(start), end: toKey(end) };
}
