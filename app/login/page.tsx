import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { login } from "./actions";
import { LoginIntro } from "./login-intro";

const errors: Record<string, string> = {
  "invalid-fields": "Confira o e-mail e a senha.",
  "invalid-credentials": "E-mail ou senha incorretos.",
  "no-active-membership": "Este acesso ainda não possui vínculo ativo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#020f32] p-0 text-white sm:p-5">
      <LoginIntro />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 8%, rgba(8,108,230,.34), transparent 34%), radial-gradient(circle at 84% 92%, rgba(7,59,173,.42), transparent 38%)",
        }}
      />

      <section className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[linear-gradient(165deg,#0c73ee_0%,#073dac_34%,#03143d_78%,#020f32_100%)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] shadow-[0_32px_100px_rgba(0,7,27,.7)] sm:min-h-[760px] sm:rounded-[2.25rem] sm:border sm:border-[#60aeff]/30">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-[.09] mix-blend-screen"
          style={{
            backgroundImage: "url('/demo/escola-cni-logo-transparent.png')",
            backgroundSize: "150% auto",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 34%, rgba(74,184,255,.16) 50%, transparent 66%)",
          }}
        />

        <header className="relative flex items-center justify-between">
          <Link
            href="/"
            aria-label="Voltar para o início"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#79c8ff]/25 bg-[#03143d]/25 text-white transition hover:bg-white/15"
          >
            <ArrowLeft size={19} />
          </Link>
          <span className="text-[10px] font-bold tracking-[.12em] text-[#b8ddff]/75">
            AMBIENTE DEMONSTRATIVO
          </span>
        </header>

        <div className="relative mt-auto flex flex-col items-center pt-12 text-center">
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white/90 bg-white shadow-[0_0_0_9px_rgba(64,159,255,.12),0_24px_60px_rgba(0,8,35,.45)]">
            <Image
              src="/demo/escola-cni-logo.png"
              alt="Escola CNI Infantil"
              fill
              sizes="160px"
              priority
              className="scale-[1.04] rounded-full object-cover"
            />
          </div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[.22em] text-[#19cdf4]">
            Bem-vindo
          </p>
          <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-.04em]">
            Acesse sua conta
          </h1>
          <p className="mt-2 max-w-[290px] text-sm leading-6 text-[#d4e9ff]/75">
            A rotina escolar da sua criança, sempre por perto.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="relative mt-5 rounded-2xl border border-[#ffd2c4]/40 bg-[#7b2e39]/45 px-4 py-3 text-center text-sm font-bold text-white backdrop-blur"
          >
            {errors[error] ?? "Não foi possível entrar."}
          </p>
        ) : null}

        <form action={login} className="relative mt-7 grid gap-4">
          <label className="group relative block">
            <span className="sr-only">E-mail</span>
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/85"
              size={19}
            />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-14 w-full rounded-2xl border border-[#79c8ff]/28 bg-[#020f32]/35 pl-12 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition placeholder:text-[#d4e9ff]/55 focus:border-[#19cdf4] focus:bg-[#020f32]/50 focus:ring-4 focus:ring-[#19cdf4]/15"
              placeholder="E-mail"
            />
          </label>

          <label className="group relative block">
            <span className="sr-only">Senha</span>
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/85"
              size={19}
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="h-14 w-full rounded-2xl border border-[#79c8ff]/28 bg-[#020f32]/35 pl-12 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition placeholder:text-[#d4e9ff]/55 focus:border-[#19cdf4] focus:bg-[#020f32]/50 focus:ring-4 focus:ring-[#19cdf4]/15"
              placeholder="Senha"
            />
          </label>

          <button className="mt-1 h-14 rounded-2xl bg-gradient-to-r from-[#13c8f2] to-[#1687f3] text-sm font-extrabold uppercase tracking-[.08em] text-white shadow-[0_16px_36px_rgba(0,31,112,.4)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#55dfff]/25 active:translate-y-px">
            Entrar
          </button>
        </form>

        <footer className="relative mt-auto pt-8 text-center">
          <p className="text-[11px] leading-5 text-[#d4e9ff]/60">
            Acesso individual fornecido pela escola.
            <br />
            Nenhum dado real deve ser usado nesta demonstração.
          </p>
          <p className="mt-5 font-[var(--font-display)] text-[12px] font-bold tracking-[-.02em] text-white/55">
            SOMA<span className="text-[#19cdf4]">MAIS</span>
          </p>
        </footer>
      </section>
    </main>
  );
}
