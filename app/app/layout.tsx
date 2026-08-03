import Link from "next/link";
import { BookOpen, CalendarDays, Camera, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { getCurrentContext } from "../lib/auth";
import { logout } from "../login/actions";
import { FamilyShell } from "./family/family-shell";
import { DirectionShell } from "./direction/direction-shell";

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
  const { supabase, membership, profile } = await getCurrentContext();
  const school = Array.isArray(membership.schools)
    ? membership.schools[0]
    : membership.schools;

  if (membership.role === "family") {
    const [
      { data: guardianLink },
      { count: communicationCount },
      { count: occurrenceCount },
      { count: billingCount },
      { count: libraryCount },
      { count: eventCount },
      { count: reminderCount },
    ] = await Promise.all([
      supabase
        .from("guardian_links")
        .select("children(first_name, last_name)")
        .eq("membership_id", membership.id)
        .eq("active", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("communication_recipients")
        .select("*", { count: "exact", head: true })
        .eq("membership_id", membership.id)
        .is("viewed_at", null),
      supabase
        .from("occurrence_recipients")
        .select("*", { count: "exact", head: true })
        .eq("membership_id", membership.id)
        .is("acknowledged_at", null),
      supabase
        .from("billing_documents")
        .select("*", { count: "exact", head: true })
        .eq("status", "distributed")
        .is("viewed_at", null),
      supabase
        .from("school_document_recipients")
        .select("*", { count: "exact", head: true })
        .eq("membership_id", membership.id)
        .is("viewed_at", null),
      supabase
        .from("school_event_recipients")
        .select("*, school_events!inner(status)", { count: "exact", head: true })
        .eq("membership_id", membership.id)
        .eq("school_events.status", "published")
        .is("viewed_at", null),
      supabase
        .from("school_event_reminders")
        .select("*", { count: "exact", head: true })
        .eq("membership_id", membership.id)
        .is("viewed_at", null),
    ]);
    const linkedChild = guardianLink
      ? Array.isArray(guardianLink.children)
        ? guardianLink.children[0]
        : guardianLink.children
      : null;
    const childName = linkedChild
      ? `${linkedChild.first_name} ${linkedChild.last_name}`
      : "Criança";
    const childInitials = linkedChild
      ? `${linkedChild.first_name[0] ?? ""}${linkedChild.last_name[0] ?? ""}`
      : "CR";
    return (
      <FamilyShell
        childName={childName}
        childInitials={childInitials}
        schoolName={school?.name ?? "Escola"}
        notificationCount={
          (communicationCount ?? 0) + (occurrenceCount ?? 0) + (billingCount ?? 0) + (libraryCount ?? 0) + (eventCount ?? 0) + (reminderCount ?? 0)
        }
      >
        {children}
      </FamilyShell>
    );
  }

  if (membership.role === "director") {
    return (
      <DirectionShell
        schoolName={school?.name ?? "Escola"}
        profileName={profile?.full_name ?? "Direção"}
      >
        {children}
      </DirectionShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#24312b]">
      <header className="border-b border-[#dfe1d9] bg-[#fffefa]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-[var(--font-display)] text-2xl font-extrabold text-[#315645]">
              SomaMais
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
            {membership.role === "teacher" && (
              <>
                <Link href="/app/teacher" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <BookOpen size={17} /> Rotina da turma
                </Link>
                <Link href="/app/teacher/calendar" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <CalendarDays size={17} /> Calendário
                </Link>
                <Link href="/app/teacher/photos" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/10">
                  <Camera size={17} /> Fotos da atividade
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
