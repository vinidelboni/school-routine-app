import { redirect } from "next/navigation";
import { CheckCircle2, Pill, ShieldAlert } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { createMedicationRequest } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

type SearchParams = Promise<{ success?: string }>;

const statusLabels = {
  submitted: "Aguardando análise",
  accepted: "Aceito pela escola",
  declined: "Não aceito",
  completed: "Administração registrada",
} as const;

export default async function FamilyMedicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const [{ data: links }, { data: requests }] = await Promise.all([
    supabase
      .from("guardian_links")
      .select("child_id, children(first_name, last_name)")
      .eq("membership_id", membership.id)
      .eq("active", true),
    supabase
      .from("medication_requests")
      .select(
        "id, medication_name, dosage, scheduled_time, starts_on, ends_on, instructions, authorization_reference, status, children(first_name, last_name), medication_administrations(status, note, recorded_at)",
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const childOptions = (links ?? []).flatMap((link) => {
    const child = Array.isArray(link.children)
      ? link.children[0]
      : link.children;
    return child
      ? [{ id: link.child_id, name: `${child.first_name} ${child.last_name}` }]
      : [];
  });
  if (!childOptions.length) redirect("/app/family");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          MEDICAMENTOS
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Solicitar administração
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Registre uma orientação e aguarde a análise da escola. O envio não
          garante a administração do medicamento.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]"
        >
          <CheckCircle2 size={20} />
          <strong className="text-sm">
            Solicitação enviada para análise da direção!
          </strong>
        </div>
      ) : null}

      <section className="mt-7 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <form
          action={createMedicationRequest}
          className="rounded-2xl border border-[#dfe1d9] bg-white p-5"
        >
          <div className="flex items-start gap-3 rounded-xl bg-[#fff4e9] p-4 text-[#80512f]">
            <ShieldAlert size={20} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-5">
              A escola aplicará sua própria política e poderá recusar a
              solicitação. Em emergências, procure atendimento médico.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Criança">
              <select name="childId" className="input">
                {childOptions.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Medicamento">
              <input name="medicationName" required className="input" />
            </Field>
            <Field label="Dosagem">
              <input
                name="dosage"
                required
                placeholder="Ex.: 5 gotas"
                className="input"
              />
            </Field>
            <Field label="Horário">
              <input
                name="scheduledTime"
                type="time"
                required
                className="input"
              />
            </Field>
            <Field label="Data inicial">
              <input
                name="startsOn"
                type="date"
                required
                defaultValue={today}
                className="input"
              />
            </Field>
            <Field label="Data final">
              <input
                name="endsOn"
                type="date"
                required
                defaultValue={today}
                className="input"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Orientações">
                <textarea
                  name="instructions"
                  required
                  rows={3}
                  placeholder="Ex.: administrar após o almoço"
                  className="input"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Referência da receita ou autorização">
                <input
                  name="authorizationReference"
                  required
                  placeholder="Ex.: receita entregue na secretaria em 29/07"
                  className="input"
                />
              </Field>
            </div>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-xl bg-[#f7f7f3] p-3 text-xs leading-5">
            <input
              type="checkbox"
              name="policyConfirmed"
              required
              className="mt-1 accent-[#315645]"
            />
            Confirmo que forneci as orientações e autorizações exigidas pela
            política da escola.
          </label>
          <SubmitButton
            idleLabel="Enviar solicitação"
            pendingLabel="Enviando solicitação..."
            className="mt-5 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white"
          />
        </form>

        <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
            HISTÓRICO
          </span>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
            Solicitações enviadas
          </h2>
          <div className="mt-5 grid gap-3">
            {requests?.map((request) => {
              const child = Array.isArray(request.children)
                ? request.children[0]
                : request.children;
              const administration = request.medication_administrations[0];
              return (
                <article
                  key={request.id}
                  className="rounded-xl border border-[#e5e5df] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <strong className="block text-sm">
                        {request.medication_name} · {request.dosage}
                      </strong>
                      <small className="mt-1 block text-[#7c8680]">
                        {child?.first_name} ·{" "}
                        {request.scheduled_time.slice(0, 5)}
                      </small>
                    </span>
                    <span className="rounded-full bg-[#eef3ef] px-2.5 py-1 text-[9px] font-bold text-[#315645]">
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#56635d]">
                    {request.instructions}
                  </p>
                  {administration ? (
                    <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#edf6f0] p-2.5 text-[10px] text-[#315645]">
                      <CheckCircle2 size={14} />
                      {administration.status === "administered"
                        ? "Administração confirmada pela escola"
                        : "Não administrado — consulte a observação da escola"}
                      {administration.note ? ` · ${administration.note}` : ""}
                    </p>
                  ) : null}
                </article>
              );
            })}
            {!requests?.length ? (
              <div className="rounded-xl border border-dashed border-[#dfe1d9] p-8 text-center text-xs text-[#7c8680]">
                <Pill className="mx-auto mb-2" size={22} />
                Nenhuma solicitação enviada.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
