"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, RotateCcw, Send, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

const children = [
  { id: "alice", name: "Alice Moreira", schedule: "Integral", time: "07:30–17:30" },
  { id: "bento", name: "Bento Ribeiro", schedule: "Integral", time: "07:30–17:30" },
  { id: "cecilia", name: "Cecília Alves", schedule: "Manhã", time: "07:30–12:00" },
  { id: "davi", name: "Davi Santos", schedule: "Integral", time: "07:30–17:30" },
];

const modules = [
  { id: "meal", label: "Alimentação", required: true, options: ["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"] },
  { id: "hydration", label: "Hidratação", required: true, options: ["Hidratou-se normalmente", "Bebeu pouco", "Recusou água"] },
  { id: "sleep", label: "Sono", required: false, options: ["Dormiu bem", "Sono curto", "Não dormiu"] },
  { id: "hygiene", label: "Higiene", required: false, options: ["Sem observações", "Evacuou", "Precisou de troca extra"] },
  { id: "activity", label: "Atividade", required: true, options: ["Participou", "Participou com apoio", "Preferiu observar"] },
] as const;

type Shift = "morning" | "afternoon";
type Values = Record<string, string>;

export default function TeacherSimulationPage() {
  const [shift, setShift] = useState<Shift>("morning");
  const [present, setPresent] = useState<Record<Shift, boolean>>({ morning: false, afternoon: false });
  const [values, setValues] = useState<Record<Shift, Values>>({ morning: {}, afternoon: {} });
  const [published, setPublished] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const visibleChildren = shift === "morning" ? children : children.filter((child) => child.schedule === "Integral");
  const requiredComplete = modules.filter((module) => module.required).every((module) => visibleChildren.every((child) => values[shift][`${module.id}:${child.id}`]));
  const shiftComplete = present[shift] && requiredComplete;
  const completedModules = useMemo(() => modules.filter((module) => visibleChildren.every((child) => values[shift][`${module.id}:${child.id}`])).length, [shift, values, visibleChildren]);

  function applyModule(moduleId: string, defaultValue: string) {
    setValues((current) => ({ ...current, [shift]: { ...current[shift], ...Object.fromEntries(visibleChildren.map((child) => [`${moduleId}:${child.id}`, defaultValue])) } }));
  }

  function reset() {
    if (!window.confirm("Reiniciar toda a simulação? Os dados reais do aplicativo não serão afetados.")) return;
    setShift("morning"); setPresent({ morning: false, afternoon: false }); setValues({ morning: {}, afternoon: {} }); setPublished(false); setHandoff(false);
  }

  return (
    <div>
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0759bd] via-[#0b6ed1] to-[#19a5e9] px-6 py-7 text-white shadow-[0_18px_45px_rgba(7,89,189,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-60 w-60 rounded-full border-[42px] border-white/[.07]" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div><span className="flex items-center gap-2 text-[9px] font-extrabold tracking-[.16em] text-[#c3e5ff]"><Sparkles size={14} /> AMBIENTE DE SIMULAÇÃO</span><h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Experimente um dia completo</h1><p className="mt-2 max-w-2xl text-sm text-[#d8ecff]">Teste livremente. Nenhuma ação desta tela altera os dados da escola ou da família.</p></div>
          <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-[10px] font-bold backdrop-blur"><RotateCcw size={15} /> Reiniciar</button>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:max-w-xl"><Summary label="Turno" value={shift === "morning" ? "Manhã" : "Tarde"} /><Summary label="Crianças" value={visibleChildren.length} /><Summary label="Módulos" value={`${completedModules}/${modules.length}`} /></div>
      </header>

      {published ? <section role="status" className="mt-5 rounded-2xl border border-[#a9d6bd] bg-[#edf9f2] p-6 text-center"><CheckCircle2 className="mx-auto text-[#238653]" size={30} /><h2 className="mt-3 font-[var(--font-display)] text-xl font-bold text-[#1f6844]">Agendas publicadas na simulação</h2><p className="mt-1 text-xs text-[#56806a]">Você concluiu chamada, registros, exceções e fechamento do dia.</p><button onClick={reset} className="mt-4 rounded-xl bg-[#1768c5] px-5 py-3 text-xs font-bold text-white">Simular novamente</button></section> : <>
        <div className="mt-5 flex items-center justify-between gap-3"><nav aria-label="Turno simulado" className="inline-flex rounded-2xl border border-[#d8e5f2] bg-white p-1 shadow-sm"><button onClick={() => setShift("morning")} className={`rounded-xl px-5 py-2.5 text-xs font-bold ${shift === "morning" ? "bg-[#1768c5] text-white" : "text-[#61758d]"}`}>Manhã</button><button onClick={() => setShift("afternoon")} disabled={!handoff} className={`rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-40 ${shift === "afternoon" ? "bg-[#1768c5] text-white" : "text-[#61758d]"}`}>Tarde</button></nav><Link href="/app/teacher" className="text-[10px] font-bold text-[#607994]">Sair da simulação</Link></div>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
          <div className="space-y-4">
            <article className="rounded-2xl bg-gradient-to-br from-[#09295e] to-[#0759bd] p-6 text-white"><span className="text-[9px] font-extrabold tracking-[.14em] text-[#9ed5ff]">MATERNAL I · {shift === "morning" ? "MANHÃ" : "TARDE"}</span><strong className="mt-3 block font-[var(--font-display)] text-2xl">{visibleChildren.length} crianças previstas</strong><div className="mt-5 space-y-2">{visibleChildren.map((child) => <div key={child.id} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-xs"><span>{child.name.split(" ")[0]} · {child.schedule}</span><small className="text-[#c8e3ff]">{child.time}</small></div>)}</div></article>
            <article className="rounded-2xl border border-[#d8e5f2] bg-white p-5"><strong className="flex items-center gap-2 text-sm"><Users size={17} className="text-[#1768c5]" /> Chamada coletiva</strong><p className="mt-2 text-xs leading-5 text-[#6f8299]">Primeiro confirme a presença do grupo previsto.</p><button onClick={() => setPresent((current) => ({ ...current, [shift]: true }))} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${present[shift] ? "bg-[#eaf7f0] text-[#27744d]" : "bg-[#1768c5] text-white"}`}><Check size={16} /> {present[shift] ? "Chamada concluída" : "Marcar grupo presente"}</button></article>
          </div>

          <div className="space-y-4">{modules.map((module) => { const complete = visibleChildren.every((child) => values[shift][`${module.id}:${child.id}`]); return <article key={module.id} className="overflow-hidden rounded-2xl border border-[#d8e5f2] bg-white"><div className="border-b border-[#e8eef5] p-5"><div className="flex items-start justify-between gap-3"><span><h2 className="font-[var(--font-display)] text-xl font-bold">{module.label}</h2><small className="text-[10px] text-[#6f8299]">{module.required ? "Obrigatório" : "Opcional"} · {complete ? `${visibleChildren.length}/${visibleChildren.length}` : `0/${visibleChildren.length}`} registrados</small></span>{complete ? <CheckCircle2 size={20} className="text-[#1768c5]" /> : null}</div><div className="mt-4 grid gap-2 sm:grid-cols-3">{module.options.map((option) => <button key={option} disabled={!present[shift]} onClick={() => applyModule(module.id, option)} className="rounded-xl border border-[#d8e5f2] px-3 py-3 text-[10px] font-bold text-[#516b86] transition hover:border-[#1768c5] hover:bg-[#eef7ff] disabled:opacity-40">Aplicar: {option}</button>)}</div></div><div>{visibleChildren.map((child) => <label key={child.id} className="grid grid-cols-[1fr_155px] items-center gap-3 border-b border-[#edf1f6] px-5 py-3 last:border-0"><span><strong className="block text-xs">{child.name}</strong><small className="text-[9px] text-[#8493a5]">{child.schedule}</small></span><select disabled={!present[shift]} value={values[shift][`${module.id}:${child.id}`] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [shift]: { ...current[shift], [`${module.id}:${child.id}`]: event.target.value } }))} className="h-10 rounded-lg border border-[#d8e5f2] bg-[#f7faff] px-2 text-[10px]"><option value="">Sem registro</option>{module.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></article>; })}</div>
        </section>

        {shift === "morning" ? <section className="mt-5 rounded-2xl border border-[#cfe1f3] bg-[#eef7ff] p-5"><strong className="flex items-center gap-2 text-sm"><ArrowRight size={17} /> Passagem para a tarde</strong><p className="mt-1 text-xs text-[#6f8299]">Disponível depois de concluir presença e módulos obrigatórios.</p><button disabled={!shiftComplete} onClick={() => { setHandoff(true); setShift("afternoon"); }} className="mt-4 rounded-xl bg-[#1768c5] px-5 py-3 text-xs font-bold text-white disabled:opacity-40">Registrar passagem e abrir tarde</button></section> : <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#cfe1f3] bg-[#eef7ff] p-5"><span><strong className="flex items-center gap-2 text-sm"><ClipboardCheck size={17} /> Revisar e publicar</strong><small className="mt-1 block text-[10px] text-[#6f8299]">{shiftComplete ? "Tudo pronto para a família." : "Conclua presença e módulos obrigatórios."}</small></span><button disabled={!shiftComplete} onClick={() => setPublished(true)} className="flex items-center gap-2 rounded-xl bg-[#1768c5] px-5 py-3 text-xs font-bold text-white disabled:opacity-40"><Send size={16} /> Publicar agendas</button></section>}
      </>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/15 bg-[#073f91]/35 px-3 py-3 backdrop-blur"><small className="block text-[8px] font-bold uppercase tracking-[.1em] text-[#bfe2ff]">{label}</small><strong className="mt-1 block truncate text-sm text-white">{value}</strong></div>; }
