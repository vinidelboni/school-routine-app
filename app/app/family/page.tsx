import { redirect } from "next/navigation";
import { CheckCircle2, Eye, Sparkles, Utensils } from "lucide-react";
import { getCurrentContext } from "../../lib/auth";
import { markSummaryViewed } from "../actions";

export default async function FamilyPage() {
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: link, error: linkError } = await supabase
    .from("guardian_links")
    .select("child_id, children(id, first_name, last_name)")
    .eq("membership_id", membership.id)
    .eq("active", true)
    .eq("can_view_routine", true)
    .limit(1)
    .maybeSingle();
  if (linkError) throw linkError;
  if (!link) return <FamilyEmpty message="Nenhuma criança está vinculada a este acesso." />;

  const child = Array.isArray(link.children) ? link.children[0] : link.children;
  if (!child) return <FamilyEmpty message="O vínculo da criança não está disponível." />;

  const { data: summary, error: summaryError } = await supabase
    .from("daily_summaries")
    .select("id, school_id, narrative, snapshot, published_at")
    .eq("child_id", child.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (summaryError) throw summaryError;
  if (!summary) return <FamilyEmpty message="A escola ainda não publicou nenhum resumo." />;

  const { data: viewed } = await supabase
    .from("summary_views")
    .select("first_viewed_at, last_viewed_at")
    .eq("summary_id", summary.id)
    .eq("viewer_id", user.id)
    .maybeSingle();

  const snapshot =
    typeof summary.snapshot === "object" && summary.snapshot && !Array.isArray(summary.snapshot)
      ? summary.snapshot
      : {};
  const lunch = snapshot["meal:lunch"];
  const lunchLabel =
    typeof lunch === "object" && lunch && !Array.isArray(lunch) && "label" in lunch
      ? String(lunch.label)
      : "Registro não informado";

  return (
    <div className="mx-auto max-w-2xl">
      <header className="rounded-3xl bg-[#315645] p-7 text-white">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#c4d6cc]">
          RESUMO PUBLICADO
        </span>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          O dia de {child.first_name}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#d8e5de]">
          {summary.narrative}
        </p>
        <span className="mt-6 block text-[10px] text-[#b8cbc1]">
          Publicado em{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
          }).format(new Date(summary.published_at))}
        </span>
      </header>

      <section className="mt-4 rounded-2xl border border-[#dfe1d9] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4e6d8] text-[#986d4e]">
            <Utensils size={21} />
          </span>
          <div>
            <strong className="block text-sm">Alimentação</strong>
            <span className="text-[10px] text-[#858d88]">Almoço</span>
          </div>
          <strong className="ml-auto rounded-full bg-[#e6efe9] px-3 py-1.5 text-[10px] text-[#47705d]">
            {lunchLabel}
          </strong>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#dfe1d9] bg-white p-6">
        <div className="flex items-start gap-3">
          <Sparkles size={19} className="mt-0.5 text-[#42715d]" />
          <div>
            <strong className="block text-sm">Como este texto foi criado</strong>
            <p className="mt-2 text-xs leading-5 text-[#69746f]">
              O resumo utiliza regras previsíveis e somente os registros feitos pela
              escola. Nenhuma interpretação sobre humor ou saúde foi inventada.
            </p>
          </div>
        </div>
      </section>

      <form action={markSummaryViewed} className="mt-4">
        <input type="hidden" name="summaryId" value={summary.id} />
        <input type="hidden" name="schoolId" value={summary.school_id} />
        <button
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-bold ${viewed ? "bg-[#e3ede7] text-[#42705a]" : "bg-[#315645] text-white"}`}
        >
          {viewed ? <CheckCircle2 size={18} /> : <Eye size={18} />}
          {viewed ? "Visualização registrada" : "Registrar que visualizei"}
        </button>
      </form>
      <p className="mt-3 text-center text-[9px] text-[#858d88]">
        A escola vê apenas que o resumo foi acessado, nunca utiliza isso para
        avaliar a professora.
      </p>
    </div>
  );
}

function FamilyEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe1d9] bg-white p-8">
      <h1 className="font-[var(--font-display)] text-2xl font-bold">Ainda não há resumo</h1>
      <p className="mt-2 text-sm text-[#69746f]">{message}</p>
    </div>
  );
}
