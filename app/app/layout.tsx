import { getCurrentContext } from "../lib/auth";
import { FamilyShell } from "./family/family-shell";
import { DirectionShell } from "./direction/direction-shell";
import { TeacherShell } from "./teacher/teacher-shell";

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
    const { data: shellContext, error: shellError } = await supabase
      .rpc("get_family_shell_context", { target_membership_id: membership.id })
      .maybeSingle();
    if (shellError) throw shellError;
    const linkedChild = shellContext?.child_first_name
      ? { first_name: shellContext.child_first_name, last_name: shellContext.child_last_name ?? "" }
      : null;
    const communicationCount = Number(shellContext?.notification_count ?? 0);
    const occurrenceCount = 0;
    const billingCount = 0;
    const libraryCount = 0;
    const eventCount = 0;
    const reminderCount = 0;
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

  const { data: avatar } = profile?.avatar_path
    ? await supabase.storage.from("teacher-avatars").createSignedUrl(profile.avatar_path, 3600)
    : { data: null };
  return <TeacherShell schoolName={school?.name ?? "Escola"} profileName={profile?.full_name ?? "Professora"} avatarUrl={avatar?.signedUrl}>{children}</TeacherShell>;
}
