import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, Send } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import {
  occurrenceSeverityLabels,
  type OccurrenceSeverity,
} from "../../../lib/occurrences";
import {
  communicateOccurrence,
  createOccurrence,
} from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ success?: string }>;

export default async function DirectionOccurrencesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const [{ data: children }, { data: occurrences }] = await Promise.all([
    supabase
      .from("children")
      .select("id, first_name, last_name")
      .eq("school_id", membership.school_id)
      .eq("active", true)
      .order("first_name"),
    supabase
      .from("occurrences")
      .select(
        "id, severity, status, occurred_at, title, description, actions_taken, children(first_name, last_name), occurrence_recipients(id, viewed_at, acknowledged_at)",
      )
      .eq("school_id", membership.school_id)
      .order("occurred_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#9a623b]">
          RESPONSABILIDADE DA DIREÇÃO
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Ocorrências
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Registre fatos e providências internamente. A família só recebe a
          informação quando a direção decide comunicar.
        </p>
      </header>
      {query.success ? (
        <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]">
          <CheckCircle2 size={20} />
          <strong className="text-sm">Ocorrência registrada com sucesso!</strong>
        </div>
      ) : null}
      <section className="mt-7 grid items-start gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <form action={createOccurrence} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">NOVO REGISTRO</span>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Registrar ocorrência</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Criança">
              <select name="childId" className="input" required>
                <option value="">Selecione</option>
                {children?.map((child) => <option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Classificação">
                <select name="severity" className="input" required>
                  <option value="attention">Atenção</option>
                  <option value="important">Importante</option>
                  <option value="urgent">Urgente</option>
                </select>
              </Field>
              <Field label="Quando aconteceu">
                <input name="occurredAt" type="datetime-local" className="input" required />
              </Field>
            </div>
            <Field label="Título">
              <input name="title" className="input" placeholder="Ex.: Queda no pátio" required />
            </Field>
            <Field label="O que aconteceu">
              <textarea name="description" rows={4} className="input resize-none" required />
            </Field>
            <Field label="Providências tomadas">
              <textarea name="actionsTaken" rows={4} className="input resize-none" required />
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-[#e4c6ac] bg-[#fff8ed] p-4 text-xs">
              <input type="checkbox" name="communicateNow" className="mt-0.5" />
              <span>
                <strong className="block text-[#80512f]">Comunicar a família agora</strong>
                <span className="mt-1 block leading-5 text-[#756459]">Se desmarcado, o registro permanece interno até a direção liberar.</span>
              </span>
            </label>
            <SubmitButton idleLabel="Registrar ocorrência" pendingLabel="Registrando..." className="rounded-xl bg-[#315645] px-4 py-3 text-xs font-bold text-white" />
          </div>
        </form>
        <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">ACOMPANHAMENTO</span>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Registros recentes</h2>
          <div className="mt-5 grid gap-3">
            {occurrences?.map((occurrence) => {
              const child = Array.isArray(occurrence.children) ? occurrence.children[0] : occurrence.children;
              const recipients = occurrence.occurrence_recipients ?? [];
              const acknowledged = recipients.filter((recipient) => recipient.acknowledged_at).length;
              return (
                <article key={occurrence.id} className={`rounded-xl border p-4 ${occurrence.severity === "urgent" ? "border-[#d99a8d] bg-[#fff6f3]" : "border-[#e5e5df]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={`text-[9px] font-extrabold tracking-[.1em] ${occurrence.severity === "urgent" ? "text-[#a34336]" : "text-[#9a623b]"}`}>
                        {occurrenceSeverityLabels[occurrence.severity as OccurrenceSeverity].toUpperCase()}
                      </span>
                      <strong className="mt-1 block text-sm">{occurrence.title} · {child?.first_name}</strong>
                      <p className="mt-2 text-xs leading-5 text-[#56635d]">{occurrence.description}</p>
                      <p className="mt-2 text-[10px] leading-4 text-[#69746f]"><strong>Providências:</strong> {occurrence.actions_taken}</p>
                    </div>
                    <Status status={occurrence.status} acknowledged={acknowledged} total={recipients.length} />
                  </div>
                  {occurrence.status === "internal" ? (
                    <form action={communicateOccurrence} className="mt-4 border-t border-[#eadfd8] pt-4">
                      <input type="hidden" name="occurrenceId" value={occurrence.id} />
                      <SubmitButton idleLabel={<><Send size={13} /> Comunicar à família</>} pendingLabel="Comunicando..." className="flex items-center gap-2 rounded-xl bg-[#80512f] px-4 py-2.5 text-[10px] font-bold text-white" />
                    </form>
                  ) : null}
                </article>
              );
            })}
            {!occurrences?.length ? <div className="rounded-xl border border-dashed border-[#dfe1d9] p-8 text-center text-xs text-[#7c8680]"><AlertTriangle className="mx-auto mb-2" size={22} /> Nenhuma ocorrência registrada.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-bold">{label}{children}</label>;
}

function Status({ status, acknowledged, total }: { status: string; acknowledged: number; total: number }) {
  if (status === "internal") return <span className="flex items-center gap-1 rounded-full bg-[#eef0ed] px-2.5 py-1 text-[9px] font-bold text-[#66716b]"><Clock3 size={11} /> Interno</span>;
  return <span className="rounded-full bg-[#fff1dc] px-2.5 py-1 text-[9px] font-bold text-[#8b5b25]">Ciência {acknowledged}/{total}</span>;
}
