import { redirect } from "next/navigation";
import { Camera, CheckCircle2, ShieldAlert } from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { publishActivityPhoto } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

type SearchParams = Promise<{ success?: string; classroom?: string }>;
export default async function TeacherPhotosPage({ searchParams }: { searchParams: SearchParams }) {
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
  return <div>
    <header><span className="text-[10px] font-extrabold tracking-[.16em] text-[#557164]">ATIVIDADE DA TURMA</span><h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">Publicar foto</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69746f]">Selecione manualmente todas as crianças que aparecem. O sistema confere a autorização antes de publicar.</p></header>
    {query.success ? <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#a8c4b4] bg-[#edf6f0] p-4 text-[#315645]"><CheckCircle2 size={20} /><strong className="text-sm">Foto publicada com segurança!</strong></div> : null}
    {classrooms && classrooms.length > 1 ? <nav className="mt-6 flex gap-2">{classrooms.map((item) => <a key={item.id} href={`/app/teacher/photos?classroom=${item.id}`} className={`rounded-xl px-4 py-2 text-xs font-bold ${item.id === classroomId ? "bg-[#315645] text-white" : "border border-[#dfe1d9] bg-white text-[#315645]"}`}>{item.name}</a>)}</nav> : null}
    {classroomId ? <form action={publishActivityPhoto} className="mt-6 max-w-3xl rounded-2xl border border-[#dfe1d9] bg-white p-5"><input type="hidden" name="classroomId" value={classroomId} /><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold">Imagem<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="input" required /></label><label className="grid gap-1.5 text-xs font-bold">Data da atividade<input type="date" name="activityDate" className="input" required /></label></div><label className="mt-4 grid gap-1.5 text-xs font-bold">Legenda<textarea name="caption" rows={3} className="input resize-none" required /></label><fieldset className="mt-5"><legend className="text-xs font-bold">Quem aparece na foto?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{enrollments?.map((enrollment) => { const child = Array.isArray(enrollment.children) ? enrollment.children[0] : enrollment.children; const authorized = consentMap.get(enrollment.child_id) === "authorized"; return <label key={enrollment.child_id} className={`flex items-center gap-3 rounded-xl border p-3 text-xs ${authorized ? "border-[#cddbd3] bg-[#f5faf6]" : "border-[#e4c6ac] bg-[#fff8ed]"}`}><input type="checkbox" name="childId" value={enrollment.child_id} disabled={!authorized} /><span><strong className="block">{child?.first_name} {child?.last_name}</strong><small className={authorized ? "text-[#315645]" : "text-[#9a623b]"}>{authorized ? "Autorização válida" : "Publicação bloqueada"}</small></span>{!authorized ? <ShieldAlert className="ml-auto text-[#9a623b]" size={16} /> : null}</label>; })}</div></fieldset><SubmitButton idleLabel={<><Camera size={15} /> Verificar e publicar</>} pendingLabel="Publicando..." className="mt-5 flex items-center gap-2 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white" /></form> : null}
  </div>;
}
