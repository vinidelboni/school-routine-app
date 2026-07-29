import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
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
type SearchParams = Promise<{ shift?: string }>;

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
  const requestedShift = (await searchParams).shift;
  const shift: Shift = requestedShift === "afternoon" ? "afternoon" : "morning";
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "teacher") redirect("/app");

  const { data: assignment, error: assignmentError } = await supabase
    .from("classroom_staff")
    .select("classroom_id, classrooms(id, name, school_id)")
    .eq("membership_id", membership.id)
    .limit(1)
    .maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) return <EmptyState message="Nenhuma turma foi atribuída a este acesso." />;

  const classroom = Array.isArray(assignment.classrooms)
    ? assignment.classrooms[0]
    : assignment.classrooms;
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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
            ROTINA OPERACIONAL · {classroom.name.toUpperCase()}
          </span>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
            Registro coletivo
          </h1>
          <p className="mt-2 text-sm text-[#69746f]">
            O sistema mostra apenas as crianças previstas neste turno.
          </p>
        </div>
        <span className={`flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold ${isPublished ? "bg-[#e4eee7] text-[#47705d]" : "bg-[#f5eadc] text-[#8d684c]"}`}>
          {isPublished ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
          {isPublished ? "Dia publicado" : shiftComplete ? "Turno completo" : "Em preenchimento"}
        </span>
      </header>

      <nav aria-label="Turno" className="mt-6 inline-flex rounded-xl border border-[#dfe1d9] bg-white p-1">
        <ShiftLink active={shift === "morning"} href="/app/teacher?shift=morning">
          Manhã
        </ShiftLink>
        <ShiftLink active={shift === "afternoon"} href="/app/teacher?shift=afternoon">
          Tarde
        </ShiftLink>
      </nav>

      <section className="mt-6 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#315645] p-6 text-white">
            <span className="text-[9px] font-extrabold tracking-[.14em] text-[#bfd2c7]">
              {shift === "morning" ? "TURNO DA MANHÃ" : "TURNO DA TARDE"}
            </span>
            <strong className="mt-3 block font-[var(--font-display)] text-2xl">
              {children.length} crianças previstas
            </strong>
            <div className="mt-5 space-y-2">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-xs">
                  <span>{child.first_name} · {child.scheduleName}</span>
                  <small className="text-[#cbd9d2]">{child.expectedStart}–{child.expectedEnd}</small>
                </div>
              ))}
            </div>
          </div>

          <form action={markAllPresent} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
            <input type="hidden" name="schoolDayId" value={schoolDay.id} />
            <input type="hidden" name="schoolId" value={membership.school_id} />
            {children.map((child) => (
              <input key={child.id} type="hidden" name="childId" value={child.id} />
            ))}
            <strong className="flex items-center gap-2 text-sm">
              <Check size={17} className="text-[#42715d]" /> Chamada coletiva
            </strong>
            <p className="mt-2 text-xs leading-5 text-[#69746f]">
              Marca somente as crianças previstas para {shift === "morning" ? "a manhã" : "a tarde"}.
            </p>
            <button
              disabled={isPublished || children.length === 0}
              className="mt-4 w-full rounded-xl border border-[#98b3a4] px-4 py-3 text-xs font-bold text-[#315645] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {attendanceComplete ? "Atualizar chamada" : "Marcar grupo presente"}
            </button>
          </form>

          {incomingHandoffs.map((handoff) => (
            <div key={handoff.id} className="rounded-2xl border border-[#e4c6a9] bg-[#fff8f0] p-5">
              <span className="text-[9px] font-extrabold tracking-[.12em] text-[#976b49]">
                PASSAGEM RECEBIDA
              </span>
              <p className="mt-2 text-sm leading-6 text-[#604f42]">{handoff.note}</p>
              <form action={resolveShiftHandoff}>
                <input type="hidden" name="handoffId" value={handoff.id} />
                <button className="mt-3 text-xs font-bold text-[#315645]">Marcar como resolvida</button>
              </form>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {enabledModules.map((module) => {
            const options = Array.isArray(module.options)
              ? module.options.filter((option): option is string => typeof option === "string")
              : [];
            const defaultOption = options[0] ?? "Sem observações";
            const completed = children.filter((child) =>
              entryMap.has(`${child.id}:${module.category}:${shift}`),
            ).length;
            return (
              <form key={module.category} action={recordRoutineBatch} className="overflow-hidden rounded-2xl border border-[#dfe1d9] bg-white">
                <input type="hidden" name="schoolDayId" value={schoolDay.id} />
                <input type="hidden" name="schoolId" value={membership.school_id} />
                <input type="hidden" name="category" value={module.category} />
                <input type="hidden" name="periodKey" value={shift} />
                <div className="border-b border-[#ecece7] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-[var(--font-display)] text-xl font-bold">
                        {categoryLabels[module.category as keyof typeof categoryLabels]}
                      </h2>
                      <p className="mt-1 text-xs text-[#69746f]">
                        {module.required ? "Obrigatório neste turno" : "Opcional"} · {completed}/{children.length} registrados
                      </p>
                    </div>
                    {completed === children.length && children.length > 0 ? (
                      <CheckCircle2 size={20} className="text-[#42715d]" />
                    ) : (
                      <Clock3 size={20} className="text-[#b68a67]" />
                    )}
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
                        <span className="block rounded-xl border border-[#dfe1d9] px-3 py-3 text-center text-[10px] font-bold peer-checked:border-[#315645] peer-checked:bg-[#315645] peer-checked:text-white">
                          {option}
                        </span>
                      </label>
                    ))}
                    {options.length === 0 ? (
                      <input type="hidden" name="defaultStatus" value={defaultOption} />
                    ) : null}
                  </div>
                </div>
                <div>
                  {children.map((child) => (
                    <div key={child.id} className="grid grid-cols-[1fr_155px] items-center gap-3 border-b border-[#efefea] px-5 py-3 last:border-0">
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
                        className="h-9 rounded-lg border border-[#dfe1d9] bg-[#fafaf7] px-2 text-[10px]"
                      >
                        <option value="">Sem exceção</option>
                        {options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end bg-[#f4f5f1] p-4">
                  <button disabled={isPublished || !attendanceComplete || children.length === 0} className="rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white disabled:opacity-40">
                    Aplicar para o grupo
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>

      {!isPublished ? (
        shift === "morning" ? (
          <form action={createShiftHandoff} className="mt-5 rounded-2xl border border-[#d5ddd7] bg-[#eef3ef] p-5">
            <input type="hidden" name="schoolDayId" value={schoolDay.id} />
            <input type="hidden" name="schoolId" value={membership.school_id} />
            <input type="hidden" name="classroomId" value={classroom.id} />
            <input type="hidden" name="fromShift" value="morning" />
            <input type="hidden" name="toShift" value="afternoon" />
            <strong className="flex items-center gap-2 text-sm"><ArrowRight size={17} /> Passagem para a tarde</strong>
            <textarea name="note" required minLength={3} maxLength={500} placeholder="Ex.: Bento precisa trocar a roupa após o descanso." className="mt-3 min-h-20 w-full rounded-xl border border-[#cad6ce] bg-white p-3 text-sm" />
            <button disabled={!shiftComplete} className="mt-3 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white disabled:opacity-40">
              Registrar passagem de turno
            </button>
          </form>
        ) : (
          <form action={publishDay} className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d5ddd7] bg-[#eef3ef] p-5">
            <input type="hidden" name="schoolDayId" value={schoolDay.id} />
            <div>
              <strong className="flex items-center gap-2 text-sm"><ClipboardCheck size={17} /> Revisar e publicar</strong>
              <span className="text-xs text-[#69746f]">
                {shiftComplete ? "Turno completo e pronto para publicação." : "Conclua os campos obrigatórios do turno."}
              </span>
            </div>
            <button disabled={!shiftComplete || incomingHandoffs.length > 0} className="flex items-center gap-2 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white disabled:opacity-40">
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
    <Link href={href} className={`rounded-lg px-5 py-2.5 text-xs font-bold ${active ? "bg-[#315645] text-white" : "text-[#607069]"}`}>
      {children}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe1d9] bg-white p-8">
      <Users className="text-[#557164]" />
      <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold">Nada para preencher</h1>
      <p className="mt-2 text-sm text-[#69746f]">{message}</p>
    </div>
  );
}
