import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Settings2, Users } from "lucide-react";
import { getCurrentContext } from "../../lib/auth";
import {
  updateClassroomConfiguration,
  updateEnrollmentSchedule,
  updateRoutineConfiguration,
} from "../actions";

const categoryLabels = {
  attendance: "Presença",
  meal: "Alimentação",
  hydration: "Hidratação",
  sleep: "Sono",
  hygiene: "Higiene",
  activity: "Atividade",
  note: "Observação",
} as const;

type SearchParams = Promise<{ classroom?: string }>;

export default async function DirectionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestedClassroom = (await searchParams).classroom;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const [
    { data: days, error },
    { count: memberCount },
    { count: summaryCount },
    { count: viewCount },
    { count: urgentOccurrenceCount },
    { data: classrooms },
  ] = await Promise.all([
    supabase
      .from("school_days")
      .select("id, day, status, published_at, classrooms(name)")
      .eq("school_id", membership.school_id)
      .order("day", { ascending: false })
      .limit(6),
    supabase
      .from("school_memberships")
      .select("*", { count: "exact", head: true })
      .eq("school_id", membership.school_id)
      .eq("status", "active"),
    supabase
      .from("daily_summaries")
      .select("*", { count: "exact", head: true })
      .eq("school_id", membership.school_id),
    supabase
      .from("summary_views")
      .select("*", { count: "exact", head: true })
      .eq("school_id", membership.school_id),
    supabase
      .from("occurrences")
      .select("*", { count: "exact", head: true })
      .eq("school_id", membership.school_id)
      .eq("severity", "urgent")
      .neq("status", "closed"),
    supabase
      .from("classrooms")
      .select("id, name, age_group, default_start, default_end")
      .eq("school_id", membership.school_id)
      .eq("active", true)
      .order("name"),
  ]);
  if (error) throw error;

  const classroom =
    classrooms?.find((item) => item.id === requestedClassroom) ??
    classrooms?.[0];
  const [{ data: configurations }, { data: enrollments }] = classroom
    ? await Promise.all([
        supabase
          .from("routine_configurations")
          .select("category, enabled, required")
          .eq("classroom_id", classroom.id),
        supabase
          .from("enrollments")
          .select("id, schedule_name, expected_start, expected_end, children(first_name, last_name)")
          .eq("classroom_id", classroom.id)
          .eq("status", "active")
          .order("created_at"),
      ])
    : [{ data: [] }, { data: [] }];
  const configurationMap = new Map(configurations?.map((item) => [item.category, item]));

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          PAINEL DA DIREÇÃO
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          O que precisa de atenção.
        </h1>
        <p className="mt-2 text-sm text-[#69746f]">
          Dados reais do projeto SomaMais, protegidos pelas políticas da escola.
        </p>
      </header>

      <section className="mt-8 grid gap-3 md:grid-cols-4">
        <Metric icon={<Users size={20} />} label="Acessos ativos" value={memberCount ?? 0} />
        <Metric icon={<CheckCircle2 size={20} />} label="Resumos publicados" value={summaryCount ?? 0} />
        <Metric icon={<Eye size={20} />} label="Visualizações registradas" value={viewCount ?? 0} />
        <Link href="/app/direction/occurrences">
          <Metric icon={<AlertTriangle size={20} />} label="Ocorrências urgentes" value={urgentOccurrenceCount ?? 0} />
        </Link>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#dfe1d9] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8e8e2] px-5 py-4">
          <div>
            <h2 className="font-[var(--font-display)] text-lg font-bold">Rotina das turmas</h2>
            <p className="text-xs text-[#7c8680]">Acompanhamento do primeiro corte vertical.</p>
          </div>
          <span className="rounded-full bg-[#eef3ef] px-3 py-1.5 text-[10px] font-bold text-[#42715d]">
            RLS ativo
          </span>
        </div>
        <div className="grid grid-cols-[1fr_.8fr_.8fr] bg-[#f3f3ef] px-5 py-3 text-[9px] font-extrabold tracking-[.1em] text-[#7c8680]">
          <span>Turma</span><span>Data</span><span>Status</span>
        </div>
        {days?.map((day) => {
          const classroom = Array.isArray(day.classrooms) ? day.classrooms[0] : day.classrooms;
          return (
            <div key={day.id} className="grid grid-cols-[1fr_.8fr_.8fr] items-center border-t border-[#ecece7] px-5 py-4 text-xs">
              <strong>{classroom?.name}</strong>
              <span className="text-[#69746f]">{new Intl.DateTimeFormat("pt-BR").format(new Date(`${day.day}T12:00:00`))}</span>
              <span className={`flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${day.status === "published" ? "bg-[#e4eee7] text-[#47705d]" : "bg-[#f6e8d9] text-[#936748]"}`}>
                {day.status === "published" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                {day.status === "published" ? "Publicada" : "Em andamento"}
              </span>
            </div>
          );
        })}
        {!days?.length && (
          <div className="flex items-center gap-3 p-6 text-sm text-[#69746f]">
            <AlertTriangle size={20} /> Nenhum dia letivo cadastrado.
          </div>
        )}
      </section>

      {classrooms && classrooms.length > 1 ? (
        <nav aria-label="Selecionar turma" className="mt-8 flex flex-wrap gap-2">
          {classrooms.map((item) => (
            <Link
              key={item.id}
              href={`/app/direction?classroom=${item.id}`}
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${classroom?.id === item.id ? "border-[#315645] bg-[#315645] text-white" : "border-[#dfe1d9] bg-white text-[#557164]"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {classroom ? (
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5eee8] text-[#42715d]">
              <Settings2 size={20} />
            </span>
            <div>
              <h2 className="font-[var(--font-display)] text-xl font-bold">CRM da rotina</h2>
              <p className="text-xs text-[#7c8680]">A escola decide o que aparece para a equipe.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <form action={updateClassroomConfiguration} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
              <input type="hidden" name="classroomId" value={classroom.id} />
              <input type="hidden" name="schoolId" value={membership.school_id} />
              <strong className="text-sm">Configuração da turma</strong>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Nome">
                  <input name="name" defaultValue={classroom.name} required className="input" />
                </Field>
                <Field label="Faixa etária">
                  <input name="ageGroup" defaultValue={classroom.age_group ?? ""} className="input" />
                </Field>
                <Field label="Entrada padrão">
                  <input name="defaultStart" type="time" defaultValue={classroom.default_start.slice(0, 5)} required className="input" />
                </Field>
                <Field label="Saída padrão">
                  <input name="defaultEnd" type="time" defaultValue={classroom.default_end.slice(0, 5)} required className="input" />
                </Field>
              </div>
              <button className="mt-4 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white">
                Salvar turma
              </button>
            </form>

            <form action={updateRoutineConfiguration} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
              <input type="hidden" name="classroomId" value={classroom.id} />
              <input type="hidden" name="schoolId" value={membership.school_id} />
              <strong className="text-sm">Módulos exibidos</strong>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(categoryLabels).map(([category, label]) => {
                  const configuration = configurationMap.get(category as keyof typeof categoryLabels);
                  return (
                    <div key={category} className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e5df] p-3">
                      <span className="text-xs font-bold">{label}</span>
                      <span className="flex gap-3 text-[10px] text-[#68746e]">
                        <label className="flex items-center gap-1.5">
                          <input name={`enabled-${category}`} type="checkbox" defaultChecked={configuration?.enabled ?? false} />
                          Exibir
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input name={`required-${category}`} type="checkbox" defaultChecked={configuration?.required ?? false} />
                          Obrigatório
                        </label>
                      </span>
                    </div>
                  );
                })}
              </div>
              <button className="mt-4 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white">
                Aplicar rotina
              </button>
            </form>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#dfe1d9] bg-white">
            <div className="border-b border-[#e8e8e2] px-5 py-4">
              <strong className="text-sm">Jornadas das crianças</strong>
              <p className="mt-1 text-xs text-[#7c8680]">A jornada determina quem aparece em cada turno.</p>
            </div>
            {enrollments?.map((enrollment) => {
              const child = Array.isArray(enrollment.children) ? enrollment.children[0] : enrollment.children;
              const scheduleValue =
                enrollment.schedule_name === "Manhã"
                  ? "morning"
                  : enrollment.schedule_name === "Tarde"
                    ? "afternoon"
                    : enrollment.schedule_name === "Integral"
                      ? "full"
                      : "custom";
              return (
                <form key={enrollment.id} action={updateEnrollmentSchedule} className="grid gap-3 border-b border-[#ecece7] px-5 py-4 last:border-0 md:grid-cols-[1fr_150px_120px_120px_auto] md:items-end">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="schoolId" value={membership.school_id} />
                  <span className="pb-2">
                    <strong className="block text-xs">{child?.first_name} {child?.last_name}</strong>
                    <small className="text-[9px] text-[#858d88]">{enrollment.schedule_name}</small>
                  </span>
                  <Field label="Jornada">
                    <select name="schedule" defaultValue={scheduleValue} className="input">
                      <option value="morning">Manhã</option>
                      <option value="afternoon">Tarde</option>
                      <option value="full">Integral</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </Field>
                  <Field label="Entrada">
                    <input name="expectedStart" type="time" defaultValue={enrollment.expected_start.slice(0, 5)} className="input" />
                  </Field>
                  <Field label="Saída">
                    <input name="expectedEnd" type="time" defaultValue={enrollment.expected_end.slice(0, 5)} className="input" />
                  </Field>
                  <button className="h-10 rounded-xl border border-[#98b3a4] px-4 text-xs font-bold text-[#315645]">
                    Atualizar
                  </button>
                </form>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#758079]">{label}</span>
      {children}
    </label>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5eee8] text-[#42715d]">{icon}</span>
      <strong className="mt-5 block font-[var(--font-display)] text-3xl">{value}</strong>
      <span className="text-xs text-[#69746f]">{label}</span>
    </div>
  );
}
