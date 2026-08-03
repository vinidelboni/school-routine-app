"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  FileText,
  Inbox,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Megaphone,
  Menu,
  Pill,
  ShieldCheck,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { logout } from "../../login/actions";

const navigation = [
  { href: "/app/direction", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/app/direction/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/app/direction/registry", label: "Pessoas e turmas", icon: Users },
  { href: "/app/direction/families", label: "Famílias e acessos", icon: UsersRound },
  { href: "/app/direction/requests", label: "Avisos e solicitações", icon: Inbox },
  { href: "/app/direction/communications", label: "Comunicados", icon: Megaphone },
  { href: "/app/direction/occurrences", label: "Ocorrências", icon: AlertTriangle },
  { href: "/app/direction/team-engagement", label: "Engajamento da equipe", icon: BarChart3 },
  { href: "/app/direction/photos", label: "Fotos e autorizações", icon: Camera },
  { href: "/app/direction/medications", label: "Medicamentos", icon: Pill },
  { href: "/app/direction/documents", label: "Biblioteca de documentos", icon: LibraryBig },
  { href: "/app/direction/billing", label: "Boletos em lote", icon: FileText },
] as const;

export function DirectionShell({
  children,
  schoolName,
  profileName,
}: {
  children: React.ReactNode;
  schoolName: string;
  profileName: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="direction-theme min-h-dvh bg-[#f2f6fb] text-[#172b4d] lg:grid lg:grid-cols-[272px_1fr]">
      <aside
        className={`${menuOpen ? "flex" : "hidden"} fixed inset-0 z-50 flex-col overflow-y-auto bg-[#061b44] px-4 pb-6 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-auto`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-2">
          <Link href="/app/direction" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#168eea] to-[#0855c7] font-[var(--font-display)] text-lg font-black shadow-[0_8px_24px_rgba(17,128,232,.3)]">
              S+
            </span>
            <span>
              <strong className="block font-[var(--font-display)] text-xl tracking-[-.04em]">SomaMais</strong>
              <small className="block text-[9px] font-bold uppercase tracking-[.16em] text-[#8fb9e8]">Gestão escolar</small>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-1 mt-5 rounded-2xl border border-white/10 bg-white/[.06] p-3">
          <span className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#8fb9e8]">
            <ShieldCheck size={14} /> Ambiente protegido
          </span>
          <strong className="mt-2 block truncate text-sm">{schoolName}</strong>
          <small className="mt-0.5 block text-[10px] text-[#a9c5e7]">Painel administrativo</small>
        </div>

        <nav aria-label="Navegação da direção" className="mt-5 grid gap-1">
          {navigation.map((item) => {
            const active = "exact" in item && item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-[#116fd1] to-[#0a59bb] text-white shadow-[0_8px_22px_rgba(3,78,166,.32)]"
                    : "text-[#b9cee7] hover:bg-white/[.07] hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                <span className="flex-1">{item.label}</span>
                {active ? <ChevronRight size={14} className="text-[#83c9ff]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-[#b9cee7] transition hover:bg-white/[.07] hover:text-white">
              <LogOut size={17} /> Sair da conta
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#dce6f2] bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu"
                onClick={() => setMenuOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dce6f2] bg-white text-[#1f5ea8] shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>
              <span className="min-w-0">
                <small className="block text-[9px] font-extrabold uppercase tracking-[.14em] text-[#5d7d9f]">Direção</small>
                <strong className="block truncate text-sm text-[#142b4b]">{schoolName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/app/direction/requests"
                aria-label="Ver pendências"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dce6f2] bg-white text-[#1f5ea8] shadow-sm transition hover:border-[#a9c9ea] hover:bg-[#f2f8ff]"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#ff5a68]" />
              </Link>
              <span className="hidden text-right sm:block">
                <strong className="block max-w-44 truncate text-xs text-[#172b4d]">{profileName}</strong>
                <small className="text-[10px] text-[#6f8299]">Acesso administrativo</small>
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#24a3ef] to-[#0758c8] text-xs font-extrabold text-white shadow-[0_7px_18px_rgba(19,104,202,.2)]">
                {profileName.trim().charAt(0).toUpperCase() || "D"}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
