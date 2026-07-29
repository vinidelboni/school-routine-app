import { redirect } from "next/navigation";
import { Camera, CheckCircle2, ShieldCheck } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { updateImageConsent } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ success?: string }>;
export default async function DirectionPhotosPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const [{ data: children }, { data: consents }, { data: photos }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").eq("school_id", membership.school_id).eq("active", true).order("first_name"),
    supabase.from("image_consents").select("child_id, status, notes, updated_at").eq("school_id", membership.school_id),
    supabase.from("photo_publications").select("id, caption, activity_date, published_at, profiles(full_name), photo_children(children(first_name))").eq("school_id", membership.school_id).order("published_at", { ascending: false }).limit(12),
  ]);
  const consentMap = new Map(consents?.map((item) => [item.child_id, item]));
  return <div>
    <header><span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">PRIVACIDADE E IMAGEM</span><h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Fotos e autorizações</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">A direção registra a decisão da família. Publicações com qualquer criança sem autorização são bloqueadas.</p></header>
    {query.success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]"><CheckCircle2 size={20} /><strong className="text-sm">Autorização atualizada!</strong></div> : null}
    <section className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5"><h2 className="font-[var(--font-display)] text-2xl font-semibold">Autorizações por criança</h2><div className="mt-4 grid gap-3">
        {children?.map((child) => { const consent = consentMap.get(child.id); return <form key={child.id} action={updateImageConsent} className="grid gap-3 rounded-xl border border-[#e5e5df] p-4 sm:grid-cols-[1fr_170px_1fr_auto] sm:items-end"><input type="hidden" name="childId" value={child.id} /><span className="pb-2"><strong className="block text-sm">{child.first_name} {child.last_name}</strong><small className="text-[9px] text-[#7c8680]">{consent ? "Decisão registrada" : "Aguardando registro"}</small></span><label className="grid gap-1 text-[9px] font-bold">Situação<select name="status" defaultValue={consent?.status ?? "pending"} className="input"><option value="pending">Pendente</option><option value="authorized">Autorizado</option><option value="not_authorized">Não autorizado</option></select></label><label className="grid gap-1 text-[9px] font-bold">Referência/observação<input name="notes" defaultValue={consent?.notes ?? ""} className="input" placeholder="Termo assinado em..." /></label><SubmitButton idleLabel="Salvar" pendingLabel="Salvando..." className="h-10 rounded-xl bg-[#315645] px-4 text-xs font-bold text-white" /></form>; })}
      </div></div>
      <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5"><span className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.12em] text-[#557164]"><Camera size={15} /> PUBLICAÇÕES</span><h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Auditoria recente</h2><div className="mt-4 grid gap-3">{photos?.map((photo) => { const profile = Array.isArray(photo.profiles) ? photo.profiles[0] : photo.profiles; return <article key={photo.id} className="rounded-xl border border-[#e5e5df] p-4"><strong className="block text-sm">{photo.caption}</strong><small className="mt-1 block text-[#7c8680]">{photo.photo_children.length} criança(s) · {profile?.full_name}</small><span className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#315645]"><ShieldCheck size={12} /> Autorizações verificadas</span></article>; })}{!photos?.length ? <p className="rounded-xl border border-dashed border-[#dfe1d9] p-6 text-center text-xs text-[#7c8680]">Nenhuma foto publicada.</p> : null}</div></div>
    </section>
  </div>;
}
