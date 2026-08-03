import { redirect } from "next/navigation";
import { CheckCircle2, Inbox, ShieldCheck } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import {
  familyRequestLabels,
  familyRequestStatusLabels,
  requestDetailSummary,
  type FamilyRequestType,
} from "../../../lib/family-requests";
import { handleFamilyRequest } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ success?: string }>;

export default async function DirectionRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: requests } = await supabase
    .from("family_requests")
    .select(
      "id, request_type, effective_date, details, status, created_at, children(first_name, last_name), profiles!family_requests_created_by_fkey(full_name)",
    )
    .eq("school_id", membership.school_id)
    .order("created_at", { ascending: false })
    .limit(50);
  const pending =
    requests?.filter((request) => request.status === "submitted") ?? [];
  const resolved =
    requests?.filter((request) => request.status !== "submitted") ?? [];

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">
          CENTRAL DA DIREÇÃO
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Avisos e solicitações
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61758d]">
          Veja primeiro o que exige ação. Solicitações de período precisam de
          decisão; os demais avisos recebem ciência da escola.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd]"
        >
          <CheckCircle2 size={20} />
          <strong className="text-sm">Solicitação atualizada!</strong>
        </div>
      ) : null}

      <section className="mt-7 rounded-2xl border border-[#dce6f2] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold tracking-[.12em] text-[#9a623b]">
              EXIGE AÇÃO
            </span>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
              Pendências recebidas
            </h2>
          </div>
          <span className="rounded-full bg-[#fff1dc] px-3 py-1 text-[10px] font-bold text-[#8b5b25]">
            {pending.length} pendente(s)
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {pending.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
          {!pending.length ? (
            <div className="rounded-xl border border-dashed border-[#dce6f2] p-8 text-center text-xs text-[#6f8299]">
              <Inbox className="mx-auto mb-2" size={22} />
              Nenhuma pendência aguardando a direção.
            </div>
          ) : null}
        </div>
      </section>

      {resolved.length ? (
        <section className="mt-5 rounded-2xl border border-[#dce6f2] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">
            HISTÓRICO RECENTE
          </span>
          <div className="mt-4 grid gap-2">
            {resolved.slice(0, 12).map((request) => (
              <RequestCard key={request.id} request={request} readonly />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type RequestItem = {
  id: string;
  request_type: FamilyRequestType;
  effective_date: string;
  details: unknown;
  status:
    | "submitted"
    | "acknowledged"
    | "approved"
    | "declined"
    | "completed";
  children:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[];
  profiles:
    | { full_name: string }
    | { full_name: string }[];
};

function RequestCard({
  request,
  readonly = false,
}: {
  request: RequestItem;
  readonly?: boolean;
}) {
  const child = Array.isArray(request.children)
    ? request.children[0]
    : request.children;
  const profile = Array.isArray(request.profiles)
    ? request.profiles[0]
    : request.profiles;
  const details =
    typeof request.details === "object" &&
    request.details &&
    !Array.isArray(request.details)
      ? (request.details as Record<string, unknown>)
      : {};
  const requiresApproval = request.request_type === "extended_period";

  return (
    <article className="rounded-xl border border-[#e3eaf2] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong className="block text-sm">
            {familyRequestLabels[request.request_type]} · {child?.first_name}{" "}
            {child?.last_name}
          </strong>
          <small className="mt-1 block text-[#6f8299]">
            Enviado por {profile?.full_name} ·{" "}
            {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
              new Date(`${request.effective_date}T12:00:00Z`),
            )}
          </small>
          <p className="mt-2 text-xs leading-5 text-[#536b84]">
            {requestDetailSummary(request.request_type, details)}
          </p>
        </div>
        {readonly ? (
          <span className="rounded-full bg-[#edf5fd] px-3 py-1 text-[9px] font-bold text-[#0759bd]">
            {familyRequestStatusLabels[request.status]}
          </span>
        ) : null}
      </div>

      {!readonly ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e9eef5] pt-4">
          {requiresApproval ? (
            <>
              <RequestAction
                requestId={request.id}
                status="approved"
                label="Aprovar solicitação"
              />
              <RequestAction
                requestId={request.id}
                status="declined"
                label="Não aprovar"
                secondary
              />
            </>
          ) : (
            <RequestAction
              requestId={request.id}
              status="acknowledged"
              label="Confirmar recebimento"
            />
          )}
          <span className="ml-auto flex items-center gap-1 text-[9px] text-[#6f8299]">
            <ShieldCheck size={12} /> Ação registrada
          </span>
        </div>
      ) : null}
    </article>
  );
}

function RequestAction({
  requestId,
  status,
  label,
  secondary = false,
}: {
  requestId: string;
  status: "acknowledged" | "approved" | "declined";
  label: string;
  secondary?: boolean;
}) {
  return (
    <form action={handleFamilyRequest}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        idleLabel={label}
        pendingLabel="Atualizando..."
        className={`rounded-xl px-4 py-2.5 text-[10px] font-bold ${
          secondary
            ? "border border-[#d8bca7] bg-white text-[#80512f]"
            : "bg-[#0759bd] text-white"
        }`}
      />
    </form>
  );
}
