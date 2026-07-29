"use client";

import { useState } from "react";
import { FileSearch, UploadCloud } from "lucide-react";
import { createBillingBatch } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type ChildOption = { id: string; name: string };
type Preview = {
  filename: string;
  childId: string;
  confidence: number;
  dueDate: string;
  paymentReference: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ");
}

export function BatchUploader({
  childOptions,
  defaultMonth,
  defaultDueDate,
}: {
  childOptions: ChildOption[];
  defaultMonth: string;
  defaultDueDate: string;
}) {
  const [documents, setDocuments] = useState<Preview[]>([]);

  function analyze(files: FileList | null) {
    if (!files) return;
    const pdfs = [...files].filter((file) =>
      file.name.toLowerCase().endsWith(".pdf"),
    );
    setDocuments(
      pdfs.map((file, index) => {
        const filename = normalize(file.name);
        const fullMatch = childOptions.find((child) =>
          filename.includes(normalize(child.name).trim()),
        );
        const firstMatch =
          fullMatch ??
          childOptions.find((child) =>
            filename.includes(normalize(child.name.split(" ")[0]).trim()),
          );
        return {
          filename: file.name,
          childId: firstMatch?.id ?? "",
          confidence: fullMatch ? 96 : firstMatch ? 78 : 0,
          dueDate: defaultDueDate,
          paymentReference: `MENS-${defaultMonth.slice(0, 7)}-${String(index + 1).padStart(3, "0")}`,
        };
      }),
    );
  }

  return (
    <form
      action={createBillingBatch}
      className="rounded-2xl border border-[#dfe1d9] bg-white p-5"
    >
      <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
        NOVO LOTE
      </span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
        Analisar vários PDFs
      </h2>
      <p className="mt-1 text-xs leading-5 text-[#69746f]">
        Pareamento demonstrativo pelo nome do arquivo. O conteúdo do PDF não é
        enviado nem armazenado nesta fase.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="field-label">Nome do lote</span>
          <input
            name="title"
            required
            defaultValue="Mensalidades da escola"
            className="input"
          />
        </label>
        <label>
          <span className="field-label">Mês de referência</span>
          <input
            name="referenceMonth"
            type="date"
            required
            defaultValue={defaultMonth}
            className="input"
          />
        </label>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#b9c7bf] bg-[#f8faf8] p-7 text-center">
        <UploadCloud size={26} className="text-[#315645]" />
        <strong className="mt-2 text-xs">Selecionar vários boletos em PDF</strong>
        <small className="mt-1 text-[10px] text-[#7c8680]">
          Use nomes como boleto-alice-moreira.pdf
        </small>
        <input
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={(event) => analyze(event.target.files)}
          className="sr-only"
        />
      </label>

      {documents.length ? (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-xs">
            <FileSearch size={17} className="text-[#557164]" />
            <strong>{documents.length} documento(s) analisado(s)</strong>
          </div>
          <div className="mt-3 grid gap-2">
            {documents.map((document, index) => (
              <div
                key={`${document.filename}-${index}`}
                className="grid gap-2 rounded-xl border border-[#e5e5df] p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <span className="min-w-0 text-xs">
                  <strong className="block truncate">{document.filename}</strong>
                  <small
                    className={
                      document.confidence >= 70
                        ? "text-[#47705d]"
                        : "text-[#9a623b]"
                    }
                  >
                    Confiança sugerida: {document.confidence}%
                  </small>
                </span>
                <select
                  aria-label={`Aluno para ${document.filename}`}
                  value={document.childId}
                  onChange={(event) =>
                    setDocuments((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              childId: event.target.value,
                              confidence: event.target.value ? 100 : 0,
                            }
                          : item,
                      ),
                    )
                  }
                  className="input"
                >
                  <option value="">Revisar pareamento</option>
                  {childOptions.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
                <span className="self-center rounded-full bg-[#eef3ef] px-2 py-1 text-[9px] font-bold text-[#315645]">
                  {document.childId ? "Pré-selecionado" : "Dúvida"}
                </span>
              </div>
            ))}
          </div>
          <input
            type="hidden"
            name="documentsJson"
            value={JSON.stringify(documents)}
          />
          <SubmitButton
            idleLabel="Criar lote para revisão"
            pendingLabel="Criando lote..."
            className="mt-4 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white"
          />
        </div>
      ) : null}
    </form>
  );
}
