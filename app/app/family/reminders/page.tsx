import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, CalendarDays, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { acknowledgeEventReminder } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

const kindLabels = { event: "Evento", meeting: "Reunião", trip: "Passeio" } as const;

export default async function FamilyRemindersPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: reminders } = await supabase
    .from("school_event_reminders")
    .select("id, offset_minutes, delivered_at, viewed_at, school_events!inner(kind, title, location, starts_at, status)")
    .eq("membership_id", membership.id)
    .eq("school_events.status", "published")
    .order("delivered_at", { ascending: false })
    .limit(40);

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#2a7bd0]">AGENDA</span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">Lembretes</h1>
        <p className="mt-2 text-xs leading-5 text-[#6e89a8]">Avisos automáticos antes de eventos, reuniões e passeios.</p>
      </header>

      <section className="mt-6 grid gap-3">
        {reminders?.map((reminder) => {
          const event = Array.isArray(reminder.school_events) ? reminder.school_events[0] : reminder.school_events;
          return (
            <article key={reminder.id} className={`rounded-3xl border bg-white p-4 shadow-[0_9px_26px_rgba(18,91,170,.07)] ${reminder.viewed_at ? "border-[#e5eaf1]" : "border-[#b9d9f7]"}`}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f1ff] text-[#0867cc]"><BellRing size={20} /></span>
                <span className="min-w-0 flex-1">
                  <small className="font-extrabold uppercase tracking-[.1em] text-[#2a7bd0]">{reminder.offset_minutes === 1440 ? "Amanhã" : "Em breve"}</small>
                  <strong className="mt-1 block text-sm text-[#15395f]">{event.title}</strong>
                  <span className="mt-1 flex items-center gap-1 text-[9px] text-[#6e89a8]"><CalendarDays size={11} /> {kindLabels[event.kind as keyof typeof kindLabels]} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(event.starts_at))}</span>
                  {event.location ? <span className="mt-1 flex items-center gap-1 text-[9px] text-[#6e89a8]"><MapPin size={11} /> {event.location}</span> : null}
                </span>
              </div>
              {reminder.viewed_at ? (
                <p className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[#1768c5]"><CheckCircle2 size={14} /> Lembrete visualizado</p>
              ) : (
                <form action={acknowledgeEventReminder} className="mt-3">
                  <input type="hidden" name="reminderId" value={reminder.id} />
                  <SubmitButton idleLabel="Confirmar visualização" pendingLabel="Registrando..." className="w-full rounded-xl bg-[#1768c5] px-4 py-3 text-[10px] font-bold text-white" />
                </form>
              )}
            </article>
          );
        })}
        {!reminders?.length ? (
          <div className="rounded-3xl border border-dashed border-[#cbdff4] bg-white px-6 py-10 text-center">
            <Clock3 className="mx-auto text-[#6ba4dd]" size={28} />
            <strong className="mt-3 block text-sm text-[#15395f]">Nenhum lembrete por enquanto</strong>
            <p className="mt-1 text-[11px] text-[#7890aa]">Quando um compromisso se aproximar, ele aparecerá aqui.</p>
            <Link href="/app/family/calendar" className="mt-4 inline-flex rounded-xl bg-[#edf5fd] px-4 py-2.5 text-[10px] font-bold text-[#0759bd]">Abrir calendário</Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
