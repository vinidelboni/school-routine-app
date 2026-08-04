import { redirect } from "next/navigation";
import { CheckCircle2, School, UserRoundCheck, Users } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { createClassroom, createEnrolledChild, updateClassroomTeachers } from "../../actions";
import { ClassroomSwitcher } from "./classroom-switcher";
import { ImportRoster } from "./import-roster";
import { SubmitButton } from "./submit-button";

type SearchParams = Promise<{ classroom?: string; success?: string }>;

type Classroom = {
  id: string;
  name: string;
  age_group: string | null;
  default_start: string;
  default_end: string;
};

type Enrollment = {
  id: string;
  classroom_id: string;
  schedule_name: string;
  expected_start: string;
  expected_end: string;
  children:
    | { first_name: string; last_name: string; birth_date: string | null }[]
    | { first_name: string; last_name: string; birth_date: string | null }
    | null;
};

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
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

  const classroomIds = classrooms?.map((classroom) => classroom.id) ?? [];
  const selected =
    classrooms?.find((classroom) => classroom.id === query.classroom) ??
    classrooms?.[0];
  const [{ data: enrollments }, { data: classroomStaff }] = classroomIds.length
    ? await Promise.all([supabase
        .from("enrollments")
        .select(
          "id, classroom_id, schedule_name, expected_start, expected_end, children(first_name, last_name, birth_date)",
        )
        .in("classroom_id", classroomIds)
        .eq("status", "active")
        .order("created_at"), supabase
        .from("classroom_staff")
        .select("classroom_id, membership_id")
        .in("classroom_id", classroomIds)])
    : [{ data: [] }, { data: [] }];

  const teacherOptions = (teachers ?? []).map((teacher) => {
    const teacherProfile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles;
    return { id: teacher.id, name: teacherProfile?.full_name ?? "Professora" };
  });

  const classroomForm = (
    <form
      action={createClassroom}
      className="rounded-2xl border border-[#dce6f2] bg-white p-5"
    >
      <strong className="flex items-center gap-2 text-sm">
        <School size={17} /> Nova turma
      </strong>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <input
            name="name"
            required
            placeholder="Ex.: Berçário II"
            className="input"
          />
        </Field>
        <Field label="Faixa etária">
          <input
            name="ageGroup"
            placeholder="Ex.: 1 a 2 anos"
            className="input"
          />
        </Field>
        <Field label="Entrada padrão">
          <input
            name="defaultStart"
            type="time"
            required
            defaultValue="07:30"
            className="input"
          />
        </Field>
        <Field label="Saída padrão">
          <input
            name="defaultEnd"
            type="time"
            required
            defaultValue="17:30"
            className="input"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Professora responsável">
            <select name="teacherMembershipId" className="input">
              <option value="">Atribuir depois</option>
              {teachers?.map((teacher) => {
                const profile = Array.isArray(teacher.profiles)
                  ? teacher.profiles[0]
                  : teacher.profiles;
                return (
                  <option key={teacher.id} value={teacher.id}>
                    {profile?.full_name ?? "Professora"}
                  </option>
                );
              })}
            </select>
          </Field>
        </div>
      </div>
      <SubmitButton
        idleLabel="Criar turma"
        pendingLabel="Criando turma..."
        className="mt-4 flex items-center gap-2 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white"
      />
    </form>
  );

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">
          PESSOAS E TURMAS
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Estrutura da escola
        </h1>
        <p className="mt-2 text-sm text-[#61758d]">
          Cadastre turmas e matrículas individualmente ou por arquivo.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd] shadow-sm"
        >
          <CheckCircle2 size={22} className="mt-0.5 shrink-0" />
          <span>
            <strong className="block text-sm">
              {query.success === "classroom-created"
                ? "Turma criada com sucesso!"
                : query.success === "teachers-updated"
                  ? "Equipe da turma atualizada!"
                  : "Criança cadastrada com sucesso!"}
            </strong>
            <small className="mt-1 block text-[#386b9f]">
              {query.success === "classroom-created"
                ? "A turma já está disponível nos seletores da direção e da professora responsável."
                : query.success === "teachers-updated"
                  ? "As professoras vinculadas já aparecem no perfil das famílias desta turma."
                  : "A matrícula já aparece na turma selecionada e na rotina correspondente."}
            </small>
          </span>
        </div>
      ) : null}

      <ClassroomSwitcher
        initialClassroomId={selected?.id}
        classroomForm={classroomForm}
        classrooms={(classrooms ?? []).map((classroom) => ({
          id: classroom.id,
          name: classroom.name,
          ageGroup: classroom.age_group,
          defaultStart: classroom.default_start,
          defaultEnd: classroom.default_end,
          content: (
            <ClassroomContent
              key={classroom.id}
              classroom={classroom}
              enrollments={(enrollments ?? []).filter(
                (enrollment) => enrollment.classroom_id === classroom.id,
              )}
              teachers={teacherOptions}
              assignedTeacherIds={(classroomStaff ?? [])
                .filter((staff) => staff.classroom_id === classroom.id)
                .map((staff) => staff.membership_id)}
            />
          ),
        }))}
      />
    </div>
  );
}

function ClassroomContent({
  classroom,
  enrollments,
  teachers,
  assignedTeacherIds,
}: {
  classroom: Classroom;
  enrollments: Enrollment[];
  teachers: { id: string; name: string }[];
  assignedTeacherIds: string[];
}) {
  return (
    <>
      <form action={updateClassroomTeachers} className="mt-5 rounded-2xl border border-[#cfe0f3] bg-[#f5f9ff] p-5">
        <input type="hidden" name="classroomId" value={classroom.id} />
        <strong className="flex items-center gap-2 text-sm text-[#12345b]">
          <UserRoundCheck size={18} className="text-[#0759bd]" /> Equipe de {classroom.name}
        </strong>
        <p className="mt-1 text-xs text-[#61758d]">Selecione todas as professoras que acompanham esta turma.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <label key={teacher.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d7e4f2] bg-white px-4 py-3 text-xs font-semibold">
              <input type="checkbox" name="teacherMembershipId" value={teacher.id} defaultChecked={assignedTeacherIds.includes(teacher.id)} className="h-4 w-4 accent-[#0759bd]" />
              {teacher.name}
            </label>
          ))}
          {!teachers.length ? <span className="text-xs text-[#6f8299]">Cadastre uma professora ativa para montar a equipe.</span> : null}
        </div>
        <SubmitButton idleLabel="Salvar equipe" pendingLabel="Salvando equipe..." className="mt-4 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white" />
      </form>
      <section className="mt-5 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <form
          action={createEnrolledChild}
          className="rounded-2xl border border-[#dce6f2] bg-white p-5"
        >
          <input type="hidden" name="classroomId" value={classroom.id} />
          <strong className="flex items-center gap-2 text-sm">
            <Users size={17} /> Nova matrícula · {classroom.name}
          </strong>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <input name="firstName" required className="input" />
            </Field>
            <Field label="Sobrenome">
              <input name="lastName" required className="input" />
            </Field>
            <Field label="Nascimento">
              <input name="birthDate" type="date" required className="input" />
            </Field>
            <Field label="Jornada">
              <select name="schedule" defaultValue="full" className="input">
                <option value="morning">Manhã</option>
                <option value="afternoon">Tarde</option>
                <option value="full">Integral</option>
                <option value="custom">Personalizado</option>
              </select>
            </Field>
            <Field label="Entrada personalizada">
              <input
                name="expectedStart"
                type="time"
                defaultValue="07:30"
                required
                className="input"
              />
            </Field>
            <Field label="Saída personalizada">
              <input
                name="expectedEnd"
                type="time"
                defaultValue="17:30"
                required
                className="input"
              />
            </Field>
          </div>
          <SubmitButton
            idleLabel="Cadastrar criança"
            pendingLabel="Cadastrando criança..."
            className="mt-4 flex items-center gap-2 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white"
          />
        </form>
        <ImportRoster classroomId={classroom.id} />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#dce6f2] bg-white">
        <div className="border-b border-[#e7edf4] px-5 py-4">
          <strong className="text-sm">Matrículas em {classroom.name}</strong>
          <p className="mt-1 text-xs text-[#6f8299]">
            {enrollments.length} crianças ativas.
          </p>
        </div>
        {enrollments.map((enrollment) => {
          const child = Array.isArray(enrollment.children)
            ? enrollment.children[0]
            : enrollment.children;
          return (
            <div
              key={enrollment.id}
              className="grid grid-cols-[1fr_.7fr_.7fr] border-b border-[#e9eef5] px-5 py-3 text-xs last:border-0"
            >
              <strong>
                {child?.first_name} {child?.last_name}
              </strong>
              <span>{enrollment.schedule_name}</span>
              <span>
                {enrollment.expected_start.slice(0, 5)}–
                {enrollment.expected_end.slice(0, 5)}
              </span>
            </div>
          );
        })}
      </section>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#607994]">
        {label}
      </span>
      {children}
    </label>
  );
}
