import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Plus, School, Users } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { createClassroom, createEnrolledChild } from "../../actions";
import { ImportRoster } from "./import-roster";

type SearchParams = Promise<{ classroom?: string }>;

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestedClassroom = (await searchParams).classroom;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const [{ data: classrooms }, { data: teachers }] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, name, age_group, default_start, default_end")
      .eq("school_id", membership.school_id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("school_memberships")
      .select("id, user_id, profiles(full_name)")
      .eq("school_id", membership.school_id)
      .eq("role", "teacher")
      .eq("status", "active"),
  ]);
  const selected =
    classrooms?.find((classroom) => classroom.id === requestedClassroom) ??
    classrooms?.[0];

  const { data: enrollments } = selected
    ? await supabase
        .from("enrollments")
        .select("id, schedule_name, expected_start, expected_end, children(first_name, last_name, birth_date)")
        .eq("classroom_id", selected.id)
        .eq("status", "active")
        .order("created_at")
    : { data: [] };

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          PESSOAS E TURMAS
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Estrutura da escola
        </h1>
        <p className="mt-2 text-sm text-[#69746f]">
          Cadastre turmas e matrículas individualmente ou por arquivo.
        </p>
      </header>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <form action={createClassroom} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <strong className="flex items-center gap-2 text-sm"><School size={17} /> Nova turma</strong>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nome"><input name="name" required placeholder="Ex.: Berçário II" className="input" /></Field>
            <Field label="Faixa etária"><input name="ageGroup" placeholder="Ex.: 1 a 2 anos" className="input" /></Field>
            <Field label="Entrada padrão"><input name="defaultStart" type="time" required defaultValue="07:30" className="input" /></Field>
            <Field label="Saída padrão"><input name="defaultEnd" type="time" required defaultValue="17:30" className="input" /></Field>
            <div className="sm:col-span-2">
              <Field label="Professora responsável">
                <select name="teacherMembershipId" className="input">
                  <option value="">Atribuir depois</option>
                  {teachers?.map((teacher) => {
                    const profile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles;
                    return <option key={teacher.id} value={teacher.id}>{profile?.full_name ?? "Professora"}</option>;
                  })}
                </select>
              </Field>
            </div>
          </div>
          <button className="mt-4 flex items-center gap-2 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white">
            <Plus size={15} /> Criar turma
          </button>
        </form>

        <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <strong className="flex items-center gap-2 text-sm"><BookOpen size={17} /> Turmas ativas</strong>
          <div className="mt-4 grid gap-2">
            {classrooms?.map((classroom) => (
              <Link
                key={classroom.id}
                href={`/app/direction/registry?classroom=${classroom.id}`}
                className={`flex items-center justify-between rounded-xl border p-3 text-xs ${selected?.id === classroom.id ? "border-[#315645] bg-[#eef3ef]" : "border-[#e5e5df]"}`}
              >
                <span><strong className="block">{classroom.name}</strong><small className="text-[#7c8680]">{classroom.age_group}</small></span>
                <span>{classroom.default_start.slice(0, 5)}–{classroom.default_end.slice(0, 5)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {selected ? (
        <section className="mt-5 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
          <form action={createEnrolledChild} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
            <input type="hidden" name="classroomId" value={selected.id} />
            <strong className="flex items-center gap-2 text-sm"><Users size={17} /> Nova matrícula · {selected.name}</strong>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nome"><input name="firstName" required className="input" /></Field>
              <Field label="Sobrenome"><input name="lastName" required className="input" /></Field>
              <Field label="Nascimento"><input name="birthDate" type="date" required className="input" /></Field>
              <Field label="Jornada">
                <select name="schedule" defaultValue="full" className="input">
                  <option value="morning">Manhã</option>
                  <option value="afternoon">Tarde</option>
                  <option value="full">Integral</option>
                  <option value="custom">Personalizado</option>
                </select>
              </Field>
              <Field label="Entrada personalizada"><input name="expectedStart" type="time" defaultValue="07:30" required className="input" /></Field>
              <Field label="Saída personalizada"><input name="expectedEnd" type="time" defaultValue="17:30" required className="input" /></Field>
            </div>
            <button className="mt-4 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white">Cadastrar criança</button>
          </form>
          <ImportRoster classroomId={selected.id} />
        </section>
      ) : null}

      {selected ? (
        <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe1d9] bg-white">
          <div className="border-b border-[#e8e8e2] px-5 py-4">
            <strong className="text-sm">Matrículas em {selected.name}</strong>
            <p className="mt-1 text-xs text-[#7c8680]">{enrollments?.length ?? 0} crianças ativas.</p>
          </div>
          {enrollments?.map((enrollment) => {
            const child = Array.isArray(enrollment.children) ? enrollment.children[0] : enrollment.children;
            return (
              <div key={enrollment.id} className="grid grid-cols-[1fr_.7fr_.7fr] border-b border-[#ecece7] px-5 py-3 text-xs last:border-0">
                <strong>{child?.first_name} {child?.last_name}</strong>
                <span>{enrollment.schedule_name}</span>
                <span>{enrollment.expected_start.slice(0, 5)}–{enrollment.expected_end.slice(0, 5)}</span>
              </div>
            );
          })}
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
