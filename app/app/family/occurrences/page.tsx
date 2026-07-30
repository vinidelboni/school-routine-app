import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { occurrenceSeverityLabels, type OccurrenceSeverity } from "../../../lib/occurrences";
import { acknowledgeOccurrence } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

export default async function FamilyOccurrencesPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: recipients } = await supabase
    .from("occurrence_recipients")
    .select("id, viewed_at, acknowledged_at, occurrences!inner(severity, occurred_at, title, description, actions_taken, children(first_name, last_name))")
    .eq("membership_id", membership.id)
    .order("created_at", { ascending: false });
  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#9a623b]">COMUNICAÇÃO DA DIREÇÃO</span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Ocorrências</h1>
        <p className="mt-2 text-sm leading-6 text-[#69746f]">Informações comunicadas oficialmente pela direção e histórico de ciência da família.</p>
      </header>
      <section className="mt-7 grid gap-4">
        {recipients?.map((recipient) => {
          const occurrence = Array.isArray(recipient.occurrences) ? recipient.occurrences[0] : recipient.occurrences;
          const child = Array.isArray(occurrence.children) ? occurrence.children[0] : occurrence.children;
          return (
            <article key={recipient.id} className={`rounded-2xl border bg-white p-5 ${occurrence.severity === "urgent" ? "border-[#d99a8d]" : "border-[#dfe1d9]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] font-extrabold tracking-[.1em] text-[#a05c45]">{occurrenceSeverityLabels[occurrence.severity as OccurrenceSeverity].toUpperCase()}</span>
                  <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">{occurrence.title}</h2>
                  <small className="text-[#7c8680]">{child?.first_name} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(occurrence.occurred_at))}</small>
                </div>
                {recipient.acknowledged_at ? <span className="flex items-center gap-1 rounded-full bg-[#e6efe9] px-2.5 py-1 text-[9px] font-bold text-[#315645]"><CheckCircle2 size={11} /> Ciente</span> : <span className="rounded-full bg-[#fff1dc] px-2.5 py-1 text-[9px] font-bold text-[#8b5b25]">Requer ciência</span>}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#4e5c55]">{occurrence.description}</p>
              <div className="mt-4 rounded-xl bg-[#f5f5f0] p-4 text-xs leading-5 text-[#56635d]"><strong className="block text-[#315645]">Providências tomadas</strong>{occurrence.actions_taken}</div>
              {!recipient.acknowledged_at ? (
                <form action={acknowledgeOccurrence} className="mt-4">
                  <input type="hidden" name="recipientId" value={recipient.id} />
                  <SubmitButton idleLabel={<><ShieldCheck size={15} /> Confirmo que visualizei</>} pendingLabel="Registrando..." className="flex items-center gap-2 rounded-xl bg-[#315645] px-4 py-3 text-xs font-bold text-white" />
                </form>
              ) : null}
            </article>
          );
        })}
        {!recipients?.length ? <div className="rounded-2xl border border-dashed border-[#dfe1d9] bg-white p-10 text-center text-xs text-[#7c8680]"><AlertTriangle className="mx-auto mb-2" size={24} /> Nenhuma ocorrência comunicada.</div> : null}
      </section>
    </div>
  );
}
