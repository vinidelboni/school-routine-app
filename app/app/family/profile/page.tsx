import Image from "next/image";
import { redirect } from "next/navigation";
import { GraduationCap, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";
import { logout } from "../../../login/actions";

export default async function FamilyProfilePage() {
  const { supabase, user, membership, profile } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const school = Array.isArray(membership.schools)
    ? membership.schools[0]
    : membership.schools;

  const [{ data: links, error }, { data: childTeachers, error: teachersError }] = await Promise.all([
    supabase.from("guardian_links").select("id, relationship, can_view_routine, children(first_name, last_name)").eq("membership_id", membership.id).eq("active", true),
    supabase.rpc("get_family_child_teachers", { target_membership_id: membership.id }),
  ]);
  if (error) throw error;
  if (teachersError) throw teachersError;

  const avatarPaths = [...new Set((childTeachers ?? []).map((item) => item.teacher_avatar_path).filter((path): path is string => Boolean(path)))];
  const admin = createSupabaseAdminClient();
  const signedAvatars = new Map<string, string>();
  await Promise.all(avatarPaths.map(async (path) => {
    const { data } = await admin.storage.from("teacher-avatars").createSignedUrl(path, 3600);
    if (data?.signedUrl) signedAvatars.set(path, data.signedUrl);
  }));

  return (
    <div>
      <header className="px-1 pt-1">
        <span className="text-[9px] font-extrabold tracking-[.16em] text-[#557164]">
          PERFIL
        </span>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-[-.05em]">
          Sua conta
        </h1>
      </header>

      <section className="mt-5 rounded-3xl border border-[#e0e2dc] bg-white p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#dceae2] text-[#315645]">
            <UserRound size={24} />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-base">{profile?.full_name}</strong>
            <small className="mt-1 flex items-center gap-1 truncate text-[10px] text-[#7c8680]">
              <Mail size={12} /> {user.email}
            </small>
          </span>
        </div>
        <div className="mt-5 rounded-2xl bg-[#f3f5f1] p-4">
          <small className="text-[9px] font-bold uppercase tracking-[.1em] text-[#829087]">
            Escola vinculada
          </small>
          <strong className="mt-1 block text-sm">{school?.name}</strong>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-1 text-xs font-extrabold text-[#4d5e55]">Crianças e acessos</h2>
        <div className="mt-2 grid gap-2">
          {links?.map((link) => {
            const child = Array.isArray(link.children)
              ? link.children[0]
              : link.children;
            const teamRows = (childTeachers ?? []).filter((item) => item.guardian_link_id === link.id);
            const classroomName = teamRows[0]?.classroom_name;
            const team = teamRows.filter((item) => item.teacher_membership_id && item.teacher_name);
            return (
              <article
                key={link.id}
                className="rounded-2xl border border-[#e0e2dc] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck size={19} className="mt-0.5 text-[#4e8069]" />
                  <span>
                    <strong className="block text-sm">
                      {child?.first_name} {child?.last_name}
                    </strong>
                    <small className="mt-1 block text-[10px] text-[#7c8680]">
                      {link.relationship ?? "Responsável"} · acesso individual protegido
                    </small>
                    <div className="mt-3 rounded-xl bg-[#f1f7ff] p-3">
                      <small className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#386b9f]">
                        <GraduationCap size={13} /> {classroomName ?? "Turma em definição"}
                      </small>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {team.map((teacher) => {
                          const avatarUrl = teacher.teacher_avatar_path ? signedAvatars.get(teacher.teacher_avatar_path) : undefined;
                          return <span key={teacher.teacher_membership_id} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 text-[10px] font-bold text-[#17375e] shadow-sm">
                            <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dcecff] text-[#0759bd]">
                              {avatarUrl ? <Image src={avatarUrl} alt="" width={28} height={28} className="h-full w-full object-cover" /> : <UserRound size={14} />}
                            </span>
                            Prof.ª {teacher.teacher_name}
                          </span>;
                        })}
                        {!team.length ? <small className="text-[10px] text-[#6f8299]">Equipe pedagógica em definição.</small> : null}
                      </div>
                    </div>
                    <span className="mt-2 flex flex-wrap gap-1">
                      {link.can_view_routine ? <Permission label="Agenda" /> : null}
                      <Permission label="Galeria autorizada" />
                      <Permission label="Documentos vinculados" />
                    </span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <form action={logout} className="mt-5">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d9ddd8] bg-white py-4 text-xs font-bold text-[#855447] active:bg-[#f7efec]">
          <LogOut size={17} /> Sair do aplicativo
        </button>
      </form>
      <p className="mt-4 text-center text-[9px] text-[#909792]">
        Ambiente demonstrativo · dados fictícios
      </p>
    </div>
  );
}

function Permission({ label }: { label: string }) {
  return (
    <small className="rounded-full bg-[#e8f0eb] px-2 py-1 text-[8px] font-bold text-[#416b57]">
      {label}
    </small>
  );
}
