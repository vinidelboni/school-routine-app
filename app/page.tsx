import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Utensils,
} from "lucide-react";

const benefits = [
  { icon: BookOpenCheck, label: "Professora", title: "Registra a turma de uma vez", text: "Rotina coletiva por padrão, com ajustes somente para as exceções." },
  { icon: Building2, label: "Direção", title: "Enxerga o que pede ação", text: "Pendências, acessos, documentos e comunicação em um painel objetivo." },
  { icon: UsersRound, label: "Família", title: "Encontra tudo sem procurar", text: "Diário, alimentação, calendário e avisos em uma experiência de aplicativo." },
];

const features = [
  [CalendarDays, "Calendário e eventos"],
  [MessageSquareText, "Comunicados com ciência"],
  [Utensils, "Rotina e cardápio"],
  [FileCheck2, "Documentos e boletos"],
  [BellRing, "Avisos e lembretes"],
  [ShieldCheck, "Acessos por escola"],
] as const;

export default function Home() {
  return (
    <main className="landing-shell min-h-dvh overflow-hidden bg-[#020d24] text-white">
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-glow landing-glow-one" aria-hidden="true" />
      <div className="landing-glow landing-glow-two" aria-hidden="true" />

      <nav className="landing-nav relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="SomaMais — início">
          <Image src="/icons/somamais-192.png" alt="" width={44} height={44} priority className="h-11 w-11 rounded-[13px] shadow-[0_10px_35px_rgba(0,140,255,.3)]" />
          <span>
            <strong className="block font-[var(--font-display)] text-xl tracking-[-.05em]">SomaMais</strong>
            <small className="block text-[8px] font-bold uppercase tracking-[.18em] text-[#83bcea]">Escola, família e futuro</small>
          </span>
        </Link>
        <div className="hidden items-center gap-7 text-xs font-semibold text-[#a9c7e8] md:flex">
          <a href="#solucao" className="transition hover:text-white">A solução</a>
          <a href="#experiencia" className="transition hover:text-white">Experiência</a>
          <a href="#seguranca" className="transition hover:text-white">Segurança</a>
        </div>
        <Link href="/login" className="landing-login flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.08] px-4 py-2.5 text-xs font-bold backdrop-blur-xl transition hover:border-[#39b9ff]/50 hover:bg-white/[.13]">
          <LockKeyhole size={15} /> <span className="hidden sm:inline">Acessar plataforma</span><span className="sm:hidden">Entrar</span>
        </Link>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-16">
        <div className="landing-reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#28afff]/25 bg-[#0789e5]/10 px-3 py-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#6dd0ff] backdrop-blur">
            <Sparkles size={13} /> Tecnologia que devolve tempo para cuidar
          </span>
          <h1 className="mt-7 max-w-3xl font-[var(--font-display)] text-[clamp(3rem,7vw,6.25rem)] font-semibold leading-[.98] tracking-[-.075em]">
            A rotina escolar,
            <span className="landing-gradient-text block">simples de verdade.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#a9c1dd] md:text-lg md:leading-8">
            Menos tempo preenchendo. Mais tempo cuidando e ensinando. O SomaMais conecta direção, professoras e famílias sem papel e sem o caos do WhatsApp.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="landing-primary group flex min-h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0bb8f2] to-[#116be0] px-6 text-sm font-extrabold shadow-[0_16px_45px_rgba(8,137,229,.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(8,137,229,.4)]">
              Explorar demonstração <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-6 text-sm font-bold text-[#d7e9ff] backdrop-blur transition hover:bg-white/[.11]">
              <LockKeyhole size={16} /> Já tenho acesso
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold text-[#7fa4cc]">
            <span className="flex items-center gap-1.5"><Check size={13} className="text-[#26c7ff]" /> Acesso por perfil</span>
            <span className="flex items-center gap-1.5"><Check size={13} className="text-[#26c7ff]" /> Dados separados por escola</span>
            <span className="flex items-center gap-1.5"><Check size={13} className="text-[#26c7ff]" /> Web, PWA e app</span>
          </div>
        </div>

        <HeroProduct />
      </section>

      <section id="solucao" className="relative z-10 border-y border-white/[.07] bg-white/[.025]">
        <div className="mx-auto grid max-w-7xl gap-px px-5 py-4 sm:grid-cols-3 lg:px-8">
          {["Uma conta. Cada perfil no lugar certo.", "Uma escola. Dados realmente isolados.", "Uma rotina. Menos trabalho repetitivo."].map((item, index) => (
            <div key={item} className="flex items-center gap-3 px-2 py-4 text-xs font-bold text-[#bdd5ee] sm:px-5">
              <span className="font-[var(--font-display)] text-xl text-[#1faef5]">0{index + 1}</span>{item}
            </div>
          ))}
        </div>
      </section>

      <section id="experiencia" className="relative z-10 mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <span className="landing-kicker">UMA PLATAFORMA. TRÊS EXPERIÊNCIAS.</span>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-.055em] md:text-6xl">Cada pessoa vê apenas o que precisa.</h2>
          <p className="mt-5 text-sm leading-7 text-[#8faecc]">Objetividade para a correria do dia a dia, sem perder acolhimento, contexto ou segurança.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, label, title, text }, index) => (
            <article key={label} className="landing-card group relative overflow-hidden rounded-3xl border border-white/[.09] bg-white/[.045] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#1faef5]/35 hover:bg-white/[.065] md:p-8">
              <span className="absolute right-6 top-5 font-[var(--font-display)] text-5xl font-black text-white/[.035]">0{index + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#16b8f4]/25 to-[#1053c7]/25 text-[#66d2ff] ring-1 ring-inset ring-[#42c6ff]/20"><Icon size={23} /></span>
              <small className="mt-8 block text-[9px] font-extrabold uppercase tracking-[.15em] text-[#48bff5]">{label}</small>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-.04em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#91acc9]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#1f8fe8]/20 bg-gradient-to-br from-[#071d43] to-[#03122e] lg:grid-cols-[.9fr_1.1fr]">
          <div className="p-7 md:p-11 lg:p-14">
            <span className="landing-kicker">TUDO ENCONTRÁVEL</span>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-.055em]">Uma home que trabalha a favor dos pais.</h2>
            <p className="mt-5 text-sm leading-7 text-[#95b1cf]">Informações importantes viram ações claras. O restante continua organizado e acessível quando a família precisar.</p>
            <Link href="/demo" className="group mt-8 flex w-max items-center gap-2 text-xs font-extrabold text-[#56c8ff]">Ver a experiência da família <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-[#081d40]/70 p-6 md:grid-cols-3 md:p-10">
            {features.map(([Icon, label]) => <div key={label} className="grid min-h-32 place-items-center rounded-2xl border border-white/[.07] bg-white/[.04] p-4 text-center transition hover:border-[#25baff]/30 hover:bg-[#0b66c4]/10"><span><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#0dbaf1] to-[#0b4ec5] text-white shadow-[0_10px_30px_rgba(0,116,224,.25)]"><Icon size={20} /></span><strong className="mt-3 block text-[10px] text-[#c9ddf3]">{label}</strong></span></div>)}
          </div>
        </div>
      </section>

      <section id="seguranca" className="relative z-10 mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="grid items-center gap-10 rounded-[2rem] border border-white/[.08] bg-white/[.035] p-7 md:p-10 lg:grid-cols-[auto_1fr_auto] lg:p-12">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#0c6fd5]/20 text-[#5bcaff] ring-1 ring-inset ring-[#36bfff]/20"><ShieldCheck size={30} /></span>
          <div><span className="landing-kicker">ACESSO PROTEGIDO</span><h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-.04em]">Cada escola, perfil e criança no vínculo certo.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#91acc9]">Convites individuais, permissões por função e troca segura entre escolas para quem possui mais de um vínculo.</p></div>
          <Link href="/login" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold text-[#072758] transition hover:-translate-y-0.5"><LockKeyhole size={15} /> Acessar minha conta</Link>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-8 lg:px-8">
        <div className="landing-cta mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#27b9ff]/25 bg-gradient-to-r from-[#0754bd] via-[#087fdd] to-[#08a9e9] px-7 py-14 text-center shadow-[0_30px_80px_rgba(0,86,190,.25)] md:px-12 md:py-20">
          <span className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.17em] text-[#c4efff]"><Sparkles size={14} /> SOMANDO ESCOLA, FAMÍLIA E FUTURO</span>
          <h2 className="mx-auto mt-4 max-w-3xl font-[var(--font-display)] text-4xl font-semibold tracking-[-.06em] md:text-6xl">Veja como a rotina pode ficar mais leve.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/demo" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-extrabold text-[#0755bd]">Abrir demonstração <ArrowRight size={15} /></Link><Link href="/demo/guide" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-xs font-bold">Ver apresentação comercial</Link></div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-5 py-9 text-[10px] text-[#6687ad] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>© 2026 SomaMais · Tecnologia para a educação infantil</span>
        <span className="flex items-center gap-2"><CheckCircle2 size={13} /> Ambiente demonstrativo com dados fictícios</span>
      </footer>
    </main>
  );
}

function HeroProduct() {
  return <div className="landing-product relative mx-auto w-full max-w-[570px]" aria-label="Prévia da experiência SomaMais">
    <div className="landing-orbit" aria-hidden="true" />
    <div className="relative ml-auto w-[88%] rounded-[2rem] border border-white/[.13] bg-[#071a3a]/80 p-3 shadow-[0_40px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl">
      <div className="overflow-hidden rounded-[1.45rem] border border-white/[.08] bg-[#f7f9fc] text-[#172b4d]">
        <div className="bg-gradient-to-br from-[#118fe5] to-[#073aa1] p-5 text-white"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Image src="/icons/somamais-192.png" alt="" width={34} height={34} className="rounded-[10px]" /><span><small className="block text-[8px] text-[#bfe6ff]">Bem-vinda</small><strong className="text-xs">Família da Alice</strong></span></span><BellRing size={18} /></div><div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"><small className="text-[8px] text-[#c5e5ff]">HOJE · PUBLICADO ÀS 17H32</small><strong className="mt-1 block text-sm">O dia de Alice está pronto</strong></div></div>
        <div className="grid grid-cols-3 gap-3 p-4">{features.map(([Icon, label]) => <div key={label} className="grid min-h-24 place-items-center rounded-xl bg-white p-2 text-center shadow-[0_5px_18px_rgba(31,72,122,.08)]"><span><span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#13b8ef] to-[#0755c1] text-white"><Icon size={16} /></span><small className="mt-2 block text-[7px] font-bold">{label}</small></span></div>)}</div>
      </div>
    </div>
    <div className="landing-float-card absolute -bottom-7 left-0 flex items-center gap-3 rounded-2xl border border-white/[.13] bg-[#071b40]/90 p-4 shadow-2xl backdrop-blur-xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b8de4]/20 text-[#5acbff]"><CheckCircle2 size={20} /></span><span><small className="block text-[8px] font-bold uppercase tracking-[.12em] text-[#70a6d2]">ROTINA</small><strong className="mt-0.5 block text-xs">Agenda publicada</strong></span></div>
  </div>;
}
