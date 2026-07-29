import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
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
    <main className="grid min-h-screen place-items-center bg-[#eef0e9] p-5 text-[#24312b]">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-[#dfe1d9] bg-[#fffefa] shadow-[0_28px_80px_rgba(40,55,48,.12)] md:grid-cols-[.85fr_1.15fr]">
        <aside className="hidden flex-col justify-between bg-[#315645] p-10 text-white md:flex">
          <span className="font-[var(--font-display)] text-3xl font-extrabold">laço</span>
          <div>
            <ShieldCheck className="mb-6 text-[#efc7aa]" size={36} />
            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-.04em]">
              Cada pessoa vê somente o que precisa.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#d3dfd8]">
              Acesso protegido por escola, papel e vínculo com a turma ou criança.
            </p>
          </div>
          <small className="text-[#aebfb7]">Área operacional · Sprint 1</small>
        </aside>
        <section className="p-7 md:p-12">
          <Link href="/" className="mb-10 flex items-center gap-2 text-xs font-bold text-[#557164]">
            <ArrowLeft size={15} /> Voltar
          </Link>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#e3ece6] text-[#42715d]">
            <LockKeyhole size={22} />
          </span>
          <h2 className="mt-6 font-[var(--font-display)] text-3xl font-semibold tracking-[-.04em]">
            Acesse o Laço
          </h2>
          <p className="mt-2 text-sm text-[#69746f]">
            Entre com o acesso individual fornecido pela escola.
          </p>
          {error && (
            <p className="mt-5 rounded-lg bg-[#f8e8df] px-4 py-3 text-sm font-bold text-[#9a5945]">
              {errors[error] ?? "Não foi possível entrar."}
            </p>
          )}
          <form action={login} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-xs font-bold">
              E-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-12 rounded-xl border border-[#dfe1d9] bg-white px-4 font-normal outline-none transition focus:border-[#6f9481] focus:ring-4 focus:ring-[#dfeae2]"
                placeholder="nome@escola.com.br"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Senha
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="h-12 rounded-xl border border-[#dfe1d9] bg-white px-4 font-normal outline-none transition focus:border-[#6f9481] focus:ring-4 focus:ring-[#dfeae2]"
                placeholder="Sua senha individual"
              />
            </label>
            <button className="mt-2 h-12 rounded-xl bg-[#315645] font-bold text-white transition hover:bg-[#284a3b]">
              Entrar com segurança
            </button>
          </form>
          <p className="mt-7 text-center text-xs leading-5 text-[#858d88]">
            Esta sprint utiliza contas fictícias de validação. Nenhum dado real
            de criança deve ser cadastrado.
          </p>
        </section>
      </div>
    </main>
  );
}
