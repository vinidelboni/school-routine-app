import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Files, Sparkles } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import {
  distributeBillingBatch,
  updateBillingMatches,
} from "../../actions";
import { BatchUploader } from "./batch-uploader";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ batch?: string; success?: string }>;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const [{ data: children }, { data: batches }] = await Promise.all([
    supabase
      .from("children")
      .select("id, first_name, last_name")
      .eq("school_id", membership.school_id)
      .eq("active", true)
      .order("first_name"),
    supabase
      .from("billing_batches")
      .select("id, title, reference_month, status, created_at")
      .eq("school_id", membership.school_id)
      .order("created_at", { ascending: false }),
  ]);
  const childOptions = (children ?? []).map((child) => ({
    id: child.id,
    name: `${child.first_name} ${child.last_name}`,
  }));
  const selected =
    batches?.find((batch) => batch.id === query.batch) ?? batches?.[0];
  const { data: documents } = selected
    ? await supabase
        .from("billing_documents")
        .select(
          "id, child_id, original_filename, due_date, payment_reference, match_confidence, status, viewed_at, children(first_name, last_name)",
        )
        .eq("batch_id", selected.id)
        .order("created_at")
    : { data: [] };
  const now = new Date();
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(now.getFullYear(), now.getMonth(), 1));
  const due = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(now.getFullYear(), now.getMonth() + 1, 10));

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          DOCUMENTOS FINANCEIROS
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Boletos em lote
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Analise sugestões, confirme todos os pareamentos e distribua sem
          anexar um PDF por família.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]"
        >
          <CheckCircle2 size={20} />
          <strong className="text-sm">
            {query.success === "batch-distributed"
              ? "Lote distribuído às famílias!"
              : query.success === "matches-updated"
                ? "Pareamentos confirmados!"
                : "Lote criado para revisão!"}
          </strong>
        </div>
      ) : null}

      <section className="mt-7 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <BatchUploader
          childOptions={childOptions}
          defaultMonth={month}
          defaultDueDate={due}
        />
        <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
            LOTES RECENTES
          </span>
          <div className="mt-4 grid gap-2">
            {batches?.map((batch) => (
              <Link
                key={batch.id}
                href={`/app/direction/billing?batch=${batch.id}`}
                className={`rounded-xl border p-3 text-xs ${
                  selected?.id === batch.id
                    ? "border-[#315645] bg-[#eef3ef]"
                    : "border-[#e5e5df]"
                }`}
              >
                <strong className="block">{batch.title}</strong>
                <small className="mt-1 block text-[#7c8680]">
                  {batch.status === "distributed"
                    ? "Distribuído"
                    : "Em revisão"}
                </small>
              </Link>
            ))}
            {!batches?.length ? (
              <div className="rounded-xl border border-dashed border-[#dfe1d9] p-8 text-center text-xs text-[#7c8680]">
                <Files className="mx-auto mb-2" size={22} />
                Nenhum lote criado.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {selected ? (
        <section className="mt-5 rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
                <Sparkles size={14} /> REVISÃO HUMANA OBRIGATÓRIA
              </span>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
                {selected.title}
              </h2>
            </div>
            <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-[10px] font-bold text-[#315645]">
              {documents?.length ?? 0} documentos
            </span>
          </div>

          <form action={updateBillingMatches} className="mt-5">
            <input type="hidden" name="batchId" value={selected.id} />
            <div className="grid gap-2">
              {documents?.map((document) => (
                <div
                  key={document.id}
                  className="grid gap-2 rounded-xl border border-[#e5e5df] p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <span className="text-xs">
                    <strong className="block">{document.original_filename}</strong>
                    <small className="text-[#7c8680]">
                      Confiança inicial: {document.match_confidence}%
                    </small>
                  </span>
                  <select
                    name={`child-${document.id}`}
                    required
                    defaultValue={document.child_id ?? ""}
                    disabled={selected.status === "distributed"}
                    className="input"
                  >
                    <option value="">Selecione a criança</option>
                    {childOptions.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                  <span className="self-center text-[9px] font-bold text-[#557164]">
                    {document.viewed_at ? "Visualizado" : document.status}
                  </span>
                </div>
              ))}
            </div>
            {selected.status !== "distributed" ? (
              <SubmitButton
                idleLabel="Confirmar pareamentos"
                pendingLabel="Confirmando..."
                className="mt-4 rounded-xl border border-[#315645] bg-white px-5 py-3 text-xs font-bold text-[#315645]"
              />
            ) : null}
          </form>
          {selected.status !== "distributed" ? (
            <form action={distributeBillingBatch} className="mt-3">
              <input type="hidden" name="batchId" value={selected.id} />
              <SubmitButton
                idleLabel="Distribuir lote às famílias"
                pendingLabel="Distribuindo..."
                className="rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white"
              />
            </form>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
