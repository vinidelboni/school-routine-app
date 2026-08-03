"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileUp, LoaderCircle, UploadCloud } from "lucide-react";
import { publishSchoolDocument } from "../../actions";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Option = { id: string; name: string };
const MAX_PDF_SIZE = 10 * 1024 * 1024;

async function hasPdfSignature(file: File) {
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...signature) === "%PDF-";
}

export function DocumentUploader({
  schoolId,
  classrooms,
  childOptions,
}: {
  schoolId: string;
  classrooms: Option[];
  childOptions: Option[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [scope, setScope] = useState("school");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function uploadAndPublish(formData: FormData) {
    setPending(true);
    setError("");
    let storagePath = "";
    const supabase = getSupabaseBrowserClient();
    try {
      if (!file || file.size === 0 || file.size > MAX_PDF_SIZE) {
        throw new Error("Selecione um PDF de até 10 MB.");
      }
      if (file.type !== "application/pdf" || !(await hasPdfSignature(file))) {
        throw new Error("O arquivo selecionado não é um PDF válido.");
      }
      storagePath = `${schoolId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("school-documents")
        .upload(storagePath, file, {
          contentType: "application/pdf",
          cacheControl: "0",
          upsert: false,
        });
      if (uploadError) throw new Error("Não foi possível enviar o PDF.");

      formData.set("filename", file.name);
      formData.set("storagePath", storagePath);
      await publishSchoolDocument(formData);
      router.push("/app/direction/documents?success=document-published");
    } catch (cause) {
      if (storagePath) await supabase.storage.from("school-documents").remove([storagePath]);
      setError(cause instanceof Error ? cause.message : "Não foi possível publicar o documento.");
      setPending(false);
    }
  }

  return (
    <form action={uploadAndPublish} className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
      <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">NOVO DOCUMENTO</span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Publicar na biblioteca</h2>
      <p className="mt-1 text-xs leading-5 text-[#61758d]">O PDF ficará privado e disponível somente para os responsáveis selecionados.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="field-label">Título</span><input name="title" required maxLength={120} className="input" placeholder="Ex.: Manual da família 2026" /></label>
        <label><span className="field-label">Categoria</span><select name="category" className="input" defaultValue="circular"><option value="circular">Circular</option><option value="policy">Normas e políticas</option><option value="calendar">Calendário</option><option value="pedagogical">Pedagógico</option><option value="health">Saúde</option><option value="other">Outros</option></select></label>
        <label><span className="field-label">Público</span><select name="scope" value={scope} onChange={(event) => setScope(event.target.value)} className="input"><option value="school">Toda a escola</option><option value="classroom">Uma turma</option><option value="child">Uma criança</option></select></label>
        {scope === "classroom" ? <label className="sm:col-span-2"><span className="field-label">Turma</span><select name="classroomId" required className="input"><option value="">Selecione</option>{classrooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <input type="hidden" name="classroomId" value="" />}
        {scope === "child" ? <label className="sm:col-span-2"><span className="field-label">Criança</span><select name="childId" required className="input"><option value="">Selecione</option>{childOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <input type="hidden" name="childId" value="" />}
        <label className="sm:col-span-2"><span className="field-label">Descrição opcional</span><textarea name="description" maxLength={1000} rows={3} className="w-full rounded-xl border border-[#dce6f2] bg-[#fbfdff] p-3 text-xs outline-none focus:border-[#5aa0df] focus:ring-4 focus:ring-[#116fd1]/10" placeholder="Explique brevemente o conteúdo do documento." /></label>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#b9cee0] bg-[#f8fbff] p-7 text-center">
        <UploadCloud size={27} className="text-[#0759bd]" />
        <strong className="mt-2 text-xs">{file ? file.name : "Selecionar PDF"}</strong>
        <small className="mt-1 text-[10px] text-[#6f8299]">Arquivo PDF de até 10 MB</small>
        <input type="file" accept=".pdf,application/pdf" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" />
      </label>
      {error ? <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff0ed] p-3 text-xs font-bold text-[#9a3f32]"><AlertCircle size={16} />{error}</p> : null}
      <button disabled={pending || !file} className="mt-4 flex items-center gap-2 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">
        {pending ? <><LoaderCircle className="animate-spin" size={16} /> Publicando...</> : <><FileUp size={16} /> Publicar documento</>}
      </button>
    </form>
  );
}
