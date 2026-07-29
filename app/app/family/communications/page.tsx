import { redirect } from "next/navigation";
import { CheckCircle2, Eye, Megaphone } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { communicationKindLabels, communicationResponseLabels, type CommunicationKind, type CommunicationResponse } from "../../../lib/communications";
import { respondToCommunication } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

export default async function FamilyCommunicationsPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: recipients } = await supabase
    .from("communication_recipients")
    .select("id, viewed_at, response, responded_at, children(first_name, last_name), communications!inner(id, kind, title, body, event_date, published_at)")
    .eq("membership_id", membership.id)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">CAIXA DE ENTRADA</span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Comunicados da escola</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Informações organizadas e respostas objetivas, sem chat aberto ou atendimento permanente da professora.
        </p>
      </header>
      <section className="mt-7 grid max-w-3xl gap-4">
        {recipients?.map((recipient) => {
          const communication = Array.isArray(recipient.communications) ? recipient.communications[0] : recipient.communications;
          const child = Array.isArray(recipient.children) ? recipient.children[0] : recipient.children;
          const kind = communication.kind as CommunicationKind;
          return (
            <article key={recipient.id} className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] font-extrabold tracking-[.1em] text-[#9a623b]">{communicationKindLabels[kind].toUpperCase()}</span>
                  <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">{communication.title}</h2>
                  <small className="mt-1 block text-[#7c8680]">Para a família de {child?.first_name}</small>
                </div>
                {recipient.viewed_at ? (
                  <span className="flex items-center gap-1 rounded-full bg-[#eef3ef] px-2.5 py-1 text-[9px] font-bold text-[#315645]"><Eye size={11} /> Visualizado</span>
                ) : (
                  <span className="rounded-full bg-[#fff1dc] px-2.5 py-1 text-[9px] font-bold text-[#8b5b25]">Novo</span>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#4e5c55]">{communication.body}</p>
              {communication.event_date ? (
                <p className="mt-2 text-xs font-bold text-[#557164]">
                  Data: {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${communication.event_date}T12:00:00Z`))}
                </p>
              ) : null}
              <div className="mt-5 border-t border-[#ecece7] pt-4">
                {recipient.response ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#315645]">
                    <CheckCircle2 size={17} /> Sua resposta: {communicationResponseLabels[recipient.response as CommunicationResponse]}
                  </div>
                ) : (
                  <ResponseActions recipientId={recipient.id} kind={kind} viewed={Boolean(recipient.viewed_at)} />
                )}
              </div>
            </article>
          );
        })}
        {!recipients?.length ? (
          <div className="rounded-2xl border border-dashed border-[#dfe1d9] bg-white p-10 text-center text-xs text-[#7c8680]">
            <Megaphone className="mx-auto mb-2" size={24} /> Nenhum comunicado disponível.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ResponseActions({ recipientId, kind, viewed }: { recipientId: string; kind: CommunicationKind; viewed: boolean }) {
  const actions =
    kind === "important"
      ? [{ value: "acknowledged", label: "Li e estou ciente" }]
      : kind === "authorization"
        ? [{ value: "authorized", label: "Autorizo" }, { value: "not_authorized", label: "Não autorizo" }]
        : kind === "item_request"
          ? [{ value: "will_send", label: "Vou enviar" }, { value: "sent", label: "Já enviei" }, { value: "cannot_send", label: "Não consigo enviar" }]
          : [{ value: "", label: viewed ? "Visualizado" : "Registrar visualização" }];
  if (kind === "general" && viewed) return <span className="text-xs text-[#557164]">Visualização registrada.</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <form key={action.value || "viewed"} action={respondToCommunication}>
          <input type="hidden" name="recipientId" value={recipientId} />
          <input type="hidden" name="response" value={action.value} />
          <SubmitButton
            idleLabel={action.label}
            pendingLabel="Registrando..."
            className={`rounded-xl px-4 py-2.5 text-[10px] font-bold ${index === 0 ? "bg-[#315645] text-white" : "border border-[#cfd8d2] bg-white text-[#315645]"}`}
          />
        </form>
      ))}
    </div>
  );
}
