import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Trash2, Utensils } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { deleteMealPlan } from "../../actions";
import { SubmitButton } from "../registry/submit-button";
import { MealPlanForm } from "./meal-plan-form";

const mealNames = { breakfast: "Café da manhã", morning_snack: "Lanche da manhã", lunch: "Almoço", afternoon_snack: "Lanche da tarde", bottle: "Mamadeira", dinner: "Jantar" } as const;

export default async function DirectionMenuPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const { success } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date();
  limit.setDate(limit.getDate() + 21);
  const [{ data: classrooms }, { data: meals }] = await Promise.all([
    supabase.from("classrooms").select("id, name").eq("school_id", membership.school_id).eq("active", true).order("name"),
    supabase.from("meal_plans").select("id, service_date, meal_type, title, description, allergen_notes, scope, classrooms(name)").eq("school_id", membership.school_id).gte("service_date", today).lte("service_date", limit.toISOString().slice(0, 10)).order("service_date").order("meal_type"),
  ]);
  return (
    <div>
      <header><span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">ALIMENTAÇÃO PLANEJADA</span><h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Cardápio da escola</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#61758d]">Organize o que será servido sem confundir o planejamento com o registro individual de consumo.</p></header>
      {success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd]"><CheckCircle2 size={20} /><strong className="text-sm">Cardápio atualizado!</strong></div> : null}
      <section className="mt-7 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <MealPlanForm classrooms={classrooms ?? []} />
        <div className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">PRÓXIMOS 21 DIAS</span><h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Refeições publicadas</h2>
          <div className="mt-5 grid gap-3">{meals?.map((meal) => { const classroom = Array.isArray(meal.classrooms) ? meal.classrooms[0] : meal.classrooms; return <article key={meal.id} className="rounded-2xl border border-[#e3eaf2] p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f2ff] text-[#176bc2]"><Utensils size={19} /></span><span className="min-w-0 flex-1"><small className="font-extrabold uppercase tracking-[.08em] text-[#386b9f]">{mealNames[meal.meal_type]} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${meal.service_date}T12:00:00Z`))}</small><strong className="mt-1 block text-sm">{meal.title}</strong><span className="mt-1 block text-[9px] text-[#6f8299]">{meal.scope === "school" ? "Toda a escola" : classroom?.name}</span></span></div>{meal.description ? <p className="mt-3 text-xs leading-5 text-[#61758d]">{meal.description}</p> : null}{meal.allergen_notes ? <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff4e9] p-3 text-[10px] text-[#80512f]"><AlertTriangle className="mt-0.5 shrink-0" size={14} /> {meal.allergen_notes}</p> : null}<form action={deleteMealPlan} className="mt-3"><input type="hidden" name="mealPlanId" value={meal.id} /><SubmitButton idleLabel={<><Trash2 size={13} /> Remover</>} pendingLabel="Removendo..." className="flex items-center gap-1.5 text-[9px] font-bold text-[#a34336]" /></form></article>; })}{!meals?.length ? <p className="rounded-2xl border border-dashed border-[#dce6f2] p-8 text-center text-xs text-[#6f8299]">Nenhuma refeição planejada.</p> : null}</div>
        </div>
      </section>
    </div>
  );
}
