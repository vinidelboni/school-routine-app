import Link from "next/link";
import { AlertTriangle, BookOpen, FileText, Inbox, LayoutDashboard, LogOut, Megaphone, MessageSquareText, Pill, ShieldCheck, Users, UsersRound } from "lucide-react";
import { getCurrentContext } from "../lib/auth";
import { logout } from "../login/actions";

const roleLabels = {
  director: "Direção",
  teacher: "Professora",
  family: "Família",
} as const;

export default async function OperationalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { membership, profile } = await getCurrentContext();
  const school = Array.isArray(membership.schools)
    ? membership.schools[0]
    : membership.schools;

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#24312b]">
      <header className="border-b border-[#dfe1d9] bg-[#fffefa]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-[var(--font-display)] text-2xl font-extrabold text-[#315645]">
              laço
            </Link>
            <span className="hidden h-6 w-px bg-[#dfe1d9] sm:block" />
            <div className="hidden sm:block">
              <strong className="block text-xs">{school?.name ?? "Escola"}</strong>
              <span className="text-[10px] text-[#7c8680]">
                Área operacional · dados fictícios
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <strong className="block text-xs">{profile?.full_name}</strong>
              <small className="text-[10px] text-[#7c8680]">
                {roleLabels[membership.role]}
              </small>
            </span>
            <form action={logout}>
              <button
                aria-label="Sair"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#dfe1d9] bg-white text-[#557164]"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[210px_1fr]">
        <aside className="h-max rounded-2xl bg-[#315645] p-3 text-white">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-xs text-[#d7e4dd]">
            <ShieldCheck size={17} className="text-[#efc7aa]" />
            Acesso protegido
          </div>
          <nav className="grid gap-1">
            <Link href="/app" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
              <LayoutDashboard size={17} /> Início
            </Link>
            {membership.role === "director" && (
              <>
                <Link href="/app/direction" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <LayoutDashboard size={17} /> Painel da direção
                </Link>
                <Link href="/app/direction/registry" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Users size={17} /> Pessoas e turmas
                </Link>
                <Link href="/app/direction/families" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <UsersRound size={17} /> Famílias e acessos
                </Link>
                <Link href="/app/direction/requests" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Inbox size={17} /> Avisos e solicitações
                </Link>
                <Link href="/app/direction/communications" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Megaphone size={17} /> Comunicados
                </Link>
                <Link href="/app/direction/occurrences" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <AlertTriangle size={17} /> Ocorrências
                </Link>
                <Link href="/app/direction/medications" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Pill size={17} /> Medicamentos
                </Link>
                <Link href="/app/direction/billing" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <FileText size={17} /> Boletos em lote
                </Link>
              </>
            )}
            {membership.role === "teacher" && (
              <Link href="/app/teacher" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                <BookOpen size={17} /> Rotina da turma
              </Link>
            )}
            {membership.role === "family" && (
              <>
                <Link href="/app/family" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <BookOpen size={17} /> Resumo da criança
                </Link>
                <Link href="/app/family/requests" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <MessageSquareText size={17} /> Avisos à escola
                </Link>
                <Link href="/app/family/communications" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Megaphone size={17} /> Comunicados
                </Link>
                <Link href="/app/family/occurrences" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <AlertTriangle size={17} /> Ocorrências
                </Link>
                <Link href="/app/family/medications" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Pill size={17} /> Medicamentos
                </Link>
                <Link href="/app/family/documents" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <FileText size={17} /> Boletos e documentos
                </Link>
              </>
            )}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
