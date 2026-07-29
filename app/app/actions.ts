"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentContext } from "../lib/auth";

const uuid = z.string().uuid();
const routineCategory = z.enum([
  "meal",
  "hydration",
  "sleep",
  "hygiene",
  "activity",
  "note",
]);

function revalidateOperationalViews() {
  revalidatePath("/app/teacher");
  revalidatePath("/app/direction");
  revalidatePath("/app/family");
}

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

export async function recordRoutineBatch(formData: FormData) {
  const parsed = z
    .object({
      schoolDayId: uuid,
      schoolId: uuid,
      category: routineCategory,
      periodKey: z.string().min(1).max(40),
      defaultStatus: z.string().min(1).max(120),
      childIds: z.array(uuid).min(1),
    })
    .parse({
      schoolDayId: formData.get("schoolDayId"),
      schoolId: formData.get("schoolId"),
      category: formData.get("category"),
      periodKey: formData.get("periodKey"),
      defaultStatus: formData.get("defaultStatus"),
      childIds: formData.getAll("childId"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");
  if (membership.school_id !== parsed.schoolId) throw new Error("Escola inválida.");

  const rows = parsed.childIds.map((childId) => {
    const exception = formData.get(`exception-${childId}`);
    const label =
      typeof exception === "string" && exception.trim()
        ? exception.trim()
        : parsed.defaultStatus;

    return {
      school_id: parsed.schoolId,
      school_day_id: parsed.schoolDayId,
      child_id: childId,
      category: parsed.category,
      period_key: parsed.periodKey,
      value: { label },
      is_exception: label !== parsed.defaultStatus,
      recorded_by: user.id,
    };
  });

  const { error } = await supabase
    .from("routine_entries")
    .upsert(rows, {
      onConflict: "school_day_id,child_id,category,period_key",
    });
  if (error) throw error;

  revalidateOperationalViews();
}

export async function createShiftHandoff(formData: FormData) {
  const parsed = z
    .object({
      schoolDayId: uuid,
      schoolId: uuid,
      classroomId: uuid,
      fromShift: z.enum(["morning", "afternoon"]),
      toShift: z.enum(["morning", "afternoon"]),
      note: z.string().trim().min(3).max(500),
    })
    .refine((value) => value.fromShift !== value.toShift)
    .parse({
      schoolDayId: formData.get("schoolDayId"),
      schoolId: formData.get("schoolId"),
      classroomId: formData.get("classroomId"),
      fromShift: formData.get("fromShift"),
      toShift: formData.get("toShift"),
      note: formData.get("note"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");
  if (membership.school_id !== parsed.schoolId) throw new Error("Escola inválida.");

  const { error } = await supabase.from("shift_handoffs").insert({
    school_id: parsed.schoolId,
    school_day_id: parsed.schoolDayId,
    classroom_id: parsed.classroomId,
    from_shift: parsed.fromShift,
    to_shift: parsed.toShift,
    note: parsed.note,
    created_by: user.id,
  });
  if (error) throw error;

  revalidateOperationalViews();
}

export async function resolveShiftHandoff(formData: FormData) {
  const handoffId = uuid.parse(formData.get("handoffId"));
  const { supabase, membership } = await getCurrentContext();
  if (!["teacher", "director"].includes(membership.role)) redirect("/app");

  const { error } = await supabase.rpc("resolve_shift_handoff", {
    target_handoff_id: handoffId,
  });
  if (error) throw error;

  revalidateOperationalViews();
}

export async function updateClassroomConfiguration(formData: FormData) {
  const parsed = z.object({
    classroomId: uuid,
    schoolId: uuid,
    name: z.string().trim().min(2).max(80),
    ageGroup: z.string().trim().max(80),
    defaultStart: z.string().regex(/^\d{2}:\d{2}$/),
    defaultEnd: z.string().regex(/^\d{2}:\d{2}$/),
  }).parse({
    classroomId: formData.get("classroomId"),
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    ageGroup: formData.get("ageGroup"),
    defaultStart: formData.get("defaultStart"),
    defaultEnd: formData.get("defaultEnd"),
  });

  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  if (membership.school_id !== parsed.schoolId) throw new Error("Escola inválida.");

  const { error } = await supabase
    .from("classrooms")
    .update({
      name: parsed.name,
      age_group: parsed.ageGroup || null,
      default_start: parsed.defaultStart,
      default_end: parsed.defaultEnd,
    })
    .eq("id", parsed.classroomId)
    .eq("school_id", parsed.schoolId);
  if (error) throw error;

  revalidateOperationalViews();
}

export async function updateRoutineConfiguration(formData: FormData) {
  const parsed = z.object({
    classroomId: uuid,
    schoolId: uuid,
  }).parse({
    classroomId: formData.get("classroomId"),
    schoolId: formData.get("schoolId"),
  });

  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  if (membership.school_id !== parsed.schoolId) throw new Error("Escola inválida.");

  const categories = [
    "attendance",
    "meal",
    "hydration",
    "sleep",
    "hygiene",
    "activity",
    "note",
  ] as const;
  const defaultOptions: Record<(typeof categories)[number], string[]> = {
    attendance: [],
    meal: ["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"],
    hydration: ["Hidratou-se normalmente", "Bebeu pouco", "Recusou água"],
    sleep: ["Dormiu bem", "Sono curto", "Não dormiu"],
    hygiene: ["Sem observações", "Evacuou", "Precisou de troca extra"],
    activity: ["Participou", "Participou com apoio", "Preferiu observar"],
    note: ["Sem observações"],
  };

  const rows = categories.map((category, position) => ({
    school_id: parsed.schoolId,
    classroom_id: parsed.classroomId,
    category,
    enabled: formData.get(`enabled-${category}`) === "on",
    required: formData.get(`required-${category}`) === "on",
    position: position + 1,
    options: defaultOptions[category],
  }));

  const { error } = await supabase
    .from("routine_configurations")
    .upsert(rows, { onConflict: "classroom_id,category" });
  if (error) throw error;

  revalidateOperationalViews();
}

export async function updateEnrollmentSchedule(formData: FormData) {
  const parsed = z.object({
    enrollmentId: uuid,
    schoolId: uuid,
    schedule: z.enum(["morning", "afternoon", "full", "custom"]),
    expectedStart: z.string().regex(/^\d{2}:\d{2}$/),
    expectedEnd: z.string().regex(/^\d{2}:\d{2}$/),
  }).parse({
    enrollmentId: formData.get("enrollmentId"),
    schoolId: formData.get("schoolId"),
    schedule: formData.get("schedule"),
    expectedStart: formData.get("expectedStart"),
    expectedEnd: formData.get("expectedEnd"),
  });

  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  if (membership.school_id !== parsed.schoolId) throw new Error("Escola inválida.");

  const scheduleNames = {
    morning: "Manhã",
    afternoon: "Tarde",
    full: "Integral",
    custom: "Personalizado",
  };
  const presetTimes = {
    morning: ["07:30", "12:00"],
    afternoon: ["12:30", "17:30"],
    full: ["07:30", "17:30"],
    custom: [parsed.expectedStart, parsed.expectedEnd],
  };
  const [expectedStart, expectedEnd] = presetTimes[parsed.schedule];

  const { error } = await supabase
    .from("enrollments")
    .update({
      schedule_name: scheduleNames[parsed.schedule],
      expected_start: expectedStart,
      expected_end: expectedEnd,
    })
    .eq("id", parsed.enrollmentId)
    .eq("school_id", parsed.schoolId);
  if (error) throw error;

  revalidateOperationalViews();
}

const scheduleSchema = z.enum(["morning", "afternoon", "full", "custom"]);

function scheduleDetails(
  schedule: z.infer<typeof scheduleSchema>,
  customStart: string,
  customEnd: string,
) {
  const values = {
    morning: { name: "Manhã", start: "07:30", end: "12:00" },
    afternoon: { name: "Tarde", start: "12:30", end: "17:30" },
    full: { name: "Integral", start: "07:30", end: "17:30" },
    custom: { name: "Personalizado", start: customStart, end: customEnd },
  };
  return values[schedule];
}

export async function createClassroom(formData: FormData) {
  const parsed = z.object({
    name: z.string().trim().min(2).max(80),
    ageGroup: z.string().trim().max(80),
    defaultStart: z.string().regex(/^\d{2}:\d{2}$/),
    defaultEnd: z.string().regex(/^\d{2}:\d{2}$/),
    teacherMembershipId: z.union([uuid, z.literal("")]),
  }).parse({
    name: formData.get("name"),
    ageGroup: formData.get("ageGroup"),
    defaultStart: formData.get("defaultStart"),
    defaultEnd: formData.get("defaultEnd"),
    teacherMembershipId: formData.get("teacherMembershipId") ?? "",
  });

  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  if (parsed.teacherMembershipId) {
    const { data: teacher } = await supabase
      .from("school_memberships")
      .select("id")
      .eq("id", parsed.teacherMembershipId)
      .eq("school_id", membership.school_id)
      .eq("role", "teacher")
      .eq("status", "active")
      .maybeSingle();
    if (!teacher) throw new Error("Professora inválida.");
  }

  const { data: classroom, error } = await supabase
    .from("classrooms")
    .insert({
      school_id: membership.school_id,
      name: parsed.name,
      age_group: parsed.ageGroup || null,
      default_start: parsed.defaultStart,
      default_end: parsed.defaultEnd,
    })
    .select("id")
    .single();
  if (error) throw error;

  const defaults = [
    ["attendance", true, true, []],
    ["meal", true, true, ["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"]],
    ["hydration", true, true, ["Hidratou-se normalmente", "Bebeu pouco", "Recusou água"]],
    ["sleep", true, false, ["Dormiu bem", "Sono curto", "Não dormiu"]],
    ["hygiene", true, false, ["Sem observações", "Evacuou", "Precisou de troca extra"]],
    ["activity", true, true, ["Participou", "Participou com apoio", "Preferiu observar"]],
    ["note", false, false, ["Sem observações"]],
  ] as const;
  const { error: configError } = await supabase
    .from("routine_configurations")
    .insert(defaults.map(([category, enabled, required, options], index) => ({
      school_id: membership.school_id,
      classroom_id: classroom.id,
      category,
      enabled,
      required,
      position: index + 1,
      options: [...options],
    })));
  if (configError) throw configError;

  if (parsed.teacherMembershipId) {
    const { error: staffError } = await supabase.from("classroom_staff").insert({
      school_id: membership.school_id,
      classroom_id: classroom.id,
      membership_id: parsed.teacherMembershipId,
    });
    if (staffError) throw staffError;
  }

  revalidateOperationalViews();
  revalidatePath("/app/direction/registry");
  redirect(`/app/direction?classroom=${classroom.id}`);
}

export async function createEnrolledChild(formData: FormData) {
  const parsed = z.object({
    classroomId: uuid,
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(120),
    birthDate: z.iso.date(),
    schedule: scheduleSchema,
    expectedStart: z.string().regex(/^\d{2}:\d{2}$/),
    expectedEnd: z.string().regex(/^\d{2}:\d{2}$/),
  }).parse({
    classroomId: formData.get("classroomId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    schedule: formData.get("schedule"),
    expectedStart: formData.get("expectedStart"),
    expectedEnd: formData.get("expectedEnd"),
  });

  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id")
    .eq("id", parsed.classroomId)
    .eq("school_id", membership.school_id)
    .eq("active", true)
    .maybeSingle();
  if (!classroom) throw new Error("Turma inválida.");
  const schedule = scheduleDetails(
    parsed.schedule,
    parsed.expectedStart,
    parsed.expectedEnd,
  );

  const { data: child, error: childError } = await supabase
    .from("children")
    .insert({
      school_id: membership.school_id,
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      birth_date: parsed.birthDate,
    })
    .select("id")
    .single();
  if (childError) throw childError;

  const { error: enrollmentError } = await supabase.from("enrollments").insert({
    school_id: membership.school_id,
    child_id: child.id,
    classroom_id: parsed.classroomId,
    schedule_name: schedule.name,
    expected_start: schedule.start,
    expected_end: schedule.end,
    starts_on: new Date().toISOString().slice(0, 10),
  });
  if (enrollmentError) {
    await supabase.from("children").delete().eq("id", child.id);
    throw enrollmentError;
  }

  revalidateOperationalViews();
  revalidatePath("/app/direction/registry");
}

const rosterRow = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(120),
  birthDate: z.iso.date(),
  schedule: scheduleSchema,
  expectedStart: z.string().regex(/^\d{2}:\d{2}$/),
  expectedEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

export type RosterImportState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function importRoster(
  _previousState: RosterImportState,
  formData: FormData,
): Promise<RosterImportState> {
  const classroomId = uuid.safeParse(formData.get("classroomId"));
  let rawRows: unknown;
  try {
    rawRows = JSON.parse(String(formData.get("rosterJson") ?? "[]"));
  } catch {
    return { status: "error", message: "O arquivo não pôde ser interpretado." };
  }
  const rows = z.array(rosterRow).min(1).max(100).safeParse(rawRows);
  if (!classroomId.success || !rows.success) {
    return { status: "error", message: "Revise os campos destacados antes de importar." };
  }

  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id")
    .eq("id", classroomId.data)
    .eq("school_id", membership.school_id)
    .maybeSingle();
  if (!classroom) return { status: "error", message: "Turma inválida." };

  const normalized = rows.data.map((row) =>
    `${row.firstName} ${row.lastName}`.toLocaleLowerCase("pt-BR"),
  );
  if (new Set(normalized).size !== normalized.length) {
    return { status: "error", message: "O arquivo contém crianças duplicadas." };
  }

  const { data: existing } = await supabase
    .from("children")
    .select("first_name, last_name")
    .eq("school_id", membership.school_id);
  const existingNames = new Set(
    (existing ?? []).map((child) =>
      `${child.first_name} ${child.last_name}`.toLocaleLowerCase("pt-BR"),
    ),
  );
  const duplicate = normalized.find((name) => existingNames.has(name));
  if (duplicate) {
    return { status: "error", message: `Já existe um cadastro para ${duplicate}.` };
  }

  const { data: insertedChildren, error: childError } = await supabase
    .from("children")
    .insert(rows.data.map((row) => ({
      school_id: membership.school_id,
      first_name: row.firstName,
      last_name: row.lastName,
      birth_date: row.birthDate,
    })))
    .select("id, first_name, last_name");
  if (childError || !insertedChildren) {
    return { status: "error", message: childError?.message ?? "Falha ao cadastrar crianças." };
  }

  const rowByName = new Map(
    rows.data.map((row) => [
      `${row.firstName} ${row.lastName}`.toLocaleLowerCase("pt-BR"),
      row,
    ]),
  );
  const { error: enrollmentError } = await supabase.from("enrollments").insert(
    insertedChildren.map((child) => {
      const row = rowByName.get(
        `${child.first_name} ${child.last_name}`.toLocaleLowerCase("pt-BR"),
      )!;
      const schedule = scheduleDetails(
        row.schedule,
        row.expectedStart,
        row.expectedEnd,
      );
      return {
        school_id: membership.school_id,
        child_id: child.id,
        classroom_id: classroomId.data,
        schedule_name: schedule.name,
        expected_start: schedule.start,
        expected_end: schedule.end,
        starts_on: new Date().toISOString().slice(0, 10),
      };
    }),
  );
  if (enrollmentError) {
    await supabase
      .from("children")
      .delete()
      .in("id", insertedChildren.map((child) => child.id));
    return { status: "error", message: enrollmentError.message };
  }

  revalidateOperationalViews();
  revalidatePath("/app/direction/registry");
  return {
    status: "success",
    message: `${insertedChildren.length} crianças importadas com sucesso.`,
  };
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
