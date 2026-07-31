import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f3ea] px-6 py-8 text-[#24312b]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col rounded-[2rem] border border-[#dfded6] bg-[#fffefa] p-8 shadow-[0_28px_80px_rgba(40,55,48,.08)] md:p-14">
        <div className="flex items-center justify-between">
          <span className="font-[var(--font-display)] text-3xl font-extrabold text-[#315645]">
            SomaMais
          </span>
          <span className="rounded-full border border-[#dce3dd] px-3 py-1.5 text-xs font-bold text-[#557164]">
            Produto em validação
          </span>
        </div>
        <section className="my-auto grid items-center gap-14 py-16 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <span className="text-xs font-extrabold tracking-[.18em] text-[#557164]">
              ROTINA ESCOLAR, MAIS LEVE
            </span>
            <h1 className="mt-6 max-w-3xl font-[var(--font-display)] text-5xl font-semibold leading-[1.04] tracking-[-.06em] md:text-7xl">
              Menos tempo preenchendo.{" "}
              <span className="text-[#42715d]">Mais tempo presente.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#69746f]">
              Conheça a demonstração comercial ou acesse a área operacional
              protegida da primeira sprint.
            </p>
          </div>
          <div className="grid gap-4">
            <Link
              href="/demo"
              className="group rounded-2xl border border-[#d9dfda] bg-[#eef3ef] p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Sparkles className="mb-10 text-[#42715d]" />
              <strong className="block text-xl">Explorar demonstração</strong>
              <span className="mt-2 block text-sm leading-6 text-[#69746f]">
                Dados fictícios e os três perfis navegáveis.
              </span>
              <span className="mt-6 flex items-center gap-2 text-sm font-bold text-[#42715d]">
                Abrir demonstração
                <ArrowRight className="transition group-hover:translate-x-1" size={17} />
              </span>
            </Link>
            <Link
              href="/login"
              className="group rounded-2xl bg-[#315645] p-6 text-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              <LockKeyhole className="mb-10 text-[#efc7aa]" />
              <strong className="block text-xl">Área operacional</strong>
              <span className="mt-2 block text-sm leading-6 text-[#d8e5de]">
                Autenticação, banco e permissões reais.
              </span>
              <span className="mt-6 flex items-center gap-2 text-sm font-bold text-[#efc7aa]">
                Entrar com segurança
                <ArrowRight className="transition group-hover:translate-x-1" size={17} />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
