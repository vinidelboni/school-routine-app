"use client";

import { useState } from "react";
import { AlertCircle, Camera, LoaderCircle, ShieldAlert, UploadCloud, Video } from "lucide-react";
import { publishActivityMedia } from "../../actions";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const maxSize = 50 * 1024 * 1024;

export function MediaUploadForm({ schoolId, classroomId, childOptions }: { schoolId: string; classroomId: string; childOptions: Array<{ id: string; name: string; authorized: boolean }> }) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function uploadAndPublish(formData: FormData) {
    setError("");
    if (!file || !allowedTypes.includes(file.type) || !file.size || file.size > maxSize) {
      setError("Selecione uma foto ou vídeo válido de até 50 MB.");
      return;
    }
    setPending(true);
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (file.type.startsWith("video/") ? "mp4" : "jpg");
    const storagePath = `${schoolId}/${crypto.randomUUID()}.${extension}`;
    const supabase = getSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage.from("school-photos").upload(storagePath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (uploadError) { setError("Não foi possível enviar o arquivo. Tente novamente."); setPending(false); return; }
    try {
      formData.set("storagePath", storagePath);
      formData.set("mediaType", file.type.startsWith("video/") ? "video" : "image");
      formData.set("mimeType", file.type);
      formData.set("fileSize", String(file.size));
      await publishActivityMedia(formData);
    } catch (cause) {
      await supabase.storage.from("school-photos").remove([storagePath]);
      setError(cause instanceof Error ? cause.message : "Não foi possível publicar na galeria.");
      setPending(false);
    }
  }

  return (
    <form action={uploadAndPublish} className="mt-6 max-w-3xl rounded-2xl border border-[#dce6f2] bg-white p-5">
      <input type="hidden" name="classroomId" value={classroomId} />
      <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#b9cee0] bg-[#f8fbff] p-7 text-center">
        <UploadCloud size={27} className="text-[#0759bd]" /><strong className="mt-2 text-xs">Selecionar foto ou vídeo</strong><small className="mt-1 text-[10px] text-[#6f8299]">JPG, PNG, WebP, MP4, MOV ou WebM · até 50 MB</small>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); }} className="sr-only" required />
      </label>
      {file ? <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#edf5fd] p-3 text-xs text-[#0759bd]">{file.type.startsWith("video/") ? <Video size={18} /> : <Camera size={18} />}<span className="min-w-0 flex-1"><strong className="block truncate">{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span></div> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold">Data da atividade<input type="date" name="activityDate" className="input" required /></label><label className="grid gap-1.5 text-xs font-bold sm:col-span-2">Legenda<textarea name="caption" rows={3} className="min-h-24 rounded-xl border border-[#dce6f2] bg-[#fbfdff] p-3 text-xs" required /></label></div>
      <fieldset className="mt-5"><legend className="text-xs font-bold">Quem aparece na publicação?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{childOptions.map((child) => <label key={child.id} className={`flex items-center gap-3 rounded-xl border p-3 text-xs ${child.authorized ? "border-[#b9d6f3] bg-[#f5faff]" : "border-[#e4c6ac] bg-[#fff8ed]"}`}><input type="checkbox" name="childId" value={child.id} disabled={!child.authorized} /><span><strong className="block">{child.name}</strong><small className={child.authorized ? "text-[#0759bd]" : "text-[#9a623b]"}>{child.authorized ? "Autorização válida" : "Publicação bloqueada"}</small></span>{!child.authorized ? <ShieldAlert className="ml-auto text-[#9a623b]" size={16} /> : null}</label>)}</div></fieldset>
      {error ? <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff0ed] p-3 text-xs font-bold text-[#9a3f32]"><AlertCircle size={16} />{error}</p> : null}
      <button disabled={pending || !file} className="mt-5 flex items-center gap-2 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{pending ? <><LoaderCircle className="animate-spin" size={16} /> Enviando...</> : <><UploadCloud size={16} /> Verificar e publicar</>}</button>
    </form>
  );
}
