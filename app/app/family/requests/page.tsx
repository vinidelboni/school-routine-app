import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import {
  familyRequestLabels,
  familyRequestStatusLabels,
  requestDetailSummary,
  type FamilyRequestType,
} from "../../../lib/family-requests";
import { RequestForm } from "./request-form";

type SearchParams = Promise<{ success?: string }>;

export default async function FamilyRequestsPage({
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
      .from("family_requests")
      .select(
        "id, child_id, request_type, effective_date, details, status, created_at, children(first_name, last_name)",
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const children = (links ?? []).flatMap((link) => {
    const child = Array.isArray(link.children)
      ? link.children[0]
      : link.children;
    return child
      ? [
          {
            id: link.child_id,
            name: `${child.first_name} ${child.last_name}`,
          },
        ]
      : [];
  });
  if (!children.length) redirect("/app/family");

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">
          COMUNICAÇÃO ESTRUTURADA
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Avisos à escola
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Sem chat aberto: a direção recebe informações claras e confirma o
          andamento de cada aviso.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]"
        >
          <CheckCircle2 size={20} />
          <strong className="text-sm">Aviso enviado para a direção!</strong>
        </div>
      ) : null}

      <section className="mt-7 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <RequestForm
          childOptions={children}
          defaultDate={new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
          }).format(new Date())}
        />

        <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
            HISTÓRICO
          </span>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
            Avisos enviados
          </h2>
          <div className="mt-5 grid gap-3">
            {requests?.map((request) => {
              const child = Array.isArray(request.children)
                ? request.children[0]
                : request.children;
              const details =
                typeof request.details === "object" &&
                request.details &&
                !Array.isArray(request.details)
                  ? request.details
                  : {};
              return (
                <article
                  key={request.id}
                  className="rounded-xl border border-[#e5e5df] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <strong className="block text-sm">
                        {
                          familyRequestLabels[
                            request.request_type as FamilyRequestType
                          ]
                        }
                      </strong>
                      <small className="mt-1 block text-[#7c8680]">
                        {child?.first_name} ·{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          timeZone: "UTC",
                        }).format(new Date(`${request.effective_date}T12:00:00Z`))}
                      </small>
                    </span>
                    <Status status={request.status} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#56635d]">
                    {requestDetailSummary(
                      request.request_type as FamilyRequestType,
                      details,
                    )}
                  </p>
                </article>
              );
            })}
            {!requests?.length ? (
              <div className="rounded-xl border border-dashed border-[#dfe1d9] p-8 text-center text-xs text-[#7c8680]">
                <MessageSquareText className="mx-auto mb-2" size={22} />
                Nenhum aviso enviado ainda.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Status({
  status,
}: {
  status: keyof typeof familyRequestStatusLabels;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#eef3ef] px-2.5 py-1 text-[9px] font-bold text-[#315645]">
      <Clock3 size={11} /> {familyRequestStatusLabels[status]}
    </span>
  );
}
