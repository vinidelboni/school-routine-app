import { redirect } from "next/navigation";
import { AlertTriangle, Apple, Baby, CalendarDays, Coffee, Milk, Soup, Utensils } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

const mealIcons = { breakfast: Coffee, morning_snack: Apple, snack: Apple, lunch: Soup, afternoon_snack: Apple, bottle: Milk, dinner: Utensils } as const;
const mealNames = { breakfast: "Café da manhã", morning_snack: "Lanche da manhã", snack: "Lanche", lunch: "Almoço", afternoon_snack: "Lanche da tarde", bottle: "Mamadeira", dinner: "Jantar" } as const;

export default async function FamilyFoodPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: link, error: linkError } = await supabase.from("guardian_links").select("child_id, children(first_name)").eq("membership_id", membership.id).eq("active", true).eq("can_view_routine", true).limit(1).maybeSingle();
  if (linkError) throw linkError;
  const summary = link ? (await supabase.from("daily_summaries").select("snapshot, published_at").eq("child_id", link.child_id).order("published_at", { ascending: false }).limit(1).maybeSingle()).data : null;
  const child = link ? (Array.isArray(link.children) ? link.children[0] : link.children) : null;
  const snapshot = summary?.snapshot && typeof summary.snapshot === "object" && !Array.isArray(summary.snapshot) ? summary.snapshot : {};
  const meals = Object.entries(snapshot).filter(([key]) => key.startsWith("meal:")).map(([key, value]) => {
    const type = key.replace("meal:", "") as keyof typeof mealNames;
    const label = value && typeof value === "object" && !Array.isArray(value) && "label" in value ? String(value.label) : "Registro realizado";
    return { type, label };
  });
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 6);
  const { data: plannedMeals } = await supabase.from("meal_plans").select("id, service_date, meal_type, title, description, allergen_notes, scope").eq("school_id", membership.school_id).gte("service_date", today).lte("service_date", weekEnd.toISOString().slice(0, 10)).order("service_date").order("meal_type");
  const specificSlots = new Set((plannedMeals ?? []).filter((meal) => meal.scope === "classroom").map((meal) => `${meal.service_date}:${meal.meal_type}`));
  const visiblePlannedMeals = (plannedMeals ?? []).filter((meal) => meal.scope === "classroom" || !specificSlots.has(`${meal.service_date}:${meal.meal_type}`));

  return (
    <div>
      <header className="px-1 pt-1"><span className="text-[9px] font-extrabold tracking-[.16em] text-[#2a7bd0]">ALIMENTAÇÃO</span><h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">Alimentação</h1><p className="mt-1 text-xs text-[#6e89a8]">Cardápio previsto e registros de {child?.first_name ?? "sua criança"}</p></header>

      <section className="mt-5">
        <div className="flex items-center justify-between px-1"><h2 className="text-xs font-extrabold text-[#27364c]">Cardápio dos próximos dias</h2><CalendarDays size={16} className="text-[#2a7bd0]" /></div>
        <div className="mt-2 grid gap-3">
          {visiblePlannedMeals.map((meal) => {
            const Icon = mealIcons[meal.meal_type as keyof typeof mealIcons] ?? Utensils;
            return <article key={meal.id} className="rounded-2xl border border-[#dce9f8] bg-white p-4 shadow-[0_8px_24px_rgba(35,73,128,.05)]"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e4f1ff] text-[#0968cc]"><Icon size={22} strokeWidth={1.8} /></span><span className="min-w-0 flex-1"><small className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#2a7bd0]">{mealNames[meal.meal_type as keyof typeof mealNames]} · {new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${meal.service_date}T12:00:00Z`))}</small><strong className="mt-1 block text-sm text-[#15395f]">{meal.title}</strong>{meal.description ? <p className="mt-1 text-[10px] leading-4 text-[#61758d]">{meal.description}</p> : null}</span></div>{meal.allergen_notes ? <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff4e9] p-3 text-[9px] text-[#80512f]"><AlertTriangle className="mt-0.5 shrink-0" size={13} /> {meal.allergen_notes}</p> : null}</article>;
          })}
          {!visiblePlannedMeals.length ? <div className="rounded-2xl border border-dashed border-[#cbdff4] bg-white px-6 py-8 text-center text-[11px] text-[#7890aa]">A escola ainda não publicou o cardápio dos próximos dias.</div> : null}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="px-1 text-xs font-extrabold text-[#27364c]">Como foi hoje</h2>
        <div className="mt-2 divide-y divide-[#e5eaf1] overflow-hidden rounded-2xl bg-white px-3 shadow-[0_8px_24px_rgba(35,73,128,.06)]">
          {meals.map(({ type, label }) => { const Icon = mealIcons[type] ?? Utensils; return <article key={type} className="flex items-center gap-4 py-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e4f1ff] text-[#0968cc]"><Icon size={23} strokeWidth={1.8} /></span><span><small className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#79a0c8]">{mealNames[type] ?? type}</small><strong className="mt-1 block text-sm text-[#15395f]">{label}</strong></span></article>; })}
          {!meals.length ? <div className="px-6 py-12 text-center"><Baby className="mx-auto text-[#6ba4dd]" size={30} /><strong className="mt-3 block text-sm text-[#15395f]">Alimentação ainda não publicada</strong></div> : null}
        </div>
      </section>
    </div>
  );
}
