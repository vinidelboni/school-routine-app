import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { createTeacherInvite, resendTeacherInvite, updateTeacherAccessStatus } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ success?: string }>;

export default async function TeamAccessPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: teachers, error } = await supabase.from("school_memberships")
    .select("id, status, created_at, profiles(full_name)")
    .eq("school_id", membership.school_id).eq("role", "teacher")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return <div>
    <header>
      <span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">EQUIPE E ACESSOS</span>
      <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Convites da equipe</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61758d]">Cada professora recebe um acesso individual. A turma é atribuída separadamente em Pessoas e turmas.</p>
    </header>
    {query.success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-sm font-bold text-[#0759bd]"><CheckCircle2 size={20} /> {query.success === "invite-sent" ? "Convite enviado por e-mail!" : "Acesso atualizado!"}</div> : null}

    <section className="mt-6 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <form action={createTeacherInvite} className="rounded-2xl border border-[#dce6f2] bg-white p-5">
        <span className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]"><UserPlus size={16} /> NOVA PROFESSORA</span>
        <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold">Enviar convite</h2>
        <div className="mt-5 grid gap-4">
          <label><span className="field-label">Nome completo</span><input name="fullName" required className="input" /></label>
          <label><span className="field-label">E-mail profissional</span><input name="email" type="email" required className="input" /></label>
        </div>
        <SubmitButton idleLabel="Criar acesso e convidar" pendingLabel="Enviando convite..." className="mt-5 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white" />
      </form>

      <div className="rounded-2xl border border-[#dce6f2] bg-white p-5">
        <div className="flex items-center justify-between"><span><span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">PROFESSORAS</span><h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Acessos cadastrados</h2></span><UsersRound className="text-[#1768c5]" /></div>
        <div className="mt-5 grid gap-2">
          {(teachers ?? []).map((teacher) => {
            const profile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles;
            return <article key={teacher.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3eaf2] p-4">
              <span><strong className="block text-sm">{profile?.full_name || "Professora"}</strong><small className="mt-1 flex items-center gap-1.5 text-[10px] text-[#6f8299]">{teacher.status === "invited" ? <Clock3 size={12} /> : <ShieldCheck size={12} />} {teacher.status === "invited" ? "Convite pendente" : teacher.status === "active" ? "Acesso ativo" : "Acesso suspenso"}</small></span>
              {teacher.status === "invited" ? <form action={resendTeacherInvite}><input type="hidden" name="membershipId" value={teacher.id} /><SubmitButton idleLabel="Reenviar" pendingLabel="Enviando..." className="rounded-lg bg-[#0759bd] px-3 py-2 text-[10px] font-bold text-white" /></form> : teacher.status === "suspended" ? <AccessForm membershipId={teacher.id} status="active" label="Restaurar" /> : <AccessForm membershipId={teacher.id} status="suspended" label="Suspender" secondary />}
            </article>;
          })}
          {!teachers?.length ? <p className="rounded-xl border border-dashed border-[#dce6f2] p-8 text-center text-xs text-[#6f8299]">Nenhuma professora cadastrada.</p> : null}
        </div>
      </div>
    </section>
  </div>;
}

function AccessForm({ membershipId, status, label, secondary = false }: { membershipId: string; status: "active" | "suspended"; label: string; secondary?: boolean }) {
  return <form action={updateTeacherAccessStatus}><input type="hidden" name="membershipId" value={membershipId} /><input type="hidden" name="status" value={status} /><SubmitButton idleLabel={label} pendingLabel="Atualizando..." className={`rounded-lg px-3 py-2 text-[10px] font-bold ${secondary ? "border border-[#d8bca7] text-[#80512f]" : "bg-[#0759bd] text-white"}`} /></form>;
}
