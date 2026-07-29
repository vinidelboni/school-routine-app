import Image from "next/image";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";

export default async function FamilyPhotosPage() {
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: photos } = await supabase.from("photo_publications").select("id, storage_path, caption, activity_date, photo_children(children(first_name))").order("activity_date", { ascending: false }).limit(30);
  const gallery = await Promise.all((photos ?? []).map(async (photo) => {
    const { data } = await supabase.storage.from("school-photos").createSignedUrl(photo.storage_path, 3600);
    return { ...photo, url: data?.signedUrl };
  }));
  return <div><header><span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">MOMENTOS DA ESCOLA</span><h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Fotos</h1><p className="mt-2 text-sm text-[#69746f]">Somente imagens em que sua criança foi identificada e estava autorizada.</p></header><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{gallery.map((photo) => { const child = Array.isArray(photo.photo_children[0]?.children) ? photo.photo_children[0]?.children[0] : photo.photo_children[0]?.children; return <article key={photo.id} className="overflow-hidden rounded-2xl border border-[#dfe1d9] bg-white">{photo.url ? <div className="relative aspect-[4/3] bg-[#eef0ed]"><Image src={photo.url} alt={photo.caption} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div> : null}<div className="p-4"><strong className="block text-sm">{photo.caption}</strong><small className="mt-1 block text-[#7c8680]">{child?.first_name} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${photo.activity_date}T12:00:00Z`))}</small></div></article>; })}{!gallery.length ? <div className="rounded-2xl border border-dashed border-[#dfe1d9] bg-white p-10 text-center text-xs text-[#7c8680]"><Camera className="mx-auto mb-2" size={24} /> Nenhuma foto disponível.</div> : null}</section></div>;
}
