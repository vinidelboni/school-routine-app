import { redirect } from "next/navigation";
import { BookOpenCheck, CalendarDays, Camera, LogOut, Mail, ShieldCheck, UsersRound } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { logout } from "../../../login/actions";

export default async function TeacherProfilePage() {
  const { supabase, user, membership, profile } = await getCurrentContext();
  if (membership.role !== "teacher") redirect("/app");
  const school = Array.isArray(membership.schools) ? membership.schools[0] : membership.schools;
  const { data: assignments, error } = await supabase.from("classroom_staff").select("classroom_id, classrooms(name, age_group)").eq("membership_id", membership.id).order("created_at");
  if (error) throw error;

  return (
    <div>
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0759bd] via-[#0b6ed1] to-[#19a5e9] px-6 py-7 text-white shadow-[0_18px_45px_rgba(7,89,189,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[40px] border-white/[.07]" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 font-[var(--font-display)] text-xl font-black backdrop-blur">{profile?.full_name?.trim().charAt(0).toUpperCase() || "P"}</span>
          <span className="min-w-0"><small className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#c4e6ff]">Perfil da professora</small><h1 className="mt-1 truncate font-[var(--font-display)] text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{profile?.full_name ?? "Professora"}</h1><span className="mt-1 flex items-center gap-1.5 text-xs text-[#d8ecff]"><Mail size={13} /> {user.email}</span></span>
        </div>
      </header>

      <section className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <article className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
          <span className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#5f7f9f]"><ShieldCheck size={15} className="text-[#1768c5]" /> Vínculo atual</span>
          <strong className="mt-4 block text-base">{school?.name ?? "Escola"}</strong>
          <p className="mt-1 text-xs leading-5 text-[#6f8299]">Acesso pedagógico individual e protegido. Cada registro fica identificado no histórico da escola.</p>
          <div className="mt-4 rounded-xl bg-[#eef6ff] p-3 text-[10px] font-bold text-[#1768c5]">{assignments?.length ?? 0} {(assignments?.length ?? 0) === 1 ? "turma atribuída" : "turmas atribuídas"}</div>
        </article>

        <article className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
          <span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#5f7f9f]">Permissões operacionais</span>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Permission icon={<BookOpenCheck size={18} />} label="Registrar rotina" />
            <Permission icon={<CalendarDays size={18} />} label="Consultar calendário" />
            <Permission icon={<Camera size={18} />} label="Publicar na galeria" />
          </div>
        </article>
      </section>

      <section className="mt-5">
        <div className="flex items-center gap-2 px-1"><UsersRound size={18} className="text-[#1768c5]" /><h2 className="text-sm font-extrabold">Minhas turmas</h2></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {assignments?.map((assignment) => { const classroom = Array.isArray(assignment.classrooms) ? assignment.classrooms[0] : assignment.classrooms; return <article key={assignment.classroom_id} className="rounded-2xl border border-[#dce6f2] bg-white p-4"><strong className="block text-sm">{classroom?.name ?? "Turma"}</strong><small className="mt-1 block text-[10px] text-[#6f8299]">{classroom?.age_group || "Faixa etária configurada pela direção"}</small><a href={`/app/teacher?classroom=${assignment.classroom_id}`} className="mt-3 inline-flex rounded-xl bg-[#eaf4ff] px-3 py-2 text-[10px] font-bold text-[#1768c5]">Abrir rotina</a></article>; })}
        </div>
      </section>

      <form action={logout} className="mt-5"><button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dce6f2] bg-white py-4 text-xs font-bold text-[#516b86] transition hover:bg-[#f2f7fc]"><LogOut size={17} /> Sair do aplicativo</button></form>
      <p className="mt-4 text-center text-[9px] text-[#8998a9]">Ambiente demonstrativo · dados fictícios</p>
    </div>
  );
}

function Permission({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-[#f2f7fc] p-3 text-[10px] font-bold text-[#385c82]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#1768c5] shadow-sm">{icon}</span>{label}</div>;
}
