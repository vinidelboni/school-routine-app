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
