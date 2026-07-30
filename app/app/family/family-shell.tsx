"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  Home,
  UserRound,
} from "lucide-react";

const navigation = [
  { href: "/app/family", label: "Início", icon: Home, exact: true },
  { href: "/app/family/calendar", label: "Calendário", icon: CalendarDays },
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
  "/app/family/notifications",
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
    <div className="min-h-dvh bg-[#e9edf4] text-[#172b4d] md:px-5 md:py-6">
      <div className="relative mx-auto min-h-dvh w-full overflow-hidden bg-[#f7f8fa] md:min-h-[calc(100vh-3rem)] md:max-w-[520px] md:rounded-[2.25rem] md:border md:border-[#d5dce7] md:shadow-[0_32px_80px_rgba(28,54,94,.22)]">
        <header
          aria-label={schoolName}
          className="sticky top-0 z-30 flex min-h-[184px] flex-col justify-between overflow-hidden bg-[#2459aa] px-4 pb-4 pt-[max(14px,env(safe-area-inset-top))] text-white shadow-[0_8px_28px_rgba(34,78,150,.22)]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(43, 98, 180, .72), rgba(24, 65, 148, .94)), url('/demo/escola-cni-logo.png')",
            backgroundPosition: "center, center",
            backgroundRepeat: "no-repeat, no-repeat",
            backgroundSize: "cover, 70% auto",
          }}
        >
          <div className="relative flex justify-end">
            <Link
              href="/app/family/notifications"
              aria-label={`${notificationCount} notificações pendentes`}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur transition hover:bg-white/20"
            >
              <Bell size={19} />
              {notificationCount ? (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#2b61b4] bg-[#ff4d63] px-1 text-[9px] font-extrabold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </Link>
          </div>
          <div className="relative mt-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#153f8c]/45 p-3 backdrop-blur-[2px]">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white text-[10px] font-extrabold text-[#2a5fb2] shadow-sm">
              {childInitials}
            </span>
            <span className="min-w-0 flex-1">
              <small className="block truncate text-[9px] text-[#c8e0ff]">
                Acompanhando
              </small>
              <strong className="block truncate text-sm text-white">{childName}</strong>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[8px] font-bold text-[#c9dcf7]">
              utilizado por
              <strong className="font-[var(--font-display)] text-[11px] text-white">laço</strong>
            </span>
            <ChevronDown size={15} className="text-[#c8e0ff]" />
          </div>
        </header>

        <main className="px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-4">
          {children}
        </main>

        <nav
          aria-label="Navegação da família"
          className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full grid-cols-5 border-t border-[#e1e5eb] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_26px_rgba(35,73,128,.07)] backdrop-blur md:bottom-6 md:max-w-[518px] md:rounded-b-[2.25rem]"
        >
          {navigation.map((item) => {
            const active =
              item.href === "/app/family/calendar"
                ? pathname.startsWith("/app/family/calendar") ||
                  pathname.startsWith("/app/family/history")
                : item.group
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
                  active ? "text-[#2b61b4]" : "text-[#8a96a6]"
                }`}
              >
                {active ? (
                  <span className="absolute top-0 h-0.5 w-9 rounded-full bg-[#2b61b4]" />
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
