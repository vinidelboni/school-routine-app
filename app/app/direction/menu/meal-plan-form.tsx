"use client";

import { useState } from "react";
import { Soup } from "lucide-react";
import { saveMealPlan } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

export function MealPlanForm({ classrooms }: { classrooms: Array<{ id: string; name: string }> }) {
  const [scope, setScope] = useState("school");
  return (
    <form action={saveMealPlan} className="rounded-2xl border border-[#dce6f2] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,112,.05)]">
      <span className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]"><Soup size={16} /> NOVA REFEIÇÃO</span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">Planejar cardápio</h2>
      <p className="mt-1 text-xs leading-5 text-[#61758d]">Se já existir uma refeição no mesmo dia e horário, ela será atualizada.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Público</span><select name="scope" value={scope} onChange={(event) => setScope(event.target.value)} className="input"><option value="school">Toda a escola</option><option value="classroom">Uma turma</option></select></label>
        {scope === "classroom" ? <label><span className="field-label">Turma</span><select name="classroomId" required className="input"><option value="">Selecione</option>{classrooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <input type="hidden" name="classroomId" value="" />}
        <label><span className="field-label">Data</span><input name="serviceDate" type="date" required className="input" /></label>
        <label><span className="field-label">Refeição</span><select name="mealType" className="input"><option value="breakfast">Café da manhã</option><option value="morning_snack">Lanche da manhã</option><option value="lunch">Almoço</option><option value="afternoon_snack">Lanche da tarde</option><option value="bottle">Mamadeira</option><option value="dinner">Jantar</option></select></label>
        <label className="sm:col-span-2"><span className="field-label">Prato ou preparação</span><input name="title" required minLength={2} maxLength={120} className="input" placeholder="Ex.: Arroz, feijão, frango e legumes" /></label>
        <label className="sm:col-span-2"><span className="field-label">Descrição opcional</span><textarea name="description" maxLength={1000} rows={3} className="w-full rounded-xl border border-[#dce6f2] bg-[#fbfdff] p-3 text-xs outline-none focus:border-[#5aa0df] focus:ring-4 focus:ring-[#116fd1]/10" placeholder="Fruta, bebida, modo de preparo ou substituições." /></label>
        <label className="sm:col-span-2"><span className="field-label">Alergênicos e observações</span><input name="allergenNotes" maxLength={500} className="input" placeholder="Ex.: Contém leite e derivados" /></label>
      </div>
      <SubmitButton idleLabel="Salvar no cardápio" pendingLabel="Salvando..." className="mt-4 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white" />
    </form>
  );
}
