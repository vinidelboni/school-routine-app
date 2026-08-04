import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { acceptInvite } from "./actions";

type SearchParams = Promise<{ error?: string }>;

export default async function AcceptInvitePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login?error=invalid-invite");

  return (
    <main className="grid min-h-dvh place-items-center bg-[#041b46] px-5 py-10 text-[#142b4b]">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#0f91ec] to-[#073aa8] text-white shadow-lg">
          <KeyRound size={25} />
        </span>
        <span className="mt-6 block text-[10px] font-extrabold uppercase tracking-[.16em] text-[#1768c5]">CONVITE SOMAMAIS</span>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-.04em]">Crie sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-[#61758d]">Esta senha é pessoal. A escola nunca precisará conhecê-la ou compartilhá-la.</p>
        {query.error ? <p role="alert" className="mt-4 rounded-xl bg-[#fff0ee] p-3 text-xs text-[#963f36]">Não foi possível concluir. Confira se as senhas são iguais e tente novamente.</p> : null}
        <form action={acceptInvite} className="mt-6 grid gap-4">
          <label><span className="field-label">Nova senha</span><input name="password" type="password" minLength={8} required autoComplete="new-password" className="input" /></label>
          <label><span className="field-label">Confirmar senha</span><input name="confirmation" type="password" minLength={8} required autoComplete="new-password" className="input" /></label>
          <button className="mt-1 rounded-xl bg-gradient-to-r from-[#0c85e5] to-[#0755bf] py-3.5 text-xs font-bold text-white">Ativar meu acesso</button>
        </form>
        <p className="mt-5 flex items-center gap-2 text-[10px] text-[#6f8299]"><ShieldCheck size={14} /> Convite individual e protegido.</p>
      </section>
    </main>
  );
}
