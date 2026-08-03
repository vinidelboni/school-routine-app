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
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0759bd] via-[#0b67c9] to-[#148fe1] px-6 py-7 text-white shadow-[0_18px_45px_rgba(7,89,189,.2)] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[44px] border-white/[.06]" />
        <div className="relative">
          <span className="text-[10px] font-extrabold tracking-[.16em] text-[#bfe2ff]">
            PAINEL DA DIREÇÃO
          </span>
          <h1 className="mt-2 max-w-2xl font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
            O que precisa de atenção.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#d8ebff]">
            Acompanhe as pendências da escola e acesse rapidamente cada operação.
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-3 md:grid-cols-4">
        <Metric icon={<Users size={20} />} label="Acessos ativos" value={memberCount ?? 0} />
        <Metric icon={<CheckCircle2 size={20} />} label="Resumos publicados" value={summaryCount ?? 0} />
        <Metric icon={<Eye size={20} />} label="Visualizações registradas" value={viewCount ?? 0} />
        <Link href="/app/direction/occurrences">
          <Metric icon={<AlertTriangle size={20} />} label="Ocorrências urgentes" value={urgentOccurrenceCount ?? 0} />
        </Link>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#dce6f2] bg-white">
        <div className="flex items-center justify-between border-b border-[#e7edf4] px-5 py-4">
          <div>
            <h2 className="font-[var(--font-display)] text-lg font-bold">Rotina das turmas</h2>
            <p className="text-xs text-[#6f8299]">Acompanhamento do primeiro corte vertical.</p>
          </div>
          <span className="rounded-full bg-[#edf5fd] px-3 py-1.5 text-[10px] font-bold text-[#176bc2]">
            RLS ativo
          </span>
        </div>
        <div className="grid grid-cols-[1fr_.8fr_.8fr] bg-[#f3f7fb] px-5 py-3 text-[9px] font-extrabold tracking-[.1em] text-[#6f8299]">
          <span>Turma</span><span>Data</span><span>Status</span>
        </div>
        {days?.map((day) => {
          const classroom = Array.isArray(day.classrooms) ? day.classrooms[0] : day.classrooms;
          return (
            <div key={day.id} className="grid grid-cols-[1fr_.8fr_.8fr] items-center border-t border-[#e9eef5] px-5 py-4 text-xs">
              <strong>{classroom?.name}</strong>
              <span className="text-[#61758d]">{new Intl.DateTimeFormat("pt-BR").format(new Date(`${day.day}T12:00:00`))}</span>
              <span className={`flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${day.status === "published" ? "bg-[#e4eee7] text-[#176bc2]" : "bg-[#f6e8d9] text-[#936748]"}`}>
                {day.status === "published" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                {day.status === "published" ? "Publicada" : "Em andamento"}
              </span>
            </div>
          );
        })}
        {!days?.length && (
          <div className="flex items-center gap-3 p-6 text-sm text-[#61758d]">
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
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${classroom?.id === item.id ? "border-[#0759bd] bg-[#0759bd] text-white" : "border-[#dce6f2] bg-white text-[#386b9f]"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {classroom ? (
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2ff] text-[#176bc2]">
              <Settings2 size={20} />
            </span>
            <div>
              <h2 className="font-[var(--font-display)] text-xl font-bold">CRM da rotina</h2>
              <p className="text-xs text-[#6f8299]">A escola decide o que aparece para a equipe.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <form action={updateClassroomConfiguration} className="rounded-2xl border border-[#dce6f2] bg-white p-5">
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
              <button className="mt-4 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white">
                Salvar turma
              </button>
            </form>

            <form action={updateRoutineConfiguration} className="rounded-2xl border border-[#dce6f2] bg-white p-5">
              <input type="hidden" name="classroomId" value={classroom.id} />
              <input type="hidden" name="schoolId" value={membership.school_id} />
              <strong className="text-sm">Módulos exibidos</strong>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(categoryLabels).map(([category, label]) => {
                  const configuration = configurationMap.get(category as keyof typeof categoryLabels);
                  return (
                    <div key={category} className="flex items-center justify-between gap-3 rounded-xl border border-[#e3eaf2] p-3">
                      <span className="text-xs font-bold">{label}</span>
                      <span className="flex gap-3 text-[10px] text-[#61758d]">
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
              <button className="mt-4 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white">
                Aplicar rotina
              </button>
            </form>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce6f2] bg-white">
            <div className="border-b border-[#e7edf4] px-5 py-4">
              <strong className="text-sm">Jornadas das crianças</strong>
              <p className="mt-1 text-xs text-[#6f8299]">A jornada determina quem aparece em cada turno.</p>
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
                <form key={enrollment.id} action={updateEnrollmentSchedule} className="grid gap-3 border-b border-[#e9eef5] px-5 py-4 last:border-0 md:grid-cols-[1fr_150px_120px_120px_auto] md:items-end">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="schoolId" value={membership.school_id} />
                  <span className="pb-2">
                    <strong className="block text-xs">{child?.first_name} {child?.last_name}</strong>
                    <small className="text-[9px] text-[#75869a]">{enrollment.schedule_name}</small>
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
                  <button className="h-10 rounded-xl border border-[#9cc4eb] px-4 text-xs font-bold text-[#0759bd]">
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
      <span className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#607994]">{label}</span>
      {children}
    </label>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="group h-full rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)] transition hover:-translate-y-0.5 hover:border-[#b5d3ef] hover:shadow-[0_14px_30px_rgba(27,66,112,.1)]">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#eaf5ff] to-[#dcecff] text-[#176bc2] transition group-hover:from-[#148fe1] group-hover:to-[#0759bd] group-hover:text-white">{icon}</span>
      <strong className="mt-5 block font-[var(--font-display)] text-3xl text-[#102a4c]">{value}</strong>
      <span className="text-xs text-[#61758d]">{label}</span>
    </div>
  );
}
