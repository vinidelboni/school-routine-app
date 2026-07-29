import { redirect } from "next/navigation";
import { CheckCircle2, Pill, ShieldAlert } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import {
  handleMedicationRequest,
  recordMedicationAdministration,
} from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ success?: string }>;

export default async function DirectionMedicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: requests } = await supabase
    .from("medication_requests")
    .select(
      "id, medication_name, dosage, scheduled_time, starts_on, ends_on, instructions, authorization_reference, status, children(first_name, last_name), profiles!medication_requests_created_by_fkey(full_name), medication_administrations(status, note, recorded_at)",
    )
    .eq("school_id", membership.school_id)
    .order("created_at", { ascending: false });
  const pending = requests?.filter((item) => item.status === "submitted") ?? [];
  const accepted = requests?.filter((item) => item.status === "accepted") ?? [];
  const history =
    requests?.filter(
      (item) => item.status === "declined" || item.status === "completed",
    ) ?? [];

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          CENTRAL DA DIREÇÃO
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Medicamentos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Analise cada solicitação segundo a política da escola e registre o que
          foi efetivamente administrado.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]"
        >
          <CheckCircle2 size={20} />
          <strong className="text-sm">
            {query.success === "administration-recorded"
              ? "Administração registrada!"
              : "Solicitação atualizada!"}
          </strong>
        </div>
      ) : null}

      <RequestSection
        title="Aguardando análise"
        eyebrow="EXIGE DECISÃO"
        requests={pending}
        mode="review"
      />
      <RequestSection
        title="Aceitos e aguardando registro"
        eyebrow="ADMINISTRAÇÃO"
        requests={accepted}
        mode="administration"
      />
      {history.length ? (
        <RequestSection
          title="Histórico recente"
          eyebrow="CONCLUÍDOS"
          requests={history}
          mode="history"
        />
      ) : null}
    </div>
  );
}

type MedicationItem = {
  id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  starts_on: string;
  ends_on: string;
  instructions: string;
  authorization_reference: string;
  status: "submitted" | "accepted" | "declined" | "completed";
  children:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[];
  profiles:
    | { full_name: string }
    | { full_name: string }[];
  medication_administrations: {
    status: "administered" | "not_administered";
    note: string | null;
    recorded_at: string;
  }[];
};

function RequestSection({
  title,
  eyebrow,
  requests,
  mode,
}: {
  title: string;
  eyebrow: string;
  requests: MedicationItem[];
  mode: "review" | "administration" | "history";
}) {
  return (
    <section className="mt-5 rounded-2xl border border-[#dfe1d9] bg-white p-5">
      <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
        {eyebrow}
      </span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
        {title}
      </h2>
      <div className="mt-5 grid gap-3">
        {requests.map((request) => (
          <MedicationCard key={request.id} request={request} mode={mode} />
        ))}
        {!requests.length ? (
          <div className="rounded-xl border border-dashed border-[#dfe1d9] p-7 text-center text-xs text-[#7c8680]">
            <Pill className="mx-auto mb-2" size={21} />
            Nenhum registro nesta etapa.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MedicationCard({
  request,
  mode,
}: {
  request: MedicationItem;
  mode: "review" | "administration" | "history";
}) {
  const child = Array.isArray(request.children)
    ? request.children[0]
    : request.children;
  const profile = Array.isArray(request.profiles)
    ? request.profiles[0]
    : request.profiles;
  const administration = request.medication_administrations[0];

  return (
    <article className="rounded-xl border border-[#e5e5df] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong className="block text-sm">
            {request.medication_name} · {request.dosage}
          </strong>
          <small className="mt-1 block text-[#7c8680]">
            {child?.first_name} {child?.last_name} ·{" "}
            {request.scheduled_time.slice(0, 5)} · por {profile?.full_name}
          </small>
        </div>
        <span className="rounded-full bg-[#fff1dc] px-2.5 py-1 text-[9px] font-bold text-[#8b5b25]">
          {request.starts_on} a {request.ends_on}
        </span>
      </div>
      <div className="mt-3 grid gap-2 rounded-xl bg-[#f7f7f3] p-3 text-xs leading-5">
        <p>
          <strong>Orientação:</strong> {request.instructions}
        </p>
        <p>
          <strong>Autorização:</strong> {request.authorization_reference}
        </p>
      </div>

      {mode === "review" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <DecisionForm
            requestId={request.id}
            status="accepted"
            label="Aceitar solicitação"
          />
          <DecisionForm
            requestId={request.id}
            status="declined"
            label="Recusar"
            secondary
          />
        </div>
      ) : null}

      {mode === "administration" ? (
        <form
          action={recordMedicationAdministration}
          className="mt-4 grid gap-3 border-t border-[#ecece7] pt-4 sm:grid-cols-[.8fr_1.2fr_auto]"
        >
          <input type="hidden" name="requestId" value={request.id} />
          <select name="administrationStatus" className="input">
            <option value="administered">Administrado</option>
            <option value="not_administered">Não administrado</option>
          </select>
          <input
            name="note"
            placeholder="Observação opcional"
            className="input"
          />
          <SubmitButton
            idleLabel="Registrar"
            pendingLabel="Registrando..."
            className="rounded-xl bg-[#315645] px-4 py-3 text-[10px] font-bold text-white"
          />
        </form>
      ) : null}

      {mode === "history" ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-[#557164]">
          {request.status === "declined" ? (
            <ShieldAlert size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          {request.status === "declined"
            ? "Solicitação recusada pela escola"
            : administration?.status === "administered"
              ? `Administrado${administration.note ? ` · ${administration.note}` : ""}`
              : `Não administrado${administration?.note ? ` · ${administration.note}` : ""}`}
        </p>
      ) : null}
    </article>
  );
}

function DecisionForm({
  requestId,
  status,
  label,
  secondary = false,
}: {
  requestId: string;
  status: "accepted" | "declined";
  label: string;
  secondary?: boolean;
}) {
  return (
    <form action={handleMedicationRequest}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        idleLabel={label}
        pendingLabel="Atualizando..."
        className={`rounded-xl px-4 py-2.5 text-[10px] font-bold ${
          secondary
            ? "border border-[#d8bca7] bg-white text-[#80512f]"
            : "bg-[#315645] text-white"
        }`}
      />
    </form>
  );
}
