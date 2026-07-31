import { redirect } from "next/navigation";
import { Apple, Baby, Coffee, Milk, Soup, Utensils } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

const mealIcons = {
  breakfast: Coffee,
  snack: Apple,
  lunch: Soup,
  bottle: Milk,
  dinner: Utensils,
} as const;

const mealNames = {
  breakfast: "Café da manhã",
  snack: "Lanche",
  lunch: "Almoço",
  bottle: "Mamadeira",
  dinner: "Jantar",
} as const;

export default async function FamilyFoodPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: link, error: linkError } = await supabase
    .from("guardian_links")
    .select("child_id, children(first_name)")
    .eq("membership_id", membership.id)
    .eq("active", true)
    .eq("can_view_routine", true)
    .limit(1)
    .maybeSingle();
  if (linkError) throw linkError;

  const summary = link
    ? (
        await supabase
          .from("daily_summaries")
          .select("snapshot, published_at")
          .eq("child_id", link.child_id)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    : null;
  const child = link
    ? Array.isArray(link.children)
      ? link.children[0]
      : link.children
    : null;
  const snapshot =
    summary?.snapshot &&
    typeof summary.snapshot === "object" &&
    !Array.isArray(summary.snapshot)
      ? summary.snapshot
      : {};
  const meals = Object.entries(snapshot)
    .filter(([key]) => key.startsWith("meal:"))
    .map(([key, value]) => {
      const type = key.replace("meal:", "") as keyof typeof mealNames;
      const label =
        value && typeof value === "object" && !Array.isArray(value) && "label" in value
          ? String(value.label)
          : "Registro realizado";
      return { type, label };
    });

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#2a7bd0]">
          ALIMENTAÇÃO
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">
          Alimentação do dia
        </h1>
        <p className="mt-1 text-xs text-[#6e89a8]">Hoje · {child?.first_name ?? "sua criança"}</p>
      </header>

      <section className="mt-5 divide-y divide-[#e5eaf1] overflow-hidden rounded-2xl bg-white px-3 shadow-[0_8px_24px_rgba(35,73,128,.06)]">
        {meals.map(({ type, label }) => {
          const Icon = mealIcons[type] ?? Utensils;
          return (
            <article
              key={type}
              className="flex items-center gap-4 py-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e4f1ff] text-[#0968cc]">
                <Icon size={23} strokeWidth={1.8} />
              </span>
              <span>
                <small className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#79a0c8]">
                  {mealNames[type] ?? type}
                </small>
                <strong className="mt-1 block text-sm text-[#15395f]">{label}</strong>
              </span>
            </article>
          );
        })}
        {!meals.length ? (
          <div className="px-6 py-12 text-center">
            <Baby className="mx-auto text-[#6ba4dd]" size={30} />
            <strong className="mt-3 block text-sm text-[#15395f]">
              Alimentação ainda não publicada
            </strong>
          </div>
        ) : null}
      </section>
    </div>
  );
}
