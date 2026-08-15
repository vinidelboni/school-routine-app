import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  Send,
  Users,
} from "lucide-react";
import { getCurrentContext } from "../../lib/auth";
import {
  createShiftHandoff,
  markAllPresent,
  publishDay,
  recordRoutineBatch,
  resolveShiftHandoff,
} from "../actions";

type Shift = "morning" | "afternoon";
type SearchParams = Promise<{ shift?: string; classroom?: string }>;

const categoryLabels = {
  meal: "Alimentação",
  hydration: "Hidratação",
  sleep: "Sono",
  hygiene: "Higiene",
  activity: "Atividade",
  note: "Observação",
} as const;

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const requestedShift = query.shift;
  const shift: Shift = requestedShift === "afternoon" ? "afternoon" : "morning";
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "teacher") redirect("/app");

  const { data: assignments, error: assignmentError } = await supabase
    .from("classroom_staff")
    .select("classroom_id, classrooms(id, name, school_id)")
    .eq("membership_id", membership.id)
    .order("created_at");
  if (assignmentError) throw assignmentError;
  if (!assignments?.length) return <EmptyState message="Nenhuma turma foi atribuída a este acesso." />;

  const selectedAssignment =
    assignments.find((assignment) => assignment.classroom_id === query.classroom) ??
    assignments[0];
  const classroom = Array.isArray(selectedAssignment.classrooms)
    ? selectedAssignment.classrooms[0]
    : selectedAssignment.classrooms;
  if (!classroom) return <EmptyState message="A turma atribuída não está disponível." />;

  const { data: schoolDay, error: dayError } = await supabase
    .from("school_days")
    .select("id, day, status, published_at")
    .eq("classroom_id", classroom.id)
    .order("day", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dayError) throw dayError;
  if (!schoolDay) return <EmptyState message="Nenhum dia letivo foi aberto para esta turma." />;

  const [
    { data: enrollments, error: enrollmentError },
    { data: configurations, error: configurationError },
    { data: attendance },
    { data: entries },
    { data: handoffs },
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("child_id, schedule_name, weekdays, expected_start, expected_end, children(id, first_name, last_name)")
      .eq("classroom_id", classroom.id)
      .eq("status", "active")
      .order("created_at"),
    supabase
      .from("routine_configurations")
      .select("category, enabled, required, position, options")
      .eq("classroom_id", classroom.id)
      .eq("enabled", true)
      .order("position"),
    supabase
      .from("attendance_records")
      .select("child_id, status")
      .eq("school_day_id", schoolDay.id),
    supabase
      .from("routine_entries")
      .select("child_id, category, period_key, value, is_exception")
      .eq("school_day_id", schoolDay.id),
    supabase
      .from("shift_handoffs")
      .select("id, note, status, from_shift, to_shift, created_at")
      .eq("school_day_id", schoolDay.id)
      .order("created_at", { ascending: false }),
  ]);
  if (enrollmentError) throw enrollmentError;
  if (configurationError) throw configurationError;

  const weekday = new Date(`${schoolDay.day}T12:00:00`).getDay();
  const shiftStart = shift === "morning" ? "00:00" : "12:00";
  const shiftEnd = shift === "morning" ? "12:00" : "23:59";
  const children = (enrollments ?? [])
    .filter(
      (enrollment) =>
        enrollment.weekdays.includes(weekday) &&
        enrollment.expected_start.slice(0, 5) < shiftEnd &&
        enrollment.expected_end.slice(0, 5) > shiftStart,
    )
    .map((enrollment) => {
      const child = Array.isArray(enrollment.children)
        ? enrollment.children[0]
        : enrollment.children;
      return child
        ? {
            ...child,
            scheduleName: enrollment.schedule_name,
            expectedStart: enrollment.expected_start.slice(0, 5),
            expectedEnd: enrollment.expected_end.slice(0, 5),
          }
        : null;
    })
    .filter((child): child is NonNullable<typeof child> => child !== null);

  const enabledModules = (configurations ?? []).filter(
    (configuration) => configuration.category !== "attendance",
  );
  const entryMap = new Map(
    (entries ?? []).map((entry) => [
      `${entry.child_id}:${entry.category}:${entry.period_key}`,
      typeof entry.value === "object" && entry.value && "label" in entry.value
        ? String(entry.value.label)
        : "",
    ]),
  );
  const attendanceIds = new Set(attendance?.map((record) => record.child_id));
  const requiredModules = enabledModules.filter((module) => module.required);
  const requiredExpected = children.length * requiredModules.length;
  const requiredCompleted = children.reduce(
    (total, child) =>
      total +
      requiredModules.filter((module) =>
        entryMap.has(`${child.id}:${module.category}:${shift}`),
      ).length,
    0,
  );
  const attendanceComplete = children.every((child) => attendanceIds.has(child.id));
  const shiftComplete = attendanceComplete && requiredCompleted === requiredExpected;
  const isPublished = schoolDay.status === "published";
  const incomingHandoffs = (handoffs ?? []).filter(
    (handoff) => handoff.to_shift === shift && handoff.status === "open",
  );

  return (
    <div>
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0759bd] via-[#0b6ed1] to-[#19a5e9] px-6 py-7 text-white shadow-[0_18px_45px_rgba(7,89,189,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-60 w-60 rounded-full border-[42px] border-white/[.07]" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="text-[9px] font-extrabold tracking-[.16em] text-[#c3e5ff]">ROTINA · {classroom.name.toUpperCase()}</span>
            <h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Registro coletivo</h1>
            <p className="mt-2 text-sm text-[#d8ecff]">Preencha o grupo e ajuste somente as exceções.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[10px] font-bold backdrop-blur">{isPublished ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{isPublished ? "Dia publicado" : shiftComplete ? "Turno completo" : "Em preenchimento"}</span>
            <Link href="/app/teacher/simulation" className="rounded-xl bg-white px-4 py-3 text-[10px] font-extrabold text-[#1768c5] shadow-sm transition hover:bg-[#eef7ff]">Simular um dia</Link>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:max-w-xl">
          <Summary label="Crianças" value={children.length} />
          <Summary label="Presença" value={attendanceComplete ? "Concluída" : `${attendanceIds.size}/${children.length}`} />
          <Summary label="Rotina" value={`${requiredCompleted}/${requiredExpected}`} />
        </div>
      </header>

      <section className="mt-5 rounded-2xl border border-[#d8e5f2] bg-white p-4 shadow-[0_8px_24px_rgba(27,66,112,.05)] sm:p-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#6582a2]">1 · Selecione o turno</span>
            <nav aria-label="Turno" className="mt-2 inline-flex rounded-xl bg-[#edf4fb] p-1">
              <ShiftLink active={shift === "morning"} href={`/app/teacher?classroom=${classroom.id}&shift=morning`}>
                Manhã
              </ShiftLink>
              <ShiftLink active={shift === "afternoon"} href={`/app/teacher?classroom=${classroom.id}&shift=afternoon`}>
                Tarde
              </ShiftLink>
            </nav>
          </div>
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#6582a2]">2 · Selecione a turma</span>
            <nav aria-label="Turma" className="mt-2 flex flex-wrap gap-2">
              {assignments.map((assignment) => {
                const assignedClassroom = Array.isArray(assignment.classrooms)
                  ? assignment.classrooms[0]
                  : assignment.classrooms;
                return assignedClassroom ? (
                  <Link
                    key={assignment.classroom_id}
                    href={`/app/teacher?classroom=${assignedClassroom.id}&shift=${shift}`}
                    aria-current={assignedClassroom.id === classroom.id ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${assignedClassroom.id === classroom.id ? "border-[#1768c5] bg-[#1768c5] text-white shadow-sm" : "border-[#d8e5f2] bg-white text-[#647b94] hover:border-[#9dc7ef] hover:bg-[#f3f8fd]"}`}
                  >
                    {assignedClassroom.name}
                    {assignedClassroom.id === classroom.id ? <Check size={14} /> : null}
                  </Link>
                ) : null;
              })}
            </nav>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-4 px-1">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#6582a2]">3 · Abra o item para preencher</span>
            <h2 className="mt-1 font-[var(--font-display)] text-xl font-bold tracking-[-.03em]">{classroom.name} · {shift === "morning" ? "Manhã" : "Tarde"}</h2>
          </div>
          <small className="hidden text-right text-[10px] leading-4 text-[#73869c] sm:block">Cada linha abre<br />sua própria lista</small>
        </div>

        <details className="group overflow-hidden rounded-2xl border border-[#d8e5f2] bg-white shadow-[0_8px_24px_rgba(27,66,112,.05)] open:border-[#a9cbed] open:shadow-[0_14px_34px_rgba(23,104,197,.1)]">
          <summary className="flex min-h-[78px] cursor-pointer list-none items-center gap-4 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${attendanceComplete ? "bg-[#e8f4ff] text-[#1768c5]" : "bg-[#f4f6f8] text-[#73869c]"}`}>
              {attendanceComplete ? <CheckCircle2 size={21} /> : <Users size={21} />}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block font-[var(--font-display)] text-base font-bold">Crianças e chamada</strong>
              <small className="mt-1 block text-[10px] text-[#6f8299]">{children.length} previstas · {attendanceIds.size}/{children.length} presentes</small>
            </span>
            <span className={`hidden rounded-full px-3 py-1.5 text-[9px] font-extrabold sm:block ${attendanceComplete ? "bg-[#e8f4ff] text-[#1768c5]" : "bg-[#fff4e9] text-[#9a6b43]"}`}>{attendanceComplete ? "CONCLUÍDO" : "PENDENTE"}</span>
            <ChevronDown size={19} className="shrink-0 text-[#7890a8] transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-[#e5edf5] bg-[#fbfdff] p-4 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-xl border border-[#dce8f3] bg-white px-3 py-3 text-xs">
                  <span><strong className="block">{child.first_name} {child.last_name}</strong><small className="mt-0.5 block text-[9px] text-[#788ba0]">{child.scheduleName}</small></span>
                  <small className="text-[#5d7895]">{child.expectedStart}–{child.expectedEnd}</small>
                </div>
              ))}
            </div>
            <form action={markAllPresent} className="mt-4 border-t border-[#e5edf5] pt-4">
              <input type="hidden" name="schoolDayId" value={schoolDay.id} />
              <input type="hidden" name="schoolId" value={membership.school_id} />
              {children.map((child) => <input key={child.id} type="hidden" name="childId" value={child.id} />)}
              <p className="text-xs leading-5 text-[#6f8299]">Marque somente as crianças previstas para {shift === "morning" ? "a manhã" : "a tarde"}.</p>
              <button disabled={isPublished || children.length === 0} className="mt-3 w-full rounded-xl border border-[#9dc7ef] bg-[#eef7ff] px-4 py-3 text-xs font-bold text-[#1768c5] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
                {attendanceComplete ? "Atualizar chamada" : "Marcar grupo presente"}
              </button>
            </form>
          </div>
        </details>

        {incomingHandoffs.map((handoff) => (
          <details key={handoff.id} className="group overflow-hidden rounded-2xl border border-[#e4c6a9] bg-[#fffaf4]">
            <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-4 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0df] text-[#976b49]"><ArrowRight size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">Passagem de turno recebida</strong><small className="mt-1 block truncate text-[10px] text-[#876d58]">Toque para ler a pendência</small></span>
              <ChevronDown size={19} className="text-[#976b49] transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="border-t border-[#ecd9c7] p-5"><p className="text-sm leading-6 text-[#604f42]">{handoff.note}</p><form action={resolveShiftHandoff}><input type="hidden" name="handoffId" value={handoff.id} /><button className="mt-3 text-xs font-bold text-[#1768c5]">Marcar como resolvida</button></form></div>
          </details>
        ))}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 px-1">
            <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#6582a2]">Rotina da turma</span>
          </div>
          {enabledModules.map((module) => {
            const options = Array.isArray(module.options)
              ? module.options.filter((option): option is string => typeof option === "string")
              : [];
            const defaultOption = options[0] ?? "Sem observações";
            const completed = children.filter((child) =>
              entryMap.has(`${child.id}:${module.category}:${shift}`),
            ).length;
            const moduleComplete = completed === children.length && children.length > 0;
            return (
              <details key={module.category} className="group overflow-hidden rounded-2xl border border-[#d8e5f2] bg-white shadow-[0_8px_24px_rgba(27,66,112,.05)] open:border-[#a9cbed] open:shadow-[0_14px_34px_rgba(23,104,197,.1)]">
                <summary className="flex min-h-[78px] cursor-pointer list-none items-center gap-4 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${moduleComplete ? "bg-[#e8f4ff] text-[#1768c5]" : "bg-[#f4f6f8] text-[#73869c]"}`}>
                    {moduleComplete ? <CheckCircle2 size={21} /> : <Clock3 size={21} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate font-[var(--font-display)] text-base font-bold">
                      {categoryLabels[module.category as keyof typeof categoryLabels]}
                    </strong>
                    <small className="mt-1 block text-[10px] text-[#6f8299]">
                      {module.required ? "Obrigatório" : "Opcional"} · {completed}/{children.length} registrados
                    </small>
                  </span>
                  <span className={`hidden rounded-full px-3 py-1.5 text-[9px] font-extrabold sm:block ${moduleComplete ? "bg-[#e8f4ff] text-[#1768c5]" : "bg-[#fff4e9] text-[#9a6b43]"}`}>
                    {moduleComplete ? "CONCLUÍDO" : completed > 0 ? "EM ANDAMENTO" : "PENDENTE"}
                  </span>
                  <ChevronDown size={19} className="shrink-0 text-[#7890a8] transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <form action={recordRoutineBatch} className="border-t border-[#e5edf5] bg-[#fbfdff]">
                  <input type="hidden" name="schoolDayId" value={schoolDay.id} />
                  <input type="hidden" name="schoolId" value={membership.school_id} />
                  <input type="hidden" name="category" value={module.category} />
                  <input type="hidden" name="periodKey" value={shift} />
                  <div className="border-b border-[#e5edf5] p-5">
                    <div>
                      <strong className="text-xs">Aplicar uma opção para toda a turma</strong>
                      <p className="mt-1 text-[10px] text-[#6f8299]">Depois, altere somente as crianças que tiveram uma exceção.</p>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {options.map((option, index) => (
                        <label key={option} className="cursor-pointer">
                          <input
                            className="peer sr-only"
                            type="radio"
                            name="defaultStatus"
                            value={option}
                            defaultChecked={index === 0}
                            disabled={isPublished}
                          />
                          <span className="block rounded-xl border border-[#d8e5f2] bg-white px-3 py-3 text-center text-[10px] font-bold text-[#516b86] peer-checked:border-[#1768c5] peer-checked:bg-[#1768c5] peer-checked:text-white">
                            {option}
                          </span>
                        </label>
                      ))}
                      {options.length === 0 ? (
                        <input type="hidden" name="defaultStatus" value={defaultOption} />
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-white">
                    {children.map((child) => (
                      <div key={child.id} className="grid grid-cols-[1fr_145px] items-center gap-3 border-b border-[#e9eef4] px-5 py-3 last:border-0 sm:grid-cols-[1fr_180px]">
                        <input type="hidden" name="childId" value={child.id} />
                        <span>
                          <strong className="block text-xs">{child.first_name} {child.last_name}</strong>
                          <small className="text-[9px] text-[#858d88]">{child.scheduleName}</small>
                        </span>
                        <select
                          name={`exception-${child.id}`}
                          defaultValue={entryMap.get(`${child.id}:${module.category}:${shift}`) ?? ""}
                          disabled={isPublished}
                          aria-label={`Exceção de ${categoryLabels[module.category as keyof typeof categoryLabels]} para ${child.first_name}`}
                          className="h-10 min-w-0 rounded-lg border border-[#d8e5f2] bg-[#f7faff] px-2 text-[10px]"
                        >
                          <option value="">Sem exceção</option>
                          {options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end border-t border-[#e5edf5] bg-[#f5f9fd] p-4">
                    <button disabled={isPublished || !attendanceComplete || children.length === 0} className="w-full rounded-xl bg-[#1768c5] px-5 py-3 text-xs font-bold text-white shadow-[0_7px_18px_rgba(23,104,197,.2)] disabled:opacity-40 sm:w-auto">
                      Salvar {categoryLabels[module.category as keyof typeof categoryLabels]}
                    </button>
                  </div>
                </form>
              </details>
            );
          })}
        </div>
      </section>

      {!isPublished ? (
        shift === "morning" ? (
          <form action={createShiftHandoff} className="mt-5 rounded-2xl border border-[#cfe1f3] bg-[#eef7ff] p-5">
            <input type="hidden" name="schoolDayId" value={schoolDay.id} />
            <input type="hidden" name="schoolId" value={membership.school_id} />
            <input type="hidden" name="classroomId" value={classroom.id} />
            <input type="hidden" name="fromShift" value="morning" />
            <input type="hidden" name="toShift" value="afternoon" />
            <strong className="flex items-center gap-2 text-sm"><ArrowRight size={17} /> Passagem para a tarde</strong>
            <textarea name="note" required minLength={3} maxLength={500} placeholder="Ex.: Bento precisa trocar a roupa após o descanso." className="mt-3 min-h-20 w-full rounded-xl border border-[#bfd7ee] bg-white p-3 text-sm" />
            <button disabled={!shiftComplete} className="mt-3 rounded-xl bg-[#1768c5] px-5 py-3 text-xs font-bold text-white disabled:opacity-40">
              Registrar passagem de turno
            </button>
          </form>
        ) : (
          <form action={publishDay} className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#cfe1f3] bg-[#eef7ff] p-5">
            <input type="hidden" name="schoolDayId" value={schoolDay.id} />
            <div>
              <strong className="flex items-center gap-2 text-sm"><ClipboardCheck size={17} /> Revisar e publicar</strong>
              <span className="text-xs text-[#6f8299]">
                {shiftComplete ? "Turno completo e pronto para publicação." : "Conclua os campos obrigatórios do turno."}
              </span>
            </div>
            <button disabled={!shiftComplete || incomingHandoffs.length > 0} className="flex items-center gap-2 rounded-xl bg-[#1768c5] px-5 py-3 text-xs font-bold text-white shadow-[0_7px_18px_rgba(23,104,197,.2)] disabled:opacity-40">
              <Send size={16} /> Publicar agendas
            </button>
          </form>
        )
      ) : null}
    </div>
  );
}

function ShiftLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${active ? "bg-[#1768c5] text-white shadow-sm" : "text-[#61758d]"}`}>
      {children}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#d8e5f2] bg-white p-8">
      <Users className="text-[#1768c5]" />
      <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold">Nada para preencher</h1>
      <p className="mt-2 text-sm text-[#6f8299]">{message}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/15 bg-[#073f91]/35 px-3 py-3 backdrop-blur"><small className="block text-[8px] font-bold uppercase tracking-[.1em] text-[#bfe2ff]">{label}</small><strong className="mt-1 block truncate text-xs text-white sm:text-sm">{value}</strong></div>;
}
