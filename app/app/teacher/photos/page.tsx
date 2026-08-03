import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { MediaUploadForm } from "./media-upload-form";

type SearchParams = Promise<{ success?: string; classroom?: string }>;
export default async function TeacherGalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");
  const { data: assignments } = membership.role === "teacher" ? await supabase.from("classroom_staff").select("classroom_id").eq("membership_id", membership.id) : { data: null };
  let classroomQuery = supabase.from("classrooms").select("id, name").eq("school_id", membership.school_id).eq("active", true);
  if (assignments) classroomQuery = classroomQuery.in("id", assignments.map((item) => item.classroom_id));
  const { data: classrooms } = await classroomQuery.order("name");
  const classroomId = classrooms?.some((item) => item.id === query.classroom) ? query.classroom! : classrooms?.[0]?.id;
  const [{ data: enrollments }, { data: consents }] = classroomId ? await Promise.all([
    supabase.from("enrollments").select("child_id, children(first_name, last_name)").eq("classroom_id", classroomId).eq("status", "active"),
    supabase.from("image_consents").select("child_id, status").eq("school_id", membership.school_id),
  ]) : [{ data: [] }, { data: [] }];
  const consentMap = new Map(consents?.map((item) => [item.child_id, item.status]));
  const childOptions = (enrollments ?? []).map((enrollment) => { const child = Array.isArray(enrollment.children) ? enrollment.children[0] : enrollment.children; return { id: enrollment.child_id, name: `${child?.first_name ?? ""} ${child?.last_name ?? ""}`.trim(), authorized: consentMap.get(enrollment.child_id) === "authorized" }; });
  return <div>
    <header><span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">MOMENTOS DA TURMA</span><h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Publicar na galeria</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#61758d]">Envie fotos ou vídeos e identifique manualmente todas as crianças. O sistema verifica as autorizações antes de publicar.</p></header>
    {query.success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd]"><CheckCircle2 size={20} /><strong className="text-sm">Publicação adicionada à galeria com segurança!</strong></div> : null}
    {classrooms && classrooms.length > 1 ? <nav className="mt-6 flex flex-wrap gap-2">{classrooms.map((item) => <a key={item.id} href={`/app/teacher/photos?classroom=${item.id}`} className={`rounded-xl px-4 py-2 text-xs font-bold ${item.id === classroomId ? "bg-[#0759bd] text-white" : "border border-[#dce6f2] bg-white text-[#386b9f]"}`}>{item.name}</a>)}</nav> : null}
    {classroomId ? <MediaUploadForm schoolId={membership.school_id} classroomId={classroomId} childOptions={childOptions} /> : null}
  </div>;
}
