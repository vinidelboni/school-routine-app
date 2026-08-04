"use client";

import Image from "next/image";
import { Camera, LoaderCircle, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateTeacherAvatar } from "./actions";

export function AvatarUploadForm({ avatarUrl, initial }: { avatarUrl?: string; initial: string }) {
  const [preview, setPreview] = useState<string>();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return (
    <form action={updateTeacherAvatar} className="mt-4 rounded-2xl border border-white/15 bg-[#073f91]/30 p-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/35 bg-white/15 font-[var(--font-display)] text-xl font-black">
          {preview || avatarUrl ? <Image src={preview ?? avatarUrl!} alt="Foto de perfil" fill sizes="64px" unoptimized={Boolean(preview)} className="object-cover" /> : initial}
        </span>
        <label className="min-w-0 flex-1 cursor-pointer"><strong className="flex items-center gap-2 text-xs"><Camera size={15} /> Escolher uma foto</strong><small className="mt-1 block text-[9px] text-[#c9e5ff]">JPG, PNG ou WebP · até 3 MB</small><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; setPreview((current) => { if (current) URL.revokeObjectURL(current); return file ? URL.createObjectURL(file) : undefined; }); }} /></label>
        <AvatarSubmit disabled={!preview} />
      </div>
    </form>
  );
}

function AvatarSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={disabled || pending} className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-[9px] font-extrabold text-[#1768c5] shadow-sm disabled:opacity-50">{pending ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}{pending ? "Enviando" : "Salvar"}</button>;
}
