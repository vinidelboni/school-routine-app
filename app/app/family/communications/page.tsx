import { redirect } from "next/navigation";
import { CheckCircle2, Eye, Megaphone } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { communicationKindLabels, communicationResponseLabels, type CommunicationKind, type CommunicationResponse } from "../../../lib/communications";
import { ResponseActions } from "./response-actions";

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
        <span className="text-[9px] font-extrabold tracking-[.18em] text-[#6f91c3]">RECADOS</span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#172b4d]">Mural da escola</h1>
        <p className="mt-1 text-xs text-[#77869d]">Leia e responda quando solicitado.</p>
      </header>
      <section className="mt-5 grid max-w-3xl gap-3">
        {recipients?.map((recipient) => {
          const communication = Array.isArray(recipient.communications) ? recipient.communications[0] : recipient.communications;
          const child = Array.isArray(recipient.children) ? recipient.children[0] : recipient.children;
          const kind = communication.kind as CommunicationKind;
          return (
            <article key={recipient.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(35,73,128,.06)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] font-extrabold tracking-[.1em] text-[#9a623b]">{communicationKindLabels[kind].toUpperCase()}</span>
                  <h2 className="mt-1 text-sm font-bold text-[#27364c]">{communication.title}</h2>
                  <small className="mt-1 block text-[9px] text-[#7c8680]">Para {child?.first_name}</small>
                </div>
                {recipient.viewed_at ? (
                  <span className="flex items-center gap-1 rounded-full bg-[#eef3ef] px-2.5 py-1 text-[9px] font-bold text-[#315645]"><Eye size={11} /> Visualizado</span>
                ) : (
                  <span className="rounded-full bg-[#fff1dc] px-2.5 py-1 text-[9px] font-bold text-[#8b5b25]">Novo</span>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#56657a]">{communication.body}</p>
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
