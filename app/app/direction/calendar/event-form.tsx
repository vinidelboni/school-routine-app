"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { createSchoolEvent } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type Option = { id: string; name: string };

export function EventForm({ classrooms, childOptions }: { classrooms: Option[]; childOptions: Option[] }) {
  const [scope, setScope] = useState("school");
  const [requiresResponse, setRequiresResponse] = useState(false);

  return (
    <form action={createSchoolEvent} className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
      <span className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]"><CalendarPlus size={15} /> NOVO COMPROMISSO</span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Adicionar ao calendário</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Tipo</span><select name="kind" className="input"><option value="event">Evento</option><option value="meeting">Reunião</option><option value="trip">Passeio</option></select></label>
        <label><span className="field-label">Público</span><select name="scope" value={scope} onChange={(event) => setScope(event.target.value)} className="input"><option value="school">Toda a escola</option><option value="classroom">Uma turma</option><option value="child">Uma criança</option></select></label>
        {scope === "classroom" ? <label className="sm:col-span-2"><span className="field-label">Turma</span><select name="classroomId" required className="input"><option value="">Selecione</option>{classrooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <input type="hidden" name="classroomId" value="" />}
        {scope === "child" ? <label className="sm:col-span-2"><span className="field-label">Criança</span><select name="childId" required className="input"><option value="">Selecione</option>{childOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <input type="hidden" name="childId" value="" />}
        <label className="sm:col-span-2"><span className="field-label">Título</span><input name="title" required maxLength={120} className="input" placeholder="Ex.: Reunião de responsáveis" /></label>
        <label><span className="field-label">Início</span><input name="startsAt" type="datetime-local" required className="input" /></label>
        <label><span className="field-label">Encerramento opcional</span><input name="endsAt" type="datetime-local" className="input" /></label>
        <label className="sm:col-span-2"><span className="field-label">Local opcional</span><input name="location" maxLength={160} className="input" placeholder="Ex.: Auditório da escola" /></label>
        <label className="sm:col-span-2"><span className="field-label">Descrição</span><textarea name="description" required minLength={3} maxLength={2000} rows={3} className="w-full rounded-xl border border-[#dce6f2] bg-[#fbfdff] p-3 text-xs outline-none focus:border-[#5aa0df] focus:ring-4 focus:ring-[#116fd1]/10" placeholder="Orientações importantes para as famílias." /></label>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#dce6f2] bg-[#f7fbff] p-3 text-xs"><input name="requiresResponse" type="checkbox" checked={requiresResponse} onChange={(event) => setRequiresResponse(event.target.checked)} className="mt-0.5" /><span><strong className="block">Solicitar confirmação de presença</strong><small className="mt-1 block text-[10px] text-[#61758d]">A família responderá “Participarei” ou “Não participarei”.</small></span></label>
      {requiresResponse ? <label className="mt-3 block"><span className="field-label">Prazo para resposta</span><input name="responseDeadline" type="date" required className="input" /></label> : <input type="hidden" name="responseDeadline" value="" />}
      <SubmitButton idleLabel="Publicar compromisso" pendingLabel="Publicando..." className="mt-4 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white" />
    </form>
  );
}
