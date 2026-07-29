"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentContext } from "../lib/auth";
import {
  allowedCommunicationResponses,
  type CommunicationKind,
  type CommunicationResponse,
} from "../lib/communications";

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
  redirect(`/app/direction/registry?classroom=${classroom.id}&success=classroom-created`);
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
  redirect(`/app/direction/registry?classroom=${parsed.classroomId}&success=child-created`);
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

const contactKindSchema = z.enum([
  "primary_guardian",
  "additional_guardian",
  "emergency_contact",
  "pickup_only",
]);

export async function createFamilyContact(formData: FormData) {
  const parsed = z
    .object({
      childIds: z.array(uuid).min(1),
      fullName: z.string().trim().min(3).max(160),
      email: z.union([z.email(), z.literal("")]),
      phone: z.string().trim().min(8).max(30),
      relationship: z.string().trim().min(2).max(60),
      kind: contactKindSchema,
      canViewRoutine: z.boolean(),
      canViewPhotos: z.boolean(),
      canViewCommunications: z.boolean(),
      canViewDocuments: z.boolean(),
      sendInvite: z.boolean(),
    })
    .parse({
      childIds: formData.getAll("childIds"),
      fullName: formData.get("fullName"),
      email: formData.get("email") ?? "",
      phone: formData.get("phone"),
      relationship: formData.get("relationship"),
      kind: formData.get("kind"),
      canViewRoutine: formData.get("canViewRoutine") === "on",
      canViewPhotos: formData.get("canViewPhotos") === "on",
      canViewCommunications: formData.get("canViewCommunications") === "on",
      canViewDocuments: formData.get("canViewDocuments") === "on",
      sendInvite: formData.get("sendInvite") === "on",
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: validChildren } = await supabase
    .from("children")
    .select("id")
    .eq("school_id", membership.school_id)
    .eq("active", true)
    .in("id", parsed.childIds);
  if (validChildren?.length !== new Set(parsed.childIds).size) {
    throw new Error("Uma ou mais crianças são inválidas.");
  }

  const grantsAppAccess = ["primary_guardian", "additional_guardian"].includes(
    parsed.kind,
  );
  if (parsed.sendInvite && (!grantsAppAccess || !parsed.email)) {
    throw new Error("O convite exige um responsável com e-mail válido.");
  }

  const invitedAt = parsed.sendInvite ? new Date() : null;
  const invitationExpiresAt = invitedAt
    ? new Date(invitedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const { data: contact, error: contactError } = await supabase
    .from("family_contacts")
    .insert({
      school_id: membership.school_id,
      full_name: parsed.fullName,
      email: parsed.email || null,
      phone: parsed.phone,
      access_status: parsed.sendInvite ? "pending" : "not_invited",
      invited_at: invitedAt?.toISOString() ?? null,
      invitation_expires_at: invitationExpiresAt?.toISOString() ?? null,
    })
    .select("id")
    .single();
  if (contactError) throw contactError;

  const permissions = grantsAppAccess
    ? {
        can_view_routine: parsed.canViewRoutine,
        can_view_photos: parsed.canViewPhotos,
        can_view_communications: parsed.canViewCommunications,
        can_view_documents: parsed.canViewDocuments,
      }
    : {
        can_view_routine: false,
        can_view_photos: false,
        can_view_communications: false,
        can_view_documents: false,
      };
  const { error: linksError } = await supabase.from("child_contact_links").insert(
    parsed.childIds.map((childId) => ({
      school_id: membership.school_id,
      child_id: childId,
      contact_id: contact.id,
      kind: parsed.kind,
      relationship: parsed.relationship,
      ...permissions,
    })),
  );
  if (linksError) {
    await supabase.from("family_contacts").delete().eq("id", contact.id);
    throw linksError;
  }

  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "family_contact.created",
    entity_type: "family_contact",
    entity_id: contact.id,
    metadata: {
      child_ids: parsed.childIds,
      kind: parsed.kind,
      invitation_requested: parsed.sendInvite,
    },
  });

  revalidatePath("/app/direction/families");
  redirect(
    `/app/direction/families?contact=${contact.id}&success=contact-created`,
  );
}

export async function updateFamilyAccessStatus(formData: FormData) {
  const parsed = z
    .object({
      contactId: uuid,
      status: z.enum(["pending", "active", "expired", "suspended"]),
    })
    .parse({
      contactId: formData.get("contactId"),
      status: formData.get("status"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const now = new Date();
  const update = {
    access_status: parsed.status,
    invited_at: parsed.status === "pending" ? now.toISOString() : undefined,
    invitation_expires_at:
      parsed.status === "pending"
        ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    activated_at: parsed.status === "active" ? now.toISOString() : undefined,
    suspended_at:
      parsed.status === "suspended" ? now.toISOString() : null,
  };
  const { data: contact, error } = await supabase
    .from("family_contacts")
    .update(update)
    .eq("id", parsed.contactId)
    .eq("school_id", membership.school_id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!contact) throw new Error("Contato inválido.");

  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "family_contact.access_status_updated",
    entity_type: "family_contact",
    entity_id: contact.id,
    metadata: { status: parsed.status },
  });

  revalidatePath("/app/direction/families");
  redirect(
    `/app/direction/families?contact=${contact.id}&success=status-updated`,
  );
}

const familyRequestTypeSchema = z.enum([
  "absence",
  "late_arrival",
  "early_departure",
  "poor_sleep",
  "toilet_training",
  "pickup_change",
  "extended_period",
]);

export async function createFamilyRequest(formData: FormData) {
  const parsed = z
    .object({
      childId: uuid,
      requestType: familyRequestTypeSchema,
      effectiveDate: z.iso.date(),
      detailPrimary: z.string().trim().min(1).max(160),
      detailSecondary: z.string().trim().max(160),
    })
    .parse({
      childId: formData.get("childId"),
      requestType: formData.get("requestType"),
      effectiveDate: formData.get("effectiveDate"),
      detailPrimary: formData.get("detailPrimary"),
      detailSecondary: formData.get("detailSecondary") ?? "",
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: guardianLink } = await supabase
    .from("guardian_links")
    .select("id, school_id")
    .eq("membership_id", membership.id)
    .eq("child_id", parsed.childId)
    .eq("active", true)
    .maybeSingle();
  if (!guardianLink || guardianLink.school_id !== membership.school_id) {
    throw new Error("Vínculo familiar inválido.");
  }

  const detailKeys = {
    absence: ["reason", "note"],
    late_arrival: ["expected_time", "reason"],
    early_departure: ["departure_time", "pickup_person"],
    poor_sleep: ["sleep_note", "wake_note"],
    toilet_training: ["stage", "care_note"],
    pickup_change: ["pickup_person", "relationship"],
    extended_period: ["requested_until", "reason"],
  } as const;
  const [primaryKey, secondaryKey] = detailKeys[parsed.requestType];
  const { data: request, error } = await supabase
    .from("family_requests")
    .insert({
      school_id: membership.school_id,
      child_id: parsed.childId,
      created_by: user.id,
      request_type: parsed.requestType,
      effective_date: parsed.effectiveDate,
      details: {
        [primaryKey]: parsed.detailPrimary,
        [secondaryKey]: parsed.detailSecondary,
      },
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "family_request.created",
    entity_type: "family_request",
    entity_id: request.id,
    metadata: {
      request_type: parsed.requestType,
      effective_date: parsed.effectiveDate,
    },
  });

  revalidatePath("/app/family/requests");
  revalidatePath("/app/direction/requests");
  redirect(`/app/family/requests?success=request-created`);
}

export async function handleFamilyRequest(formData: FormData) {
  const parsed = z
    .object({
      requestId: uuid,
      status: z.enum(["acknowledged", "approved", "declined", "completed"]),
    })
    .parse({
      requestId: formData.get("requestId"),
      status: formData.get("status"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: request } = await supabase
    .from("family_requests")
    .select("id, request_type")
    .eq("id", parsed.requestId)
    .eq("school_id", membership.school_id)
    .maybeSingle();
  if (!request) throw new Error("Solicitação inválida.");

  const isApproval = ["approved", "declined"].includes(parsed.status);
  if (
    (request.request_type === "extended_period" && !isApproval) ||
    (request.request_type !== "extended_period" && isApproval)
  ) {
    throw new Error("A situação escolhida não se aplica a este aviso.");
  }

  const { error } = await supabase
    .from("family_requests")
    .update({
      status: parsed.status,
      handled_by: user.id,
      handled_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .eq("school_id", membership.school_id);
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "family_request.status_updated",
    entity_type: "family_request",
    entity_id: request.id,
    metadata: { status: parsed.status },
  });

  revalidatePath("/app/family/requests");
  revalidatePath("/app/direction/requests");
  revalidatePath("/app/direction");
  redirect(`/app/direction/requests?success=request-updated`);
}

export async function createMedicationRequest(formData: FormData) {
  const parsed = z
    .object({
      childId: uuid,
      medicationName: z.string().trim().min(2).max(120),
      dosage: z.string().trim().min(1).max(80),
      scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
      startsOn: z.iso.date(),
      endsOn: z.iso.date(),
      instructions: z.string().trim().min(3).max(500),
      authorizationReference: z.string().trim().min(3).max(200),
      policyConfirmed: z.literal("on"),
    })
    .refine((value) => value.endsOn >= value.startsOn, {
      message: "A data final deve ser igual ou posterior à inicial.",
    })
    .parse({
      childId: formData.get("childId"),
      medicationName: formData.get("medicationName"),
      dosage: formData.get("dosage"),
      scheduledTime: formData.get("scheduledTime"),
      startsOn: formData.get("startsOn"),
      endsOn: formData.get("endsOn"),
      instructions: formData.get("instructions"),
      authorizationReference: formData.get("authorizationReference"),
      policyConfirmed: formData.get("policyConfirmed"),
    });

  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { data: link } = await supabase
    .from("guardian_links")
    .select("id")
    .eq("membership_id", membership.id)
    .eq("child_id", parsed.childId)
    .eq("active", true)
    .maybeSingle();
  if (!link) throw new Error("Vínculo familiar inválido.");

  const { data: request, error } = await supabase
    .from("medication_requests")
    .insert({
      school_id: membership.school_id,
      child_id: parsed.childId,
      created_by: user.id,
      medication_name: parsed.medicationName,
      dosage: parsed.dosage,
      scheduled_time: parsed.scheduledTime,
      starts_on: parsed.startsOn,
      ends_on: parsed.endsOn,
      instructions: parsed.instructions,
      authorization_reference: parsed.authorizationReference,
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "medication_request.created",
    entity_type: "medication_request",
    entity_id: request.id,
    metadata: { starts_on: parsed.startsOn, ends_on: parsed.endsOn },
  });
  revalidatePath("/app/family/medications");
  revalidatePath("/app/direction/medications");
  redirect("/app/family/medications?success=request-created");
}

export async function handleMedicationRequest(formData: FormData) {
  const parsed = z
    .object({
      requestId: uuid,
      status: z.enum(["accepted", "declined"]),
    })
    .parse({
      requestId: formData.get("requestId"),
      status: formData.get("status"),
    });
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: request, error } = await supabase
    .from("medication_requests")
    .update({
      status: parsed.status,
      handled_by: user.id,
      handled_at: new Date().toISOString(),
    })
    .eq("id", parsed.requestId)
    .eq("school_id", membership.school_id)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!request) throw new Error("Solicitação de medicamento inválida.");

  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "medication_request.status_updated",
    entity_type: "medication_request",
    entity_id: request.id,
    metadata: { status: parsed.status },
  });
  revalidatePath("/app/family/medications");
  revalidatePath("/app/direction/medications");
  redirect("/app/direction/medications?success=request-updated");
}

export async function recordMedicationAdministration(formData: FormData) {
  const parsed = z
    .object({
      requestId: uuid,
      administrationStatus: z.enum(["administered", "not_administered"]),
      note: z.string().trim().max(300),
    })
    .parse({
      requestId: formData.get("requestId"),
      administrationStatus: formData.get("administrationStatus"),
      note: formData.get("note") ?? "",
    });
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const { data: request } = await supabase
    .from("medication_requests")
    .select("id, scheduled_time, ends_on")
    .eq("id", parsed.requestId)
    .eq("school_id", membership.school_id)
    .eq("status", "accepted")
    .maybeSingle();
  if (!request) throw new Error("Solicitação não está aceita.");

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const { error } = await supabase.from("medication_administrations").insert({
    school_id: membership.school_id,
    request_id: request.id,
    scheduled_for: `${today}T${request.scheduled_time}-03:00`,
    status: parsed.administrationStatus,
    note: parsed.note || null,
    recorded_by: user.id,
  });
  if (error) throw error;

  if (request.ends_on <= today) {
    await supabase
      .from("medication_requests")
      .update({ status: "completed" })
      .eq("id", request.id);
  }
  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "medication_administration.recorded",
    entity_type: "medication_request",
    entity_id: request.id,
    metadata: { status: parsed.administrationStatus },
  });
  revalidatePath("/app/family/medications");
  revalidatePath("/app/direction/medications");
  redirect("/app/direction/medications?success=administration-recorded");
}

const billingDocumentInput = z.object({
  filename: z.string().trim().min(1).max(240),
  childId: z.union([uuid, z.literal("")]),
  confidence: z.number().min(0).max(100),
  dueDate: z.iso.date(),
  paymentReference: z.string().trim().min(3).max(160),
});

export async function createBillingBatch(formData: FormData) {
  const parsed = z.object({
    title: z.string().trim().min(3).max(120),
    referenceMonth: z.iso.date(),
    documents: z.array(billingDocumentInput).min(1).max(100),
  }).parse({
    title: formData.get("title"),
    referenceMonth: formData.get("referenceMonth"),
    documents: JSON.parse(String(formData.get("documentsJson") ?? "[]")),
  });
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const selectedChildIds = parsed.documents
    .map((document) => document.childId)
    .filter(Boolean);
  if (selectedChildIds.length) {
    const { data: validChildren } = await supabase
      .from("children")
      .select("id")
      .eq("school_id", membership.school_id)
      .in("id", selectedChildIds);
    if (validChildren?.length !== new Set(selectedChildIds).size) {
      throw new Error("Um dos pareamentos não pertence a esta escola.");
    }
  }

  const { data: batch, error: batchError } = await supabase
    .from("billing_batches")
    .insert({
      school_id: membership.school_id,
      title: parsed.title,
      reference_month: parsed.referenceMonth,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (batchError) throw batchError;

  const { error: documentsError } = await supabase
    .from("billing_documents")
    .insert(
      parsed.documents.map((document) => ({
        school_id: membership.school_id,
        batch_id: batch.id,
        child_id: document.childId || null,
        original_filename: document.filename,
        due_date: document.dueDate,
        payment_reference: document.paymentReference,
        match_confidence: document.confidence,
        status:
          document.childId && document.confidence >= 70
            ? ("matched" as const)
            : ("needs_review" as const),
      })),
    );
  if (documentsError) {
    await supabase.from("billing_batches").delete().eq("id", batch.id);
    throw documentsError;
  }
  revalidatePath("/app/direction/billing");
  redirect(`/app/direction/billing?batch=${batch.id}&success=batch-created`);
}

export async function updateBillingMatches(formData: FormData) {
  const batchId = uuid.parse(formData.get("batchId"));
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const { data: documents } = await supabase
    .from("billing_documents")
    .select("id")
    .eq("batch_id", batchId)
    .eq("school_id", membership.school_id);
  if (!documents?.length) throw new Error("Lote inválido.");

  for (const document of documents) {
    const childId = uuid.parse(formData.get(`child-${document.id}`));
    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("school_id", membership.school_id)
      .maybeSingle();
    if (!child) throw new Error("Criança inválida.");
    const { error } = await supabase
      .from("billing_documents")
      .update({ child_id: childId, status: "matched" })
      .eq("id", document.id)
      .eq("school_id", membership.school_id);
    if (error) throw error;
  }
  revalidatePath("/app/direction/billing");
  redirect(`/app/direction/billing?batch=${batchId}&success=matches-updated`);
}

export async function distributeBillingBatch(formData: FormData) {
  const batchId = uuid.parse(formData.get("batchId"));
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");
  const { data: documents } = await supabase
    .from("billing_documents")
    .select("id, child_id, status")
    .eq("batch_id", batchId)
    .eq("school_id", membership.school_id);
  if (!documents?.length || documents.some((document) => !document.child_id)) {
    throw new Error("Revise todos os pareamentos antes de distribuir.");
  }
  const distributedAt = new Date().toISOString();
  const { error: documentError } = await supabase
    .from("billing_documents")
    .update({ status: "distributed" })
    .eq("batch_id", batchId)
    .eq("school_id", membership.school_id);
  if (documentError) throw documentError;
  const { error: batchError } = await supabase
    .from("billing_batches")
    .update({ status: "distributed", distributed_at: distributedAt })
    .eq("id", batchId)
    .eq("school_id", membership.school_id);
  if (batchError) throw batchError;
  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "billing_batch.distributed",
    entity_type: "billing_batch",
    entity_id: batchId,
    metadata: { document_count: documents.length },
  });
  revalidatePath("/app/direction/billing");
  revalidatePath("/app/family/documents");
  redirect(`/app/direction/billing?batch=${batchId}&success=batch-distributed`);
}

export async function markBillingDocumentViewed(formData: FormData) {
  const documentId = uuid.parse(formData.get("documentId"));
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");
  const { error } = await supabase
    .from("billing_documents")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("status", "distributed");
  if (error) throw error;
  revalidatePath("/app/family/documents");
}

const communicationInput = z.object({
  kind: z.enum(["general", "important", "authorization", "item_request"]),
  scope: z.enum(["school", "classroom", "child"]),
  classroomId: z.union([uuid, z.literal("")]).optional(),
  childId: z.union([uuid, z.literal("")]).optional(),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(2000),
  eventDate: z.union([z.string().date(), z.literal("")]).optional(),
});

export async function createCommunication(formData: FormData) {
  const parsed = communicationInput.parse({
    kind: formData.get("kind"),
    scope: formData.get("scope"),
    classroomId: formData.get("classroomId") ?? "",
    childId: formData.get("childId") ?? "",
    title: formData.get("title"),
    body: formData.get("body"),
    eventDate: formData.get("eventDate") ?? "",
  });
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  let childrenQuery = supabase
    .from("children")
    .select("id, enrollments!inner(classroom_id, status)")
    .eq("school_id", membership.school_id)
    .eq("enrollments.status", "active");
  if (parsed.scope === "classroom") {
    if (!parsed.classroomId) throw new Error("Selecione uma turma.");
    childrenQuery = childrenQuery.eq(
      "enrollments.classroom_id",
      parsed.classroomId,
    );
  }
  if (parsed.scope === "child") {
    if (!parsed.childId) throw new Error("Selecione uma criança.");
    childrenQuery = childrenQuery.eq("id", parsed.childId);
  }
  const { data: targetedChildren, error: childrenError } = await childrenQuery;
  if (childrenError) throw childrenError;
  const childIds = [...new Set((targetedChildren ?? []).map((child) => child.id))];
  if (!childIds.length) throw new Error("Nenhuma criança ativa nesse público.");

  const { data: guardianLinks, error: linksError } = await supabase
    .from("guardian_links")
    .select("child_id, membership_id, school_memberships!inner(role, status)")
    .in("child_id", childIds)
    .eq("active", true)
    .eq("school_memberships.role", "family")
    .eq("school_memberships.status", "active");
  if (linksError) throw linksError;
  if (!guardianLinks?.length) {
    throw new Error("Nenhum responsável ativo vinculado a esse público.");
  }

  const { data: communication, error: communicationError } = await supabase
    .from("communications")
    .insert({
      school_id: membership.school_id,
      created_by: user.id,
      kind: parsed.kind,
      scope: parsed.scope,
      classroom_id:
        parsed.scope === "classroom" ? parsed.classroomId || null : null,
      child_id: parsed.scope === "child" ? parsed.childId || null : null,
      title: parsed.title,
      body: parsed.body,
      event_date: parsed.eventDate || null,
    })
    .select("id")
    .single();
  if (communicationError) throw communicationError;

  const recipients = guardianLinks.map((link) => ({
    school_id: membership.school_id,
    communication_id: communication.id,
    child_id: link.child_id,
    membership_id: link.membership_id,
  }));
  const { error: recipientsError } = await supabase
    .from("communication_recipients")
    .insert(recipients);
  if (recipientsError) {
    await supabase.from("communications").delete().eq("id", communication.id);
    throw recipientsError;
  }
  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: "communication.published",
    entity_type: "communication",
    entity_id: communication.id,
    metadata: { kind: parsed.kind, scope: parsed.scope, recipients: recipients.length },
  });
  revalidatePath("/app/direction/communications");
  revalidatePath("/app/family/communications");
  redirect(
    `/app/direction/communications?communication=${communication.id}&success=communication-created`,
  );
}

export async function respondToCommunication(formData: FormData) {
  const recipientId = uuid.parse(formData.get("recipientId"));
  const requestedResponse = String(formData.get("response") ?? "");
  const { supabase, user, membership } = await getCurrentContext();
  if (membership.role !== "family") redirect("/app");

  const { data: recipient, error } = await supabase
    .from("communication_recipients")
    .select("id, communication_id, communications!inner(kind)")
    .eq("id", recipientId)
    .eq("membership_id", membership.id)
    .single();
  if (error) throw error;
  const related = Array.isArray(recipient.communications)
    ? recipient.communications[0]
    : recipient.communications;
  const kind = related.kind as CommunicationKind;
  const response = requestedResponse as CommunicationResponse;
  if (
    requestedResponse &&
    !allowedCommunicationResponses[kind].includes(response)
  ) {
    throw new Error("Resposta inválida para este comunicado.");
  }
  if (kind !== "general" && !requestedResponse) {
    throw new Error("Selecione uma resposta.");
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("communication_recipients")
    .update({
      viewed_at: now,
      response: requestedResponse || null,
      responded_at: requestedResponse ? now : null,
    })
    .eq("id", recipientId)
    .eq("membership_id", membership.id);
  if (updateError) throw updateError;
  await supabase.from("audit_logs").insert({
    school_id: membership.school_id,
    actor_id: user.id,
    action: requestedResponse
      ? "communication.responded"
      : "communication.viewed",
    entity_type: "communication",
    entity_id: recipient.communication_id,
    metadata: { response: requestedResponse || "viewed" },
  });
  revalidatePath("/app/family/communications");
  revalidatePath("/app/direction/communications");
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
