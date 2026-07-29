import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Users } from "lucide-react";
import { getCurrentContext } from "../../lib/auth";

export default async function DirectionPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: days, error } = await supabase
    .from("school_days")
    .select("id, day, status, published_at, classrooms(name)")
    .eq("school_id", membership.school_id)
    .order("day", { ascending: false })
    .limit(6);
  if (error) throw error;

  const { count: memberCount } = await supabase
    .from("school_memberships")
    .select("*", { count: "exact", head: true })
    .eq("school_id", membership.school_id)
    .eq("status", "active");

  const { count: summaryCount } = await supabase
    .from("daily_summaries")
    .select("*", { count: "exact", head: true })
    .eq("school_id", membership.school_id);

  const { count: viewCount } = await supabase
    .from("summary_views")
    .select("*", { count: "exact", head: true })
    .eq("school_id", membership.school_id);

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
          Dados reais do projeto Laço, protegidos pelas políticas da escola.
        </p>
      </header>

      <section className="mt-8 grid gap-3 md:grid-cols-3">
        <Metric icon={<Users size={20} />} label="Acessos ativos" value={memberCount ?? 0} />
        <Metric icon={<CheckCircle2 size={20} />} label="Resumos publicados" value={summaryCount ?? 0} />
        <Metric icon={<Eye size={20} />} label="Visualizações registradas" value={viewCount ?? 0} />
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
    </div>
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
