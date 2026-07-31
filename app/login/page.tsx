import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { login } from "./actions";

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
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#e8eef8] p-0 text-white sm:p-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(26,168,231,.28), transparent 38%), radial-gradient(circle at 80% 90%, rgba(13,52,156,.22), transparent 40%)",
        }}
      />

      <section className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-gradient-to-b from-[#168fda] via-[#095ac2] to-[#082a96] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] shadow-[0_30px_90px_rgba(12,47,120,.3)] sm:min-h-[760px] sm:rounded-[2.25rem] sm:border sm:border-white/25">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-[.16]"
          style={{
            backgroundImage: "url('/demo/escola-cni-logo-transparent.png')",
            backgroundSize: "145% auto",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 35%, rgba(255,255,255,.14) 50%, transparent 65%)",
          }}
        />

        <header className="relative flex items-center justify-between">
          <Link
            href="/"
            aria-label="Voltar para o início"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
          >
            <ArrowLeft size={19} />
          </Link>
          <span className="text-[10px] font-bold tracking-[.12em] text-white/70">
            AMBIENTE DEMONSTRATIVO
          </span>
        </header>

        <div className="relative mt-auto flex flex-col items-center pt-12 text-center">
          <div className="grid h-40 w-40 place-items-center rounded-full border border-white/20 bg-white/95 p-4 shadow-[0_22px_55px_rgba(3,38,117,.24)]">
            <Image
              src="/demo/escola-cni-logo.png"
              alt="Escola CNI Infantil"
              width={136}
              height={136}
              priority
              className="h-auto w-full"
            />
          </div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[.22em] text-[#7edbff]">
            Bem-vindo
          </p>
          <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-.04em]">
            Acesse sua conta
          </h1>
          <p className="mt-2 max-w-[290px] text-sm leading-6 text-white/75">
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
              className="h-14 w-full rounded-2xl border border-white/30 bg-white/10 pl-12 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition placeholder:text-white/65 focus:border-[#70deff] focus:bg-white/15 focus:ring-4 focus:ring-[#70deff]/15"
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
              className="h-14 w-full rounded-2xl border border-white/30 bg-white/10 pl-12 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition placeholder:text-white/65 focus:border-[#70deff] focus:bg-white/15 focus:ring-4 focus:ring-[#70deff]/15"
              placeholder="Senha"
            />
          </label>

          <button className="mt-1 h-14 rounded-2xl bg-[#13bee9] text-sm font-extrabold uppercase tracking-[.08em] text-[#06347d] shadow-[0_14px_34px_rgba(1,38,117,.25)] transition hover:bg-[#39d0f1] focus:outline-none focus:ring-4 focus:ring-white/25 active:translate-y-px">
            Entrar
          </button>
        </form>

        <footer className="relative mt-auto pt-8 text-center">
          <p className="text-[11px] leading-5 text-white/65">
            Acesso individual fornecido pela escola.
            <br />
            Nenhum dado real deve ser usado nesta demonstração.
          </p>
          <p className="mt-5 text-[10px] font-semibold tracking-[.08em] text-white/45">
            TECNOLOGIA LAÇO
          </p>
        </footer>
      </section>
    </main>
  );
}
