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
        <p className="mt-2 text-xs leading-5 text-[#6e89a8]">
          Registros de {child?.first_name ?? "sua criança"} publicados pela escola.
        </p>
      </header>

      <section className="mt-6 grid gap-3">
        {meals.map(({ type, label }) => {
          const Icon = mealIcons[type] ?? Utensils;
          return (
            <article
              key={type}
              className="flex items-center gap-4 rounded-3xl border border-[#dce9f8] bg-white p-5 shadow-[0_10px_28px_rgba(18,91,170,.08)]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e4f1ff] text-[#0968cc]">
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
          <div className="rounded-3xl border border-dashed border-[#cbdff4] bg-white px-6 py-12 text-center">
            <Baby className="mx-auto text-[#6ba4dd]" size={30} />
            <strong className="mt-3 block text-sm text-[#15395f]">
              Alimentação ainda não publicada
            </strong>
            <p className="mt-1 text-[11px] leading-5 text-[#7890aa]">
              Os registros ficam disponíveis depois que a escola publica o Diário de Bordo.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
