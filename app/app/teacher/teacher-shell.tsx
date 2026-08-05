"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Camera, ChevronRight, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { logout } from "../../login/actions";
import { SchoolSwitcher, type SchoolOption } from "../school-switcher";

const navigation = [
  { href: "/app/teacher", label: "Rotina", icon: BookOpen, exact: true },
  { href: "/app/teacher/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/app/teacher/photos", label: "Galeria", icon: Camera },
  { href: "/app/teacher/profile", label: "Perfil", icon: UserRound },
] as const;

export function TeacherShell({ children, schoolName, profileName, avatarUrl, schoolOptions, activeMembershipId }: { children: React.ReactNode; schoolName: string; profileName: string; avatarUrl?: string; schoolOptions: SchoolOption[]; activeMembershipId: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = profileName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="teacher-theme min-h-dvh bg-[#eef4fb] text-[#172b4d] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className={`${menuOpen ? "flex" : "hidden"} fixed inset-0 z-50 flex-col overflow-y-auto bg-[#061b44] px-4 pb-6 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh`}>
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-2">
          <Link href="/app/teacher" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#19a5ef] to-[#0758c8] font-[var(--font-display)] text-lg font-black shadow-[0_8px_24px_rgba(17,128,232,.3)]">S+</span>
            <span><strong className="block font-[var(--font-display)] text-xl tracking-[-.04em]">SomaMais</strong><small className="block text-[9px] font-bold uppercase tracking-[.16em] text-[#8fb9e8]">Rotina escolar</small></span>
          </Link>
          <button type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 lg:hidden"><X size={20} /></button>
        </div>
        <div className="mx-1 mt-5 rounded-2xl border border-white/10 bg-white/[.06] p-3">
          <span className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#8fc9ff]"><ShieldCheck size={14} /> Acesso protegido</span>
          <strong className="mt-2 block truncate text-sm">{schoolName}</strong>
          <small className="mt-0.5 block text-[10px] text-[#a9c5e7]">Área da professora</small>
        </div>
        <nav aria-label="Navegação da professora" className="mt-5 grid gap-1">
          {navigation.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href || pathname.startsWith("/app/teacher/simulation") : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition ${active ? "bg-gradient-to-r from-[#1175d8] to-[#0858bd] text-white shadow-[0_8px_22px_rgba(3,78,166,.32)]" : "text-[#b9cee7] hover:bg-white/[.07] hover:text-white"}`}><Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span className="flex-1">{item.label}</span>{active ? <ChevronRight size={14} className="text-[#83c9ff]" /> : null}</Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4"><form action={logout}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-[#b9cee7] transition hover:bg-white/[.07] hover:text-white"><LogOut size={17} /> Sair da conta</button></form></div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-[#d8e5f2] bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d8e5f2] bg-white text-[#1768c5] shadow-sm lg:hidden"><Menu size={20} /></button>
              <span className="min-w-0"><small className="block text-[9px] font-extrabold uppercase tracking-[.14em] text-[#5d7d9f]">Professora</small><strong className="block truncate text-sm text-[#142b4b]">{schoolName}</strong></span>
              <SchoolSwitcher options={schoolOptions} activeMembershipId={activeMembershipId} />
            </div>
            <Link href="/app/teacher/profile" className="flex min-w-0 items-center gap-3 rounded-2xl p-1.5 transition hover:bg-[#edf5fd]">
              <span className="hidden min-w-0 text-right sm:block"><strong className="block max-w-44 truncate text-xs">{profileName}</strong><small className="text-[10px] text-[#6f8299]">Acesso pedagógico</small></span>
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#24a3ef] to-[#0758c8] text-xs font-extrabold text-white shadow-[0_7px_18px_rgba(19,104,202,.2)]">{avatarUrl ? <Image src={avatarUrl} alt={`Foto de ${profileName}`} fill sizes="40px" className="object-cover" /> : initial}</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8"><div key={pathname} className="family-page-enter">{children}</div></main>
      </div>

      <nav aria-label="Navegação rápida da professora" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#dce6f2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_26px_rgba(35,73,128,.08)] backdrop-blur lg:hidden">
        {navigation.map((item) => { const active = "exact" in item && item.exact ? pathname === item.href || pathname.startsWith("/app/teacher/simulation") : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex h-[68px] flex-col items-center justify-center gap-1 text-[9px] font-bold ${active ? "text-[#1768c5]" : "text-[#8291a5]"}`}>{active ? <span className="absolute top-0 h-0.5 w-9 rounded-full bg-[#1768c5]" /> : null}<Icon size={20} strokeWidth={active ? 2.4 : 1.8} />{item.label}</Link>; })}
      </nav>
    </div>
  );
}
