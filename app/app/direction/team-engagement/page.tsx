import { redirect } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  ListChecks,
  UserRoundCheck,
} from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

type SearchParams = Promise<{
  teacher?: string;
  classroom?: string;
  period?: "week" | "month";
}>;

export default async function TeamEngagementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const period = filters.period === "month" ? "month" : "week";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period === "month" ? 29 : 6));
  const startDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(start);

  const [
    { data: teachers },
    { data: classrooms },
    { data: assignments },
    { data: days },
    { data: entries },
    { data: handoffs },
  ] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("id, user_id, profiles(full_name)")
      .eq("school_id", membership.school_id)
      .eq("role", "teacher")
      .eq("status", "active"),
    supabase
      .from("classrooms")
      .select("id, name, default_end")
      .eq("school_id", membership.school_id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("classroom_staff")
      .select("membership_id, classroom_id")
      .eq("school_id", membership.school_id),
    supabase
      .from("school_days")
      .select("id, classroom_id, day, status, published_at, published_by")
      .eq("school_id", membership.school_id)
      .gte("day", startDate)
      .order("day"),
    supabase
      .from("routine_entries")
      .select("school_day_id, recorded_by")
      .eq("school_id", membership.school_id)
      .gte("recorded_at", start.toISOString()),
    supabase
      .from("shift_handoffs")
      .select("id, classroom_id, created_by, status")
      .eq("school_id", membership.school_id)
      .gte("created_at", start.toISOString()),
  ]);

  const selectedClassroom =
    filters.classroom && classrooms?.some((item) => item.id === filters.classroom)
      ? filters.classroom
      : "";
  const selectedTeacher =
    filters.teacher && teachers?.some((item) => item.id === filters.teacher)
      ? filters.teacher
      : "";
  const classroomMap = new Map(classrooms?.map((item) => [item.id, item]));
  const entryDaysByUser = new Map<string, Set<string>>();
  const entryCountByUser = new Map<string, number>();
  for (const entry of entries ?? []) {
    entryCountByUser.set(
      entry.recorded_by,
      (entryCountByUser.get(entry.recorded_by) ?? 0) + 1,
    );
    const set = entryDaysByUser.get(entry.recorded_by) ?? new Set<string>();
    set.add(entry.school_day_id);
    entryDaysByUser.set(entry.recorded_by, set);
  }

  const rows = (teachers ?? [])
    .filter((teacher) => !selectedTeacher || teacher.id === selectedTeacher)
    .map((teacher) => {
      const assignedClassrooms = new Set(
        (assignments ?? [])
          .filter((assignment) => assignment.membership_id === teacher.id)
          .map((assignment) => assignment.classroom_id),
      );
      const expectedDays = (days ?? []).filter(
        (day) =>
          assignedClassrooms.has(day.classroom_id) &&
          (!selectedClassroom || day.classroom_id === selectedClassroom),
      );
      const participatedDays = expectedDays.filter((day) =>
        entryDaysByUser.get(teacher.user_id)?.has(day.id),
      );
      const publishedDays = expectedDays.filter(
        (day) => day.status === "published",
      );
      const publishedByTeacher = expectedDays.filter(
        (day) => day.published_by === teacher.user_id,
      );
      const onTime = publishedByTeacher.filter((day) => {
        if (!day.published_at) return false;
        const classroom = classroomMap.get(day.classroom_id);
        if (!classroom) return false;
        const deadline = new Date(`${day.day}T${classroom.default_end}-03:00`);
        deadline.setHours(deadline.getHours() + 1);
        return new Date(day.published_at) <= deadline;
      }).length;
      const teacherHandoffs = (handoffs ?? []).filter(
        (handoff) =>
          handoff.created_by === teacher.user_id &&
          (!selectedClassroom || handoff.classroom_id === selectedClassroom),
      );
      const profile = Array.isArray(teacher.profiles)
        ? teacher.profiles[0]
        : teacher.profiles;
      return {
        id: teacher.id,
        name: profile?.full_name ?? "Professora",
        expected: expectedDays.length,
        participated: participatedDays.length,
        published: publishedDays.length,
        publishedByTeacher: publishedByTeacher.length,
        onTime,
        entries: entryCountByUser.get(teacher.user_id) ?? 0,
        openHandoffs: teacherHandoffs.filter((item) => item.status === "open")
          .length,
      };
    });

  const expectedTotal = rows.reduce((sum, row) => sum + row.expected, 0);
  const participatedTotal = rows.reduce(
    (sum, row) => sum + row.participated,
    0,
  );
  const publishedTotal = rows.reduce((sum, row) => sum + row.published, 0);
  const openHandoffsTotal = rows.reduce(
    (sum, row) => sum + row.openHandoffs,
    0,
  );

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          CUMPRIMENTO DA ROTINA
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Engajamento da equipe
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Tendências operacionais comparadas somente ao trabalho esperado em
          cada turma. A leitura das famílias não entra nesta análise.
        </p>
      </header>

      <form className="mt-7 grid gap-3 rounded-2xl border border-[#dfe1d9] bg-white p-4 sm:grid-cols-[1fr_1fr_160px_auto]">
        <Filter label="Professora">
          <select name="teacher" defaultValue={selectedTeacher} className="input">
            <option value="">Todas</option>
            {teachers?.map((teacher) => {
              const profile = Array.isArray(teacher.profiles)
                ? teacher.profiles[0]
                : teacher.profiles;
              return <option key={teacher.id} value={teacher.id}>{profile?.full_name}</option>;
            })}
          </select>
        </Filter>
        <Filter label="Turma">
          <select name="classroom" defaultValue={selectedClassroom} className="input">
            <option value="">Todas</option>
            {classrooms?.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
          </select>
        </Filter>
        <Filter label="Período">
          <select name="period" defaultValue={period} className="input">
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
          </select>
        </Filter>
        <button className="h-10 self-end rounded-xl bg-[#315645] px-5 text-xs font-bold text-white">
          Aplicar
        </button>
      </form>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<UserRoundCheck size={19} />} label="Dias com participação" value={`${participatedTotal}/${expectedTotal}`} />
        <Metric icon={<CheckCircle2 size={19} />} label="Agendas concluídas" value={`${publishedTotal}/${expectedTotal}`} />
        <Metric icon={<ListChecks size={19} />} label="Registros realizados" value={String(rows.reduce((sum, row) => sum + row.entries, 0))} />
        <Metric icon={<AlertCircle size={19} />} label="Passagens pendentes" value={String(openHandoffsTotal)} warning={openHandoffsTotal > 0} />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe1d9] bg-white">
        <div className="border-b border-[#e8e8e2] p-5">
          <h2 className="font-[var(--font-display)] text-xl font-bold">Visão por professora</h2>
          <p className="mt-1 text-xs text-[#7c8680]">Sem notas, rankings ou rótulos automáticos.</p>
        </div>
        <div className="hidden grid-cols-[1.2fr_repeat(5,.8fr)] bg-[#f3f3ef] px-5 py-3 text-[9px] font-extrabold tracking-[.08em] text-[#7c8680] md:grid">
          <span>Professora</span><span>Participação</span><span>Concluídas</span><span>No horário</span><span>Registros</span><span>Pendências</span>
        </div>
        {rows.map((row) => (
          <article key={row.id} className="grid gap-3 border-t border-[#ecece7] px-5 py-4 text-xs md:grid-cols-[1.2fr_repeat(5,.8fr)] md:items-center">
            <strong>{row.name}</strong>
            <Cell label="Participação">{row.participated}/{row.expected}</Cell>
            <Cell label="Concluídas">{row.published}/{row.expected}</Cell>
            <Cell label="No horário"><Clock3 size={12} /> {row.onTime}/{row.publishedByTeacher}</Cell>
            <Cell label="Registros">{row.entries}</Cell>
            <Cell label="Pendências"><span className={row.openHandoffs ? "font-bold text-[#a34336]" : "text-[#315645]"}>{row.openHandoffs}</span></Cell>
          </article>
        ))}
        {!rows.length ? <div className="p-8 text-center text-xs text-[#7c8680]"><BarChart3 className="mx-auto mb-2" size={22} /> Nenhuma professora ativa neste filtro.</div> : null}
      </section>
      <p className="mt-4 text-[10px] leading-5 text-[#7c8680]">
        “No horário” considera até uma hora após a saída padrão da turma.
        Visualizações dos responsáveis não são atribuídas à professora.
      </p>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-[10px] font-bold text-[#56635d]">{label}{children}</label>;
}
function Metric({ icon, label, value, warning = false }: { icon: React.ReactNode; label: string; value: string; warning?: boolean }) {
  return <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${warning ? "bg-[#fff0eb] text-[#a34336]" : "bg-[#e5eee8] text-[#42715d]"}`}>{icon}</span><strong className="mt-4 block font-[var(--font-display)] text-3xl">{value}</strong><span className="text-xs text-[#69746f]">{label}</span></div>;
}
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return <span className="flex items-center gap-1 text-[#56635d]"><small className="font-bold md:hidden">{label}:</small>{children}</span>;
}
