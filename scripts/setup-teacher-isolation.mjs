import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase environment variables are required.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCHOOL_ID = "10000000-0000-4000-8000-000000000001";
const PASSWORD = "LacoValidacao!2026";
const teachers = [
  {
    email: "professora@laco.validacao",
    fullName: "Ana Souza",
    classroomName: "Maternal I",
    preferredMembershipId: "40000000-0000-4000-8000-000000000002",
  },
  {
    email: "professora.bercario2@laco.validacao",
    fullName: "Júlia Nunes",
    classroomName: "Berçário II",
    preferredMembershipId: "40000000-0000-4000-8000-000000000004",
  },
];

const { data: classrooms, error: classroomError } = await admin
  .from("classrooms")
  .select("id, name")
  .eq("school_id", SCHOOL_ID);
if (classroomError) throw classroomError;

const classroomByName = new Map(classrooms.map((item) => [item.name, item]));
for (const teacher of teachers) {
  if (!classroomByName.has(teacher.classroomName)) {
    throw new Error(`Classroom not found: ${teacher.classroomName}`);
  }
}

const { data: listed, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw listError;

const prepared = [];
for (const teacher of teachers) {
  let user = listed.users.find((item) => item.email === teacher.email);
  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: teacher.fullName },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: teacher.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: teacher.fullName },
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: teacher.fullName });
  if (profileError) throw profileError;

  const { data: existingMembership, error: membershipReadError } = await admin
    .from("school_memberships")
    .select("id")
    .eq("school_id", SCHOOL_ID)
    .eq("user_id", user.id)
    .eq("role", "teacher")
    .maybeSingle();
  if (membershipReadError) throw membershipReadError;

  let membershipId = existingMembership?.id;
  if (membershipId) {
    const { error } = await admin
      .from("school_memberships")
      .update({ status: "active" })
      .eq("id", membershipId);
    if (error) throw error;
  } else {
    const { data, error } = await admin
      .from("school_memberships")
      .insert({
        id: teacher.preferredMembershipId,
        school_id: SCHOOL_ID,
        user_id: user.id,
        role: "teacher",
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw error;
    membershipId = data.id;
  }

  prepared.push({
    ...teacher,
    userId: user.id,
    membershipId,
    classroomId: classroomByName.get(teacher.classroomName).id,
  });
}

const membershipIds = prepared.map((item) => item.membershipId);
const { error: clearError } = await admin
  .from("classroom_staff")
  .delete()
  .in("membership_id", membershipIds);
if (clearError) throw clearError;

const { error: assignmentError } = await admin.from("classroom_staff").insert(
  prepared.map((item) => ({
    school_id: SCHOOL_ID,
    classroom_id: item.classroomId,
    membership_id: item.membershipId,
  })),
);
if (assignmentError) throw assignmentError;

const probeToken = `Teacher isolation ${new Date().toISOString()}`;
for (const teacher of prepared) {
  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .select("child_id")
    .eq("classroom_id", teacher.classroomId)
    .eq("status", "active")
    .limit(1)
    .single();
  if (enrollmentError) throw enrollmentError;

  const { error: consentError } = await admin.from("image_consents").upsert(
    {
      school_id: SCHOOL_ID,
      child_id: enrollment.child_id,
      status: "authorized",
      notes: "Autorização da demonstração de isolamento",
      recorded_by: teacher.userId,
    },
    { onConflict: "child_id" },
  );
  if (consentError) throw consentError;

  const { error: photoProbeError } = await admin.from("photo_publications").insert({
    school_id: SCHOOL_ID,
    classroom_id: teacher.classroomId,
    storage_path: `${SCHOOL_ID}/${teacher.classroomId}/db-probe-${crypto.randomUUID()}.png`,
    caption: probeToken,
    activity_date: new Date().toISOString().slice(0, 10),
    published_by: teacher.userId,
    media_type: "image",
    mime_type: "image/png",
    file_size_bytes: 68,
  });
  if (photoProbeError) throw photoProbeError;
}

const { error: auditError } = await admin.from("audit_logs").insert({
  school_id: SCHOOL_ID,
  actor_id: null,
  action: "demo.teacher_classroom_isolation_configured",
  entity_type: "classroom_staff",
  entity_id: membershipIds.join(","),
  metadata: Object.fromEntries(
    prepared.map((item) => [item.email, item.classroomName]),
  ),
});
if (auditError) throw auditError;

const verification = [];
for (const teacher of prepared) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: loginError } = await client.auth.signInWithPassword({
    email: teacher.email,
    password: PASSWORD,
  });
  if (loginError) throw loginError;

  const [{ data: assignments, error: assignmentsError }, { data: visibleChildren, error: childrenError }, { data: visibleDays, error: daysError }, { data: visibleConsents, error: consentsError }, { data: visiblePhotoProbes, error: photoProbesError }] = await Promise.all([
    client.from("classroom_staff").select("classroom_id, classrooms(name)"),
    client.from("children").select("id, first_name"),
    client.from("school_days").select("id, classroom_id"),
    client.from("image_consents").select("child_id"),
    client.from("photo_publications").select("id, classroom_id").eq("caption", probeToken),
  ]);
  if (assignmentsError) throw assignmentsError;
  if (childrenError) throw childrenError;
  if (daysError) throw daysError;
  if (consentsError) throw consentsError;
  if (photoProbesError) throw photoProbesError;

  if (assignments.length !== 1 || assignments[0].classroom_id !== teacher.classroomId) {
    throw new Error(`${teacher.email}: unexpected classroom visibility`);
  }
  if (visibleDays.some((day) => day.classroom_id !== teacher.classroomId)) {
    throw new Error(`${teacher.email}: cross-classroom day was visible`);
  }
  const visibleChildIds = new Set(visibleChildren.map((child) => child.id));
  if (visibleConsents.some((consent) => !visibleChildIds.has(consent.child_id))) {
    throw new Error(`${teacher.email}: cross-classroom consent was visible`);
  }
  if (visiblePhotoProbes.length !== 1 || visiblePhotoProbes[0].classroom_id !== teacher.classroomId) {
    throw new Error(`${teacher.email}: unexpected gallery visibility`);
  }

  const other = prepared.find((item) => item.classroomId !== teacher.classroomId);
  const { data: otherClassroom, error: otherClassroomError } = await client
    .from("classrooms")
    .select("id")
    .eq("id", other.classroomId);
  if (otherClassroomError) throw otherClassroomError;
  if (otherClassroom.length !== 0) {
    throw new Error(`${teacher.email}: other classroom was readable`);
  }

  const { data: otherDay, error: otherDayError } = await admin
    .from("school_days")
    .select("id")
    .eq("classroom_id", other.classroomId)
    .limit(1)
    .single();
  if (otherDayError) throw otherDayError;
  const { data: otherEnrollment, error: otherEnrollmentError } = await admin
    .from("enrollments")
    .select("child_id")
    .eq("classroom_id", other.classroomId)
    .eq("status", "active")
    .limit(1)
    .single();
  if (otherEnrollmentError) throw otherEnrollmentError;

  const probePeriod = `isolation-probe-${Date.now()}`;
  const { data: unexpectedWrite, error: forbiddenWriteError } = await client
    .from("routine_entries")
    .insert({
      school_id: SCHOOL_ID,
      school_day_id: otherDay.id,
      child_id: otherEnrollment.child_id,
      category: "note",
      period_key: probePeriod,
      value: { label: "Isolation probe" },
      recorded_by: teacher.userId,
    })
    .select("id")
    .maybeSingle();
  if (!forbiddenWriteError) {
    if (unexpectedWrite?.id) {
      await admin.from("routine_entries").delete().eq("id", unexpectedWrite.id);
    }
    throw new Error(`${teacher.email}: cross-classroom write was accepted`);
  }

  const { data: unexpectedPhoto, error: forbiddenPhotoError } = await client
    .from("photo_publications")
    .insert({
      school_id: SCHOOL_ID,
      classroom_id: other.classroomId,
      storage_path: `${SCHOOL_ID}/${other.classroomId}/forbidden-${crypto.randomUUID()}.png`,
      caption: "Cross-classroom probe",
      activity_date: new Date().toISOString().slice(0, 10),
      published_by: teacher.userId,
      media_type: "image",
      mime_type: "image/png",
      file_size_bytes: 68,
    })
    .select("id")
    .maybeSingle();
  if (!forbiddenPhotoError) {
    if (unexpectedPhoto?.id) {
      await admin.from("photo_publications").delete().eq("id", unexpectedPhoto.id);
    }
    throw new Error(`${teacher.email}: cross-classroom gallery write was accepted`);
  }

  const pngProbe = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
    0, 0, 0, 11, 73, 68, 65, 84, 8, 215, 99, 248, 15, 4, 0, 9, 251,
    3, 253, 160, 208, 138, 37, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
    96, 130,
  ]);
  const ownStoragePath = `${SCHOOL_ID}/${teacher.classroomId}/storage-probe-${crypto.randomUUID()}.png`;
  const { error: ownUploadError } = await client.storage
    .from("school-photos")
    .upload(ownStoragePath, pngProbe, { contentType: "image/png", upsert: false });
  if (ownUploadError) throw ownUploadError;
  const { error: ownDeleteError } = await client.storage
    .from("school-photos")
    .remove([ownStoragePath]);
  if (ownDeleteError) throw ownDeleteError;

  const crossStoragePath = `${SCHOOL_ID}/${other.classroomId}/storage-probe-${crypto.randomUUID()}.png`;
  const { error: forbiddenUploadError } = await client.storage
    .from("school-photos")
    .upload(crossStoragePath, pngProbe, { contentType: "image/png", upsert: false });
  if (!forbiddenUploadError) {
    await admin.storage.from("school-photos").remove([crossStoragePath]);
    throw new Error(`${teacher.email}: cross-classroom storage upload was accepted`);
  }

  verification.push({
    email: teacher.email,
    classroom: teacher.classroomName,
    assignedClassrooms: assignments.length,
    visibleChildren: visibleChildren.length,
    visibleSchoolDays: visibleDays.length,
    otherClassroomHidden: true,
    crossClassroomWriteBlocked: true,
    galleryIsolated: true,
    imageConsentsIsolated: true,
    crossClassroomUploadBlocked: true,
  });
  await client.auth.signOut();
}

const { error: probeCleanupError } = await admin
  .from("photo_publications")
  .delete()
  .eq("caption", probeToken);
if (probeCleanupError) throw probeCleanupError;

console.log(JSON.stringify(verification, null, 2));
