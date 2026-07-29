import { redirect } from "next/navigation";
import { CheckCircle2, Eye, Megaphone, MessageCircleReply } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { communicationKindLabels, communicationResponseLabels, type CommunicationKind, type CommunicationResponse } from "../../../lib/communications";
import { CommunicationForm } from "./communication-form";

type SearchParams = Promise<{ success?: string }>;

export default async function DirectionCommunicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const [{ data: classrooms }, { data: children }, { data: communications }] = await Promise.all([
    supabase.from("classrooms").select("id, name").eq("school_id", membership.school_id).eq("active", true).order("name"),
    supabase.from("children").select("id, first_name, last_name").eq("school_id", membership.school_id).order("first_name"),
    supabase
      .from("communications")
      .select("id, kind, scope, title, body, event_date, published_at, communication_recipients(id, viewed_at, response, children(first_name, last_name), school_memberships(profiles(full_name)))")
      .eq("school_id", membership.school_id)
      .order("published_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">COMUNICAÇÃO DA ESCOLA</span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Comunicados às famílias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">
          Publique por escola, turma ou criança e acompanhe apenas as confirmações esperadas para cada tipo.
        </p>
      </header>
      {query.success ? (
        <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]">
          <CheckCircle2 size={20} />
          <strong className="text-sm">Comunicado publicado com sucesso!</strong>
        </div>
      ) : null}
      <section className="mt-7 grid items-start gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <CommunicationForm
          classrooms={(classrooms ?? []).map((item) => ({ id: item.id, name: item.name }))}
          childOptions={(children ?? []).map((item) => ({ id: item.id, name: `${item.first_name} ${item.last_name}` }))}
        />
        <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">ACOMPANHAMENTO</span>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Publicações recentes</h2>
          <div className="mt-5 grid gap-3">
            {communications?.map((communication) => {
              const recipients = communication.communication_recipients ?? [];
              const viewed = recipients.filter((recipient) => recipient.viewed_at).length;
              const responded = recipients.filter((recipient) => recipient.response).length;
              return (
                <article key={communication.id} className="rounded-xl border border-[#e5e5df] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-extrabold tracking-[.1em] text-[#9a623b]">
                        {communicationKindLabels[communication.kind as CommunicationKind].toUpperCase()}
                      </span>
                      <strong className="mt-1 block text-sm">{communication.title}</strong>
                      <p className="mt-2 max-w-xl text-xs leading-5 text-[#56635d]">{communication.body}</p>
                    </div>
                    <div className="flex gap-2 text-[9px] font-bold">
                      <span className="flex items-center gap-1 rounded-full bg-[#eef3ef] px-2.5 py-1 text-[#315645]"><Eye size={11} /> {viewed}/{recipients.length}</span>
                      {communication.kind !== "general" ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#fff1dc] px-2.5 py-1 text-[#8b5b25]"><MessageCircleReply size={11} /> {responded}/{recipients.length}</span>
                      ) : null}
                    </div>
                  </div>
                  {recipients.some((recipient) => recipient.response) ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[#ecece7] pt-3">
                      {recipients.filter((recipient) => recipient.response).map((recipient) => {
                        const child = Array.isArray(recipient.children) ? recipient.children[0] : recipient.children;
                        const member = Array.isArray(recipient.school_memberships) ? recipient.school_memberships[0] : recipient.school_memberships;
                        const profile = Array.isArray(member?.profiles) ? member?.profiles[0] : member?.profiles;
                        return (
                          <span key={recipient.id} className="rounded-lg bg-[#f5f5f0] px-2.5 py-2 text-[9px] text-[#56635d]">
                            <strong>{profile?.full_name}</strong> · {child?.first_name}: {communicationResponseLabels[recipient.response as CommunicationResponse]}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
            {!communications?.length ? (
              <div className="rounded-xl border border-dashed border-[#dfe1d9] p-8 text-center text-xs text-[#7c8680]">
                <Megaphone className="mx-auto mb-2" size={22} /> Nenhum comunicado publicado ainda.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
