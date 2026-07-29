"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentContext } from "../lib/auth";

const uuid = z.string().uuid();

export async function markAllPresent(formData: FormData) {
  const parsed = z
    .object({
      schoolDayId: uuid,
      schoolId: uuid,
      childIds: z.array(uuid).min(1),
    })
    .safeParse({
      schoolDayId: formData.get("schoolDayId"),
      schoolId: formData.get("schoolId"),
      childIds: formData.getAll("childId"),
    });

  if (!parsed.success) throw new Error("Dados de chamada inválidos.");

  const { supabase, user, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");

  const rows = parsed.data.childIds.map((childId) => ({
    school_id: parsed.data.schoolId,
    school_day_id: parsed.data.schoolDayId,
    child_id: childId,
    status: "present" as const,
    recorded_by: user.id,
  }));

  const { error } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "school_day_id,child_id" });

  if (error) throw error;
  revalidatePath("/app/teacher");
  revalidatePath("/app/direction");
}

export async function recordMeal(formData: FormData) {
  const base = z
    .object({
      schoolDayId: uuid,
      schoolId: uuid,
      defaultStatus: z.enum(["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"]),
      childIds: z.array(uuid).min(1),
    })
    .parse({
      schoolDayId: formData.get("schoolDayId"),
      schoolId: formData.get("schoolId"),
      defaultStatus: formData.get("defaultStatus"),
      childIds: formData.getAll("childId"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");

  const rows = base.childIds.map((childId) => {
    const exception = formData.get(`meal-${childId}`);
    const label =
      typeof exception === "string" && exception.length > 0
        ? exception
        : base.defaultStatus;

    return {
      school_id: base.schoolId,
      school_day_id: base.schoolDayId,
      child_id: childId,
      category: "meal" as const,
      period_key: "lunch",
      value: { label },
      is_exception: label !== base.defaultStatus,
      recorded_by: user.id,
    };
  });

  const { error } = await supabase
    .from("routine_entries")
    .upsert(rows, {
      onConflict: "school_day_id,child_id,category,period_key",
    });

  if (error) throw error;
  revalidatePath("/app/teacher");
  revalidatePath("/app/direction");
}

export async function publishDay(formData: FormData) {
  const schoolDayId = uuid.parse(formData.get("schoolDayId"));
  const { supabase, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");

  const { error } = await supabase.rpc("publish_school_day", {
    target_day_id: schoolDayId,
  });

  if (error) throw error;
  revalidatePath("/app/teacher");
  revalidatePath("/app/direction");
  revalidatePath("/app/family");
}

export async function markSummaryViewed(formData: FormData) {
  const parsed = z
    .object({ summaryId: uuid, schoolId: uuid })
    .parse({
      summaryId: formData.get("summaryId"),
      schoolId: formData.get("schoolId"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: existing } = await supabase
    .from("summary_views")
    .select("id")
    .eq("summary_id", parsed.summaryId)
    .eq("viewer_id", user.id)
    .maybeSingle();

  const result = existing
    ? await supabase
        .from("summary_views")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase.from("summary_views").insert({
        school_id: parsed.schoolId,
        summary_id: parsed.summaryId,
        viewer_id: user.id,
      });

  if (result.error) throw result.error;
  revalidatePath("/app/family");
  revalidatePath("/app/direction");
}
