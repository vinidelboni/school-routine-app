import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Megaphone,
  Users,
} from "lucide-react";

const password = "LacoValidacao!2026";
const steps = [
  {
    number: "01",
    role: "Direção",
    title: "Apresente a estrutura da escola",
    description: "Mostre turmas, jornadas, crianças e módulos configuráveis.",
    href: "/app/direction/registry",
    icon: Users,
    login: "direcao@laco.validacao",
    proof: "A escola adapta o sistema à própria rotina.",
  },
  {
    number: "02",
    role: "Professora",
    title: "Registre a rotina por exceção",
    description: "Aplique alimentação, hidratação e atividade para o grupo e altere somente quem foi diferente.",
    href: "/app/teacher",
    icon: BookOpen,
    login: "professora@laco.validacao",
    proof: "Menos tempo preenchendo, sem transformar ausência de dado em normalidade.",
  },
  {
    number: "03",
    role: "Família",
    title: "Veja o resumo após a saída",
    description: "Abra a narrativa do dia, comunicados, ocorrências e confirmações estruturadas.",
    href: "/app/family",
    icon: CheckCircle2,
    login: "familia@laco.validacao",
    proof: "Comunicação clara, sem chat aberto e sem caos de WhatsApp.",
  },
  {
    number: "04",
    role: "Direção",
    title: "Mostre comunicação e responsabilidade",
    description: "Publique comunicados, registre ocorrências e acompanhe ciência individual.",
    href: "/app/direction/communications",
    icon: Megaphone,
    login: "direcao@laco.validacao",
    proof: "A direção controla informações sensíveis.",
  },
  {
    number: "05",
    role: "Direção",
    title: "Distribua boletos em lote",
    description: "Simule múltiplos PDFs, revise os pareamentos e distribua após validação.",
    href: "/app/direction/billing",
    icon: FileText,
    login: "direcao@laco.validacao",
    proof: "Automação assistida, nunca envio financeiro sem conferência.",
  },
  {
    number: "06",
    role: "Professora",
    title: "Publique fotos com autorização",
    description: "Selecione quem aparece e mostre o bloqueio automático para crianças sem consentimento.",
    href: "/app/teacher/photos",
    icon: Camera,
    login: "professora@laco.validacao",
    proof: "Privacidade por vínculo, sem reconhecimento facial.",
  },
  {
    number: "07",
    role: "Direção",
    title: "Feche com o painel de gestão",
    description: "Apresente pendências e engajamento da equipe sem usar leitura dos pais como desempenho.",
    href: "/app/direction/team-engagement",
    icon: LayoutDashboard,
    login: "direcao@laco.validacao",
    proof: "Controle operacional sem ranking superficial.",
  },
];

export default function DemoGuidePage() {
  return (
    <main className="min-h-screen bg-[#f5f3eb] px-5 py-8 text-[#24312b]">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-[#315645] p-7 text-white md:p-10">
          <Link href="/demo" className="flex w-max items-center gap-2 text-xs font-bold text-[#d8e5de]">
            <ArrowLeft size={15} /> Voltar à demonstração
          </Link>
          <span className="mt-10 block text-[10px] font-extrabold tracking-[.18em] text-[#efc7aa]">
            ROTEIRO DE APRESENTAÇÃO · 15 A 20 MINUTOS
          </span>
          <h1 className="mt-3 max-w-3xl font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Conte uma história, não uma lista de funcionalidades.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d8e5de]">
            Siga as etapas na ordem. Cada uma mostra um problema real, a ação no
            SomaMais e a evidência que vale validar com a escola.
          </p>
        </header>

        <section className="mt-5 rounded-2xl border border-[#dfded6] bg-white p-5">
          <strong className="text-sm">Credenciais do ambiente operacional</strong>
          <p className="mt-2 text-xs leading-6 text-[#69746f]">
            Use o e-mail indicado em cada etapa. Senha para os três perfis:{" "}
            <code className="rounded bg-[#eef3ef] px-2 py-1 font-bold text-[#315645]">{password}</code>
          </p>
        </section>

        <section className="mt-5 grid gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className="grid gap-5 rounded-2xl border border-[#dfded6] bg-[#fffefa] p-5 md:grid-cols-[70px_1fr_auto] md:items-center md:p-6">
                <span className="font-[var(--font-display)] text-3xl font-semibold text-[#b4b9b5]">{step.number}</span>
                <div>
                  <span className="flex items-center gap-2 text-[9px] font-extrabold tracking-[.12em] text-[#557164]"><Icon size={14} /> {step.role.toUpperCase()}</span>
                  <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold">{step.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-[#69746f]">{step.description}</p>
                  <p className="mt-3 text-[10px] font-bold text-[#80512f]">Evidência: {step.proof}</p>
                  <code className="mt-3 block text-[10px] text-[#7c8680]">{step.login}</code>
                </div>
                <Link href={step.href} className="flex items-center justify-center gap-2 rounded-xl bg-[#315645] px-4 py-3 text-xs font-bold text-white">
                  Abrir etapa <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
