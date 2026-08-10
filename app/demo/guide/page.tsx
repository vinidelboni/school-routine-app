import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";

const password = "LacoValidacao!2026";
const steps = [
  { number: "01", role: "Direção", title: "Comece pelo problema", description: "Mostre turmas, jornadas e uma rotina configurada para a realidade da escola.", href: "/app/direction/registry", icon: Users, login: "direcao@laco.validacao", proof: "A escola adapta o sistema — não o contrário." },
  { number: "02", role: "Professora", title: "Prove a economia de tempo", description: "Registre alimentação para a turma e altere somente duas exceções.", href: "/app/teacher", icon: BookOpen, login: "professora@laco.validacao", proof: "Menos preenchimento sem transformar falta de dado em normalidade." },
  { number: "03", role: "Família", title: "Entregue clareza", description: "Abra diário, alimentação e avisos na experiência móvel da família.", href: "/app/family", icon: CheckCircle2, login: "familia@laco.validacao", proof: "Tudo encontrável em poucos segundos, sem chat aberto." },
  { number: "04", role: "Direção", title: "Mostre responsabilidade", description: "Publique comunicados, acompanhe ciência e trate ocorrências pela direção.", href: "/app/direction/communications", icon: Megaphone, login: "direcao@laco.validacao", proof: "Informações sensíveis permanecem sob controle da escola." },
  { number: "05", role: "Direção", title: "Apresente a automação", description: "Envie PDFs em lote, revise os pareamentos e distribua os boletos.", href: "/app/direction/billing", icon: FileText, login: "direcao@laco.validacao", proof: "A IA sugere; a direção valida antes de enviar." },
  { number: "06", role: "Professora", title: "Reforce a privacidade", description: "Publique mídia somente para crianças com autorização registrada.", href: "/app/teacher/photos", icon: Camera, login: "professora@laco.validacao", proof: "Privacidade por vínculo, sem reconhecimento facial." },
  { number: "07", role: "Direção", title: "Feche com gestão", description: "Mostre pendências e engajamento com contexto, sem rankings superficiais.", href: "/app/direction/team-engagement", icon: LayoutDashboard, login: "direcao@laco.validacao", proof: "A direção termina sabendo onde agir amanhã." },
];

export default function DemoGuidePage() {
  return (
    <main className="presentation-shell min-h-dvh overflow-hidden bg-[#020d24] px-5 py-6 text-white md:py-9">
      <div className="landing-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="overflow-hidden rounded-[2rem] border border-[#1faef5]/20 bg-gradient-to-br from-[#082a63] via-[#061d46] to-[#03132f] p-6 shadow-[0_30px_90px_rgba(0,0,0,.28)] md:p-10 lg:p-12">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-[10px] font-bold text-[#a9caeb] transition hover:text-white"><ArrowLeft size={15} /> Voltar ao site</Link>
            <span className="flex items-center gap-2 rounded-full border border-[#3dc5ff]/20 bg-[#0b8de4]/10 px-3 py-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#65ceff]"><Clock3 size={13} /> 15 a 20 minutos</span>
          </div>
          <div className="mt-14 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div><span className="landing-kicker">ROTEIRO DE APRESENTAÇÃO</span><h1 className="mt-4 max-w-4xl font-[var(--font-display)] text-4xl font-semibold leading-[1.03] tracking-[-.06em] md:text-6xl">Conte uma história.<br /><span className="landing-gradient-text">Não uma lista de funções.</span></h1><p className="mt-6 max-w-2xl text-sm leading-7 text-[#a7c0dc]">Cada etapa conecta um problema real da escola a uma ação simples no SomaMais e a uma evidência que vale validar com quem decide.</p></div>
            <Image src="/icons/somamais-192.png" alt="SomaMais" width={112} height={112} priority className="hidden rounded-[28px] shadow-[0_25px_60px_rgba(0,125,255,.3)] lg:block" />
          </div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center rounded-2xl border border-white/[.08] bg-white/[.045] p-5 backdrop-blur-xl md:p-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b83df]/20 text-[#5bcaff]"><LockKeyhole size={19} /></span><span><strong className="text-sm">Credenciais da demonstração</strong><p className="mt-1 text-xs leading-5 text-[#91acc9]">Use o e-mail indicado em cada etapa. A senha é igual para os três perfis.</p></span></div>
          <code className="rounded-xl border border-[#2a9cea]/20 bg-[#04132e] px-4 py-3 text-xs font-bold text-[#67d3ff]">{password}</code>
        </section>

        <section className="mt-6 grid gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return <article key={step.number} className="presentation-step group grid gap-5 rounded-2xl border border-white/[.08] bg-white/[.04] p-5 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[#23b8ff]/30 hover:bg-white/[.06] md:grid-cols-[64px_1fr_auto] md:items-center md:p-6">
              <span className="font-[var(--font-display)] text-3xl font-black text-[#1baef4]">{step.number}</span>
              <div><span className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#5fcaff]"><Icon size={14} /> {step.role}</span><h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-.04em]">{step.title}</h2><p className="mt-2 text-xs leading-5 text-[#91acc9]">{step.description}</p><p className="mt-3 flex items-start gap-2 text-[10px] font-bold text-[#c6dcf2]"><Sparkles size={13} className="shrink-0 text-[#34c3ff]" /> Evidência: {step.proof}</p><code className="mt-3 block text-[9px] text-[#6788ae]">{step.login}</code></div>
              <Link href={step.href} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0b93e8] to-[#0756c2] px-4 text-xs font-bold shadow-[0_10px_30px_rgba(0,93,210,.18)]">Abrir etapa <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
            </article>;
          })}
        </section>

        <section className="mt-6 flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#27baff]/20 bg-gradient-to-r from-[#0754bd] to-[#08a3e7] p-6 text-center md:flex-row md:text-left md:p-8"><span><small className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#c5efff]">FECHAMENTO</small><strong className="mt-1 block font-[var(--font-display)] text-2xl tracking-[-.04em]">“O que mais tomaria tempo da sua equipe hoje?”</strong></span><Link href="/demo" className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold text-[#0758bd]">Explorar demonstração <ArrowRight size={15} /></Link></section>
      </div>
    </main>
  );
}
