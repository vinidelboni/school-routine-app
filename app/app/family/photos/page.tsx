import Image from "next/image";
import { redirect } from "next/navigation";
import { Images, Play } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

export default async function FamilyGalleryPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: publications } = await supabase.from("photo_publications").select("id, storage_path, caption, activity_date, media_type, mime_type, photo_children(children(first_name))").order("activity_date", { ascending: false }).limit(30);
  const gallery = await Promise.all((publications ?? []).map(async (publication) => { const { data } = await supabase.storage.from("school-photos").createSignedUrl(publication.storage_path, 3600); return { ...publication, url: data?.signedUrl }; }));
  return <div>
    <header className="px-1 pt-1"><span className="text-[9px] font-extrabold tracking-[.16em] text-[#2a7bd0]">MOMENTOS DA ESCOLA</span><h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] text-[#082a57]">Galeria</h1><p className="mt-2 text-xs leading-5 text-[#6e89a8]">Fotos e vídeos em que sua criança foi identificada e estava autorizada.</p></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2">{gallery.map((publication) => { const child = Array.isArray(publication.photo_children[0]?.children) ? publication.photo_children[0]?.children[0] : publication.photo_children[0]?.children; return <article key={publication.id} className="overflow-hidden rounded-3xl border border-[#dce9f8] bg-white shadow-[0_9px_26px_rgba(18,91,170,.07)]">
      {publication.url ? publication.media_type === "video" ? <div className="relative aspect-video bg-[#061b44]"><video controls playsInline preload="metadata" className="h-full w-full object-contain"><source src={publication.url} type={publication.mime_type} /></video><span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[8px] font-bold text-white backdrop-blur"><Play size={10} fill="currentColor" /> VÍDEO</span></div> : <div className="relative aspect-[4/3] bg-[#eef5fd]"><Image src={publication.url} alt={publication.caption} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div> : null}
      <div className="p-4"><strong className="block text-sm text-[#15395f]">{publication.caption}</strong><small className="mt-1 block text-[#6e89a8]">{child?.first_name} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${publication.activity_date}T12:00:00Z`))}</small></div>
    </article>; })}{!gallery.length ? <div className="rounded-3xl border border-dashed border-[#cbdff4] bg-white p-10 text-center text-xs text-[#7890aa]"><Images className="mx-auto mb-2 text-[#6ba4dd]" size={28} /> Nenhuma publicação disponível.</div> : null}</section>
  </div>;
}
