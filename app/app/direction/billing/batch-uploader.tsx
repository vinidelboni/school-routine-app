"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileSearch, LoaderCircle, UploadCloud } from "lucide-react";
import { createBillingBatch } from "../../actions";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";

type ChildOption = { id: string; name: string };
type Preview = {
  filename: string;
  childId: string;
  confidence: number;
  dueDate: string;
  paymentReference: string;
  storagePath: string;
  fileIndex: number;
};

const MAX_PDF_SIZE = 10 * 1024 * 1024;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, " ");
}

function normalizeBarcode(value: string) {
  return value.replace(/\D/g, "").slice(0, 48);
}

async function isPdf(file: File) {
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...signature) === "%PDF-";
}

export function BatchUploader({
  childOptions,
  defaultMonth,
  defaultDueDate,
  schoolId,
}: {
  childOptions: ChildOption[];
  defaultMonth: string;
  defaultDueDate: string;
  schoolId: string;
}) {
  const [documents, setDocuments] = useState<Preview[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function analyze(selected: FileList | null) {
    if (!selected) return;
    const pdfs = [...selected].filter((file) => file.name.toLowerCase().endsWith(".pdf"));
    setFiles(pdfs);
    setError("");
    setDocuments(
      pdfs.map((file, index) => {
        const filename = normalize(file.name);
        const fullMatch = childOptions.find((child) => filename.includes(normalize(child.name).trim()));
        const firstMatch = fullMatch ?? childOptions.find((child) => filename.includes(normalize(child.name.split(" ")[0]).trim()));
        return {
          filename: file.name,
          childId: firstMatch?.id ?? "",
          confidence: fullMatch ? 96 : firstMatch ? 78 : 0,
          dueDate: defaultDueDate,
          paymentReference: "",
          storagePath: `${schoolId}/${crypto.randomUUID()}.pdf`,
          fileIndex: index,
        };
      }),
    );
  }

  function updateDocument(index: number, values: Partial<Preview>) {
    setDocuments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  }

  async function uploadAndCreateBatch(formData: FormData) {
    setPending(true);
    setError("");
    const uploaded: string[] = [];
    const supabase = getSupabaseBrowserClient();

    try {
      if (files.length !== documents.length) throw new Error("Selecione novamente os PDFs do lote.");
      for (const document of documents) {
        const file = files[document.fileIndex];
        if (!file || file.size === 0 || file.size > MAX_PDF_SIZE) {
          throw new Error(`${document.filename}: o PDF deve ter no máximo 10 MB.`);
        }
        if (file.type !== "application/pdf" || !(await isPdf(file))) {
          throw new Error(`${document.filename}: o arquivo não é um PDF válido.`);
        }
        const { error: uploadError } = await supabase.storage
          .from("billing-documents")
          .upload(document.storagePath, file, {
            contentType: "application/pdf",
            cacheControl: "0",
            upsert: false,
          });
        if (uploadError) throw new Error(`Não foi possível enviar ${document.filename}.`);
        uploaded.push(document.storagePath);
      }

      formData.set("documentsJson", JSON.stringify(documents));
      const batchId = await createBillingBatch(formData);
      router.push(`/app/direction/billing?batch=${batchId}&success=batch-created`);
    } catch (cause) {
      if (uploaded.length) await supabase.storage.from("billing-documents").remove(uploaded);
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o lote.");
      setPending(false);
    }
  }

  return (
    <form action={uploadAndCreateBatch} className="rounded-2xl border border-[#dce6f2] bg-white p-5">
      <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">NOVO LOTE</span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Enviar vários PDFs</h2>
      <p className="mt-1 text-xs leading-5 text-[#61758d]">
        Os PDFs ficam em armazenamento privado. Revise a criança e informe a linha digitável antes de criar o lote.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Nome do lote</span><input name="title" required defaultValue="Mensalidades da escola" className="input" /></label>
        <label><span className="field-label">Mês de referência</span><input name="referenceMonth" type="date" required defaultValue={defaultMonth} className="input" /></label>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#b9cee0] bg-[#f8fbff] p-7 text-center">
        <UploadCloud size={26} className="text-[#0759bd]" />
        <strong className="mt-2 text-xs">Selecionar vários boletos em PDF</strong>
        <small className="mt-1 text-[10px] text-[#6f8299]">PDF de até 10 MB · use nomes como boleto-alice-moreira.pdf</small>
        <input type="file" accept=".pdf,application/pdf" multiple onChange={(event) => analyze(event.target.files)} className="sr-only" />
      </label>

      {documents.length ? (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-xs"><FileSearch size={17} className="text-[#386b9f]" /><strong>{documents.length} documento(s) selecionado(s)</strong></div>
          <div className="mt-3 grid gap-3">
            {documents.map((document, index) => (
              <div key={document.storagePath} className="grid gap-3 rounded-xl border border-[#e3eaf2] p-3 sm:grid-cols-2">
                <span className="min-w-0 text-xs sm:col-span-2">
                  <strong className="block truncate">{document.filename}</strong>
                  <small className={document.confidence >= 70 ? "text-[#176bc2]" : "text-[#9a623b]"}>Confiança sugerida: {document.confidence}%</small>
                </span>
                <label>
                  <span className="field-label">Criança</span>
                  <select aria-label={`Aluno para ${document.filename}`} value={document.childId} onChange={(event) => updateDocument(index, { childId: event.target.value, confidence: event.target.value ? 100 : 0 })} className="input" required>
                    <option value="">Revisar pareamento</option>
                    {childOptions.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="field-label">Vencimento</span>
                  <input type="date" className="input" value={document.dueDate} onChange={(event) => updateDocument(index, { dueDate: event.target.value })} required />
                </label>
                <label className="sm:col-span-2">
                  <span className="field-label">Linha digitável / código de barras</span>
                  <input inputMode="numeric" autoComplete="off" className="input font-mono" value={document.paymentReference} onChange={(event) => updateDocument(index, { paymentReference: normalizeBarcode(event.target.value) })} minLength={44} maxLength={48} placeholder="Cole os 44, 47 ou 48 números" required />
                  <small className="mt-1 block text-[9px] text-[#6f8299]">Somente números · {document.paymentReference.length}/48</small>
                </label>
              </div>
            ))}
          </div>
          <input type="hidden" name="documentsJson" value={JSON.stringify(documents)} />
          {error ? <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff0ed] p-3 text-xs font-bold text-[#9a3f32]"><AlertCircle size={16} />{error}</p> : null}
          <button disabled={pending} className="mt-4 flex items-center gap-2 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-70">
            {pending ? <><LoaderCircle className="animate-spin" size={16} /> Enviando PDFs...</> : "Enviar PDFs e criar lote"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
