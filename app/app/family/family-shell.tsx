"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  Camera,
  ChevronDown,
  Home,
  UserRound,
} from "lucide-react";

const navigation = [
  { href: "/app/family", label: "Início", icon: Home, exact: true },
  { href: "/app/family/history", label: "Agenda", icon: BookOpen },
  { href: "/app/family/photos", label: "Fotos", icon: Camera },
  { href: "/app/family/school", label: "Escola", icon: Building2, group: true },
  { href: "/app/family/profile", label: "Perfil", icon: UserRound },
];

const schoolRoutes = [
  "/app/family/school",
  "/app/family/communications",
  "/app/family/requests",
  "/app/family/medications",
  "/app/family/documents",
  "/app/family/occurrences",
];

export function FamilyShell({
  children,
  childName,
  childInitials,
  schoolName,
  notificationCount,
}: {
  children: React.ReactNode;
  childName: string;
  childInitials: string;
  schoolName: string;
  notificationCount: number;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[#e7e4da] text-[#24312b] md:px-5 md:py-6">
      <div className="relative mx-auto min-h-dvh w-full overflow-hidden bg-[#f7f5ef] md:min-h-[calc(100vh-3rem)] md:max-w-[520px] md:rounded-[2rem] md:border md:border-[#d9d8d0] md:shadow-[0_28px_80px_rgba(40,55,48,.16)]">
        <header className="sticky top-0 z-30 border-b border-[#e6e4dc] bg-[#fffefa]/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href="/app/family"
              className="font-[var(--font-display)] text-2xl font-extrabold tracking-[-.06em] text-[#315645]"
            >
              laço
            </Link>
            <Link
              href="/app/family/school"
              aria-label={`${notificationCount} notificações pendentes`}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e0e1da] bg-white text-[#557164]"
            >
              <Bell size={19} />
              {notificationCount ? (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#b85f48] px-1 text-[9px] font-extrabold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d9e8df] text-[10px] font-extrabold text-[#315645]">
              {childInitials}
            </span>
            <span className="min-w-0 flex-1">
              <small className="block truncate text-[9px] text-[#858d88]">
                Acompanhando em {schoolName}
              </small>
              <strong className="block truncate text-sm">{childName}</strong>
            </span>
            <ChevronDown size={16} className="text-[#7c8680]" />
          </div>
        </header>

        <main className="px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-4">
          {children}
        </main>

        <nav
          aria-label="Navegação da família"
          className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full grid-cols-5 border-t border-[#e3e2dc] bg-[#fffefa]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:bottom-6 md:max-w-[518px] md:rounded-b-[2rem]"
        >
          {navigation.map((item) => {
            const active = item.group
              ? schoolRoutes.some((route) => pathname.startsWith(route))
              : item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-[66px] flex-col items-center justify-center gap-1 text-[9px] font-bold transition ${
                  active ? "text-[#315645]" : "text-[#8b928e]"
                }`}
              >
                {active ? (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#315645]" />
                ) : null}
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
