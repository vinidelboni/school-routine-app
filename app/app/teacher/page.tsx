import { redirect } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  Send,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import { getCurrentContext } from "../../lib/auth";
import { markAllPresent, publishDay, recordMeal } from "../actions";

const mealOptions = ["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"] as const;

export default async function TeacherPage() {
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

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("child_id, schedule_name, children(id, first_name, last_name)")
    .eq("classroom_id", classroom.id)
    .eq("status", "active")
    .order("created_at");
  if (enrollmentError) throw enrollmentError;

  const children = (enrollments ?? [])
    .map((enrollment) => {
      const child = Array.isArray(enrollment.children)
        ? enrollment.children[0]
        : enrollment.children;
      return child
        ? { ...child, scheduleName: enrollment.schedule_name }
        : null;
    })
    .filter((child): child is NonNullable<typeof child> => child !== null);

  const [{ data: attendance }, { data: meals }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("child_id, status")
      .eq("school_day_id", schoolDay.id),
    supabase
      .from("routine_entries")
      .select("child_id, value, is_exception")
      .eq("school_day_id", schoolDay.id)
      .eq("category", "meal")
      .eq("period_key", "lunch"),
  ]);

  const attendanceByChild = new Map(attendance?.map((row) => [row.child_id, row.status]));
  const mealsByChild = new Map(
    meals?.map((row) => [
      row.child_id,
      typeof row.value === "object" && row.value && "label" in row.value
        ? String(row.value.label)
        : "",
    ]),
  );
  const isPublished = schoolDay.status === "published";

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
            ROTINA OPERACIONAL · {classroom.name.toUpperCase()}
          </span>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
            Registro por exceção
          </h1>
          <p className="mt-2 text-sm text-[#69746f]">
            Aplique o padrão para a turma e ajuste somente quem teve algo diferente.
          </p>
        </div>
        <span className={`flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold ${isPublished ? "bg-[#e4eee7] text-[#47705d]" : "bg-[#f5eadc] text-[#8d684c]"}`}>
          {isPublished ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
          {isPublished ? "Dia publicado" : "Em preenchimento"}
        </span>
      </header>

      <section className="mt-8 grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#315645] p-6 text-white">
            <span className="text-[9px] font-extrabold tracking-[.14em] text-[#bfd2c7]">
              DIA LETIVO
            </span>
            <strong className="mt-3 block font-[var(--font-display)] text-2xl">
              {new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              }).format(new Date(`${schoolDay.day}T12:00:00`))}
            </strong>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <span className="rounded-xl bg-white/10 p-3">
                <Users size={18} className="text-[#efc7aa]" />
                <strong className="mt-3 block text-xl">{children.length}</strong>
                <small className="text-[#cbd9d2]">crianças elegíveis</small>
              </span>
              <span className="rounded-xl bg-white/10 p-3">
                <Utensils size={18} className="text-[#efc7aa]" />
                <strong className="mt-3 block text-xl">{meals?.length ?? 0}</strong>
                <small className="text-[#cbd9d2]">almoços registrados</small>
              </span>
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
              Registra as {children.length} crianças elegíveis como presentes.
            </p>
            <button
              disabled={isPublished}
              className="mt-4 w-full rounded-xl border border-[#98b3a4] px-4 py-3 text-xs font-bold text-[#315645] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {attendance?.length === children.length
                ? "Atualizar chamada"
                : "Marcar turma presente"}
            </button>
          </form>
        </div>

        <form action={recordMeal} className="rounded-2xl border border-[#dfe1d9] bg-white">
          <input type="hidden" name="schoolDayId" value={schoolDay.id} />
          <input type="hidden" name="schoolId" value={membership.school_id} />
          <div className="border-b border-[#ecece7] p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e6d8] text-[#986d4e]">
              <Utensils size={20} />
            </span>
            <h2 className="mt-4 font-[var(--font-display)] text-xl font-bold">
              Almoço da turma
            </h2>
            <p className="mt-1 text-xs text-[#69746f]">
              Escolha o padrão e use a coluna à direita somente para exceções.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {mealOptions.map((option) => (
                <label key={option} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="defaultStatus"
                    value={option}
                    defaultChecked={option === "Comeu bem"}
                    disabled={isPublished}
                  />
                  <span className="block rounded-xl border border-[#dfe1d9] px-3 py-3 text-center text-[10px] font-bold transition peer-checked:border-[#315645] peer-checked:bg-[#315645] peer-checked:text-white">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            {children.map((child) => (
              <div
                key={child.id}
                className="grid grid-cols-[1fr_145px] items-center gap-3 border-b border-[#efefea] px-5 py-3 last:border-0"
              >
                <input type="hidden" name="childId" value={child.id} />
                <span>
                  <strong className="block text-xs">
                    {child.first_name} {child.last_name}
                  </strong>
                  <small className="text-[9px] text-[#858d88]">
                    {child.scheduleName} · {attendanceByChild.get(child.id) ?? "chamada pendente"}
                  </small>
                </span>
                <select
                  name={`meal-${child.id}`}
                  defaultValue={mealsByChild.get(child.id) ?? ""}
                  disabled={isPublished}
                  aria-label={`Exceção de ${child.first_name}`}
                  className="h-9 rounded-lg border border-[#dfe1d9] bg-[#fafaf7] px-2 text-[10px] outline-none"
                >
                  <option value="">Sem exceção</option>
                  {mealOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f4f5f1] p-5">
            <span className="flex items-center gap-2 text-[10px] text-[#557164]">
              <Sparkles size={15} /> {children.length} registros em uma ação
            </span>
            <button
              disabled={isPublished || attendance?.length !== children.length}
              className="rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Salvar alimentação
            </button>
          </div>
        </form>
      </section>

      <form action={publishDay} className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d5ddd7] bg-[#eef3ef] p-5">
        <input type="hidden" name="schoolDayId" value={schoolDay.id} />
        <div>
          <strong className="block text-sm">Revisar e publicar</strong>
          <span className="text-xs text-[#69746f]">
            Gera um resumo imutável para cada criança presente.
          </span>
        </div>
        <button
          disabled={isPublished || meals?.length !== children.length}
          className="flex items-center gap-2 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
          {isPublished ? "Agendas publicadas" : `Publicar ${children.length} agendas`}
        </button>
      </form>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe1d9] bg-white p-8">
      <h1 className="font-[var(--font-display)] text-2xl font-bold">Nada para preencher</h1>
      <p className="mt-2 text-sm text-[#69746f]">{message}</p>
    </div>
  );
}
