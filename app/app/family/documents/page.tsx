import { redirect } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { markBillingDocumentViewed } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

export default async function FamilyDocumentsPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: documents } = await supabase
    .from("billing_documents")
    .select(
      "id, original_filename, due_date, payment_reference, viewed_at, children(first_name, last_name), billing_batches(title, reference_month)",
    )
    .eq("status", "distributed")
    .order("created_at", { ascending: false });

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          DOCUMENTOS
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Boletos e mensalidades
        </h1>
        <p className="mt-2 text-sm text-[#69746f]">
          A visualização não representa confirmação de pagamento.
        </p>
      </header>
      <section className="mt-7 grid gap-3">
        {documents?.map((document) => {
          const child = Array.isArray(document.children)
            ? document.children[0]
            : document.children;
          const batch = Array.isArray(document.billing_batches)
            ? document.billing_batches[0]
            : document.billing_batches;
          return (
            <article
              key={document.id}
              className="rounded-2xl border border-[#dfe1d9] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e6d8] text-[#986d4e]">
                    <FileText size={19} />
                  </span>
                  <span>
                    <strong className="block text-sm">{batch?.title}</strong>
                    <small className="mt-1 block text-[#7c8680]">
                      {child?.first_name} · vence em {document.due_date}
                    </small>
                    <code className="mt-2 block text-[10px] text-[#557164]">
                      {document.payment_reference}
                    </code>
                  </span>
                </span>
                <form action={markBillingDocumentViewed}>
                  <input
                    type="hidden"
                    name="documentId"
                    value={document.id}
                  />
                  <SubmitButton
                    idleLabel={
                      document.viewed_at ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={14} /> Visualizado
                        </span>
                      ) : (
                        "Abrir documento"
                      )
                    }
                    pendingLabel="Abrindo..."
                    className="rounded-xl bg-[#315645] px-4 py-2.5 text-[10px] font-bold text-white"
                  />
                </form>
              </div>
            </article>
          );
        })}
        {!documents?.length ? (
          <div className="rounded-2xl border border-dashed border-[#dfe1d9] bg-white p-10 text-center text-xs text-[#7c8680]">
            Nenhum documento disponibilizado.
          </div>
        ) : null}
      </section>
    </div>
  );
}
