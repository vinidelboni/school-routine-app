"use client";

import { useActionState, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { importRoster, type RosterImportState } from "../../actions";

type RosterRow = {
  firstName: string;
  lastName: string;
  birthDate: string;
  schedule: "morning" | "afternoon" | "full" | "custom";
  expectedStart: string;
  expectedEnd: string;
};

const initialState: RosterImportState = { status: "idle", message: "" };
const expectedHeader = "nome,sobrenome,nascimento,jornada,entrada,saida";
const scheduleAliases: Record<string, RosterRow["schedule"]> = {
  manhã: "morning",
  manha: "morning",
  tarde: "afternoon",
  integral: "full",
  personalizado: "custom",
};

function parseCsv(content: string): RosterRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines[0]?.toLocaleLowerCase("pt-BR") !== expectedHeader) {
    throw new Error(`Cabeçalho esperado: ${expectedHeader}`);
  }
  return lines.slice(1).map((line, index) => {
    const [firstName, lastName, birthDate, rawSchedule, start, end] = line
      .split(",")
      .map((value) => value.trim());
    const schedule = scheduleAliases[rawSchedule?.toLocaleLowerCase("pt-BR")];
    if (!firstName || !lastName || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !schedule) {
      throw new Error(`Linha ${index + 2} inválida.`);
    }
    const defaults = {
      morning: ["07:30", "12:00"],
      afternoon: ["12:30", "17:30"],
      full: ["07:30", "17:30"],
      custom: [start, end],
    }[schedule];
    if (!/^\d{2}:\d{2}$/.test(defaults[0]) || !/^\d{2}:\d{2}$/.test(defaults[1])) {
      throw new Error(`Horários inválidos na linha ${index + 2}.`);
    }
    return {
      firstName,
      lastName,
      birthDate,
      schedule,
      expectedStart: defaults[0],
      expectedEnd: defaults[1],
    };
  });
}

export function ImportRoster({ classroomId }: { classroomId: string }) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [state, formAction, pending] = useActionState(importRoster, initialState);
  const rosterJson = useMemo(() => JSON.stringify(rows), [rows]);

  async function readFile(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length > 100) throw new Error("O lote pode ter no máximo 100 crianças.");
      setRows(parsed);
      setParseError("");
    } catch (error) {
      setRows([]);
      setParseError(error instanceof Error ? error.message : "Arquivo inválido.");
    }
  }

  return (
    <div className="rounded-2xl border border-[#dfe1d9] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong className="flex items-center gap-2 text-sm">
            <FileSpreadsheet size={17} className="text-[#42715d]" />
            Importação em lote
          </strong>
          <p className="mt-1 text-xs text-[#7c8680]">
            Selecione o CSV, confira a prévia e confirme o lote.
          </p>
        </div>
        <a
          download="modelo-alunos-laco.csv"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(`${expectedHeader}\nLaura,Silva,2023-03-14,Integral,07:30,17:30\n`)}`}
          className="flex items-center gap-2 rounded-xl border border-[#98b3a4] px-4 py-2.5 text-xs font-bold text-[#315645]"
        >
          <Download size={15} /> Baixar modelo
        </a>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#9db2a6] bg-[#f7faf7] p-5 text-xs font-bold text-[#315645]">
        <Upload size={17} /> Selecionar arquivo CSV
        <input
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void readFile(event.target.files?.[0])}
        />
      </label>

      {parseError ? <p className="mt-3 text-xs font-bold text-[#a34f45]">{parseError}</p> : null}

      {rows.length > 0 ? (
        <form action={formAction} className="mt-4">
          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="rosterJson" value={rosterJson} />
          <div className="max-h-64 overflow-auto rounded-xl border border-[#e5e5df]">
            <div className="grid grid-cols-[1.2fr_.8fr_.7fr] bg-[#f3f3ef] px-3 py-2 text-[9px] font-extrabold uppercase text-[#758079]">
              <span>Criança</span><span>Nascimento</span><span>Jornada</span>
            </div>
            {rows.map((row, index) => (
              <div key={`${row.firstName}-${row.lastName}-${index}`} className="grid grid-cols-[1.2fr_.8fr_.7fr] border-t border-[#ecece7] px-3 py-2.5 text-[10px]">
                <strong>{row.firstName} {row.lastName}</strong>
                <span>{row.birthDate}</span>
                <span>{row.schedule}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span aria-live="polite" className={`text-xs ${state.status === "error" ? "text-[#a34f45]" : "text-[#42715d]"}`}>
              {state.message || `${rows.length} linhas prontas para confirmação.`}
            </span>
            <button disabled={pending} className="rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">
              {pending ? "Importando..." : `Confirmar ${rows.length} cadastros`}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
