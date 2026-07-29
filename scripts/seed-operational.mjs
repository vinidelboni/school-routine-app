import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Supabase environment variables are required.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCHOOL_ID = "10000000-0000-4000-8000-000000000001";
const CLASSROOM_ID = "20000000-0000-4000-8000-000000000001";
const SECOND_CLASSROOM_ID = "20000000-0000-4000-8000-000000000002";
const DAY_ID = "30000000-0000-4000-8000-000000000001";
const SECOND_DAY_ID = "30000000-0000-4000-8000-000000000002";
const PASSWORD = "LacoValidacao!2026";
const ISOLATION_SCHOOL_ID = "10000000-0000-4000-8000-000000000099";

const accounts = [
  {
    email: "direcao@laco.validacao",
    fullName: "Marina Costa",
    role: "director",
    membershipId: "40000000-0000-4000-8000-000000000001",
  },
  {
    email: "professora@laco.validacao",
    fullName: "Ana Souza",
    role: "teacher",
    membershipId: "40000000-0000-4000-8000-000000000002",
  },
  {
    email: "familia@laco.validacao",
    fullName: "Fernanda Moreira",
    role: "family",
    membershipId: "40000000-0000-4000-8000-000000000003",
  },
];

const children = [
  ["50000000-0000-4000-8000-000000000001", "Alice", "Moreira", "Integral"],
  ["50000000-0000-4000-8000-000000000002", "Bento", "Ribeiro", "Integral"],
  ["50000000-0000-4000-8000-000000000003", "Cecília", "Alves", "Manhã"],
  ["50000000-0000-4000-8000-000000000004", "Davi", "Santos", "Integral"],
];

async function getOrCreateUser(account) {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const existing = listed.users.find((user) => user.email === account.email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) throw error;
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: account.fullName },
  });
  if (error) throw error;
  return data.user;
}

const userMap = new Map();
for (const account of accounts) {
  const user = await getOrCreateUser(account);
  userMap.set(account.role, user);
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: account.fullName });
  if (profileError) throw profileError;
}

const { error: schoolError } = await supabase.from("schools").upsert({
  id: SCHOOL_ID,
  name: "Escola Ipê Amarelo",
  slug: "escola-ipe-amarelo",
});
if (schoolError) throw schoolError;

const { error: isolationSchoolError } = await supabase.from("schools").upsert({
  id: ISOLATION_SCHOOL_ID,
  name: "Escola Isolada de Teste",
  slug: "escola-isolada-teste",
});
if (isolationSchoolError) throw isolationSchoolError;

const { error: isolationChildError } = await supabase.from("children").upsert({
  id: "50000000-0000-4000-8000-000000000099",
  school_id: ISOLATION_SCHOOL_ID,
  first_name: "Criança",
  last_name: "Isolada",
  birth_date: "2023-01-01",
});
if (isolationChildError) throw isolationChildError;

for (const account of accounts) {
  const { error } = await supabase.from("school_memberships").upsert({
    id: account.membershipId,
    school_id: SCHOOL_ID,
    user_id: userMap.get(account.role).id,
    role: account.role,
    status: "active",
  });
  if (error) throw error;
}

const { error: classroomError } = await supabase.from("classrooms").upsert({
  id: CLASSROOM_ID,
  school_id: SCHOOL_ID,
  name: "Maternal I",
  age_group: "2 a 3 anos",
  default_start: "07:30",
  default_end: "17:30",
});
if (classroomError) throw classroomError;

const { error: secondClassroomError } = await supabase.from("classrooms").upsert({
  id: SECOND_CLASSROOM_ID,
  school_id: SCHOOL_ID,
  name: "Berçário II",
  age_group: "1 a 2 anos",
  default_start: "07:30",
  default_end: "17:30",
});
if (secondClassroomError) throw secondClassroomError;

const { error: staffError } = await supabase.from("classroom_staff").upsert({
  school_id: SCHOOL_ID,
  classroom_id: CLASSROOM_ID,
  membership_id: accounts.find((account) => account.role === "teacher").membershipId,
});
if (staffError) throw staffError;

const { error: secondStaffError } = await supabase.from("classroom_staff").upsert({
  school_id: SCHOOL_ID,
  classroom_id: SECOND_CLASSROOM_ID,
  membership_id: accounts.find((account) => account.role === "teacher").membershipId,
});
if (secondStaffError) throw secondStaffError;

for (const [index, [id, firstName, lastName, scheduleName]] of children.entries()) {
  const { error: childError } = await supabase.from("children").upsert({
    id,
    school_id: SCHOOL_ID,
    first_name: firstName,
    last_name: lastName,
    birth_date: `2023-0${index + 1}-15`,
  });
  if (childError) throw childError;

  const morningOnly = scheduleName === "Manhã";
  const { error: enrollmentError } = await supabase.from("enrollments").upsert({
    id: `60000000-0000-4000-8000-00000000000${index + 1}`,
    school_id: SCHOOL_ID,
    child_id: id,
    classroom_id: CLASSROOM_ID,
    schedule_name: scheduleName,
    expected_start: "07:30",
    expected_end: morningOnly ? "12:00" : "17:30",
    starts_on: "2026-01-20",
    status: "active",
  });
  if (enrollmentError) throw enrollmentError;
}

const { error: secondChildError } = await supabase.from("children").upsert({
  id: "50000000-0000-4000-8000-000000000005",
  school_id: SCHOOL_ID,
  first_name: "Eva",
  last_name: "Lima",
  birth_date: "2024-02-10",
});
if (secondChildError) throw secondChildError;

const { error: secondEnrollmentError } = await supabase.from("enrollments").upsert({
  id: "60000000-0000-4000-8000-000000000005",
  school_id: SCHOOL_ID,
  child_id: "50000000-0000-4000-8000-000000000005",
  classroom_id: SECOND_CLASSROOM_ID,
  schedule_name: "Integral",
  expected_start: "07:30",
  expected_end: "17:30",
  starts_on: "2026-01-20",
  status: "active",
});
if (secondEnrollmentError) throw secondEnrollmentError;

const { error: guardianError } = await supabase.from("guardian_links").upsert({
  id: "70000000-0000-4000-8000-000000000001",
  school_id: SCHOOL_ID,
  child_id: children[0][0],
  membership_id: accounts.find((account) => account.role === "family").membershipId,
  relationship: "Mãe",
  can_view_routine: true,
  active: true,
});
if (guardianError) throw guardianError;

const routineConfigurations = [
  ["attendance", true, true, []],
  ["meal", true, true, ["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"]],
  ["hydration", true, true, ["Hidratou-se normalmente", "Bebeu pouco", "Recusou água"]],
  ["sleep", true, false, ["Dormiu bem", "Sono curto", "Não dormiu"]],
  ["hygiene", true, false, ["Sem observações", "Evacuou", "Precisou de troca extra"]],
  ["activity", true, true, ["Participou", "Participou com apoio", "Preferiu observar"]],
  ["note", false, false, ["Sem observações"]],
];
const { error: configError } = await supabase
  .from("routine_configurations")
  .upsert(
    [CLASSROOM_ID, SECOND_CLASSROOM_ID].flatMap((classroomId) =>
      routineConfigurations.map(([category, enabled, required, options], index) => ({
        school_id: SCHOOL_ID,
        classroom_id: classroomId,
        category,
        enabled,
        required,
        position: index + 1,
        options,
      })),
    ),
    { onConflict: "classroom_id,category" },
  );
if (configError) throw configError;

const { data: existingSummaries, error: existingSummariesError } = await supabase
  .from("daily_summaries")
  .select("id")
  .eq("school_day_id", DAY_ID);
if (existingSummariesError) throw existingSummariesError;

if (existingSummaries.length > 0) {
  const { error: viewCleanupError } = await supabase
    .from("summary_views")
    .delete()
    .in("summary_id", existingSummaries.map((summary) => summary.id));
  if (viewCleanupError) throw viewCleanupError;
}

for (const table of ["shift_handoffs", "daily_summaries", "routine_entries", "attendance_records"]) {
  const { error } = await supabase.from(table).delete().eq("school_day_id", DAY_ID);
  if (error) throw error;
}

const { error: dayError } = await supabase.from("school_days").upsert({
  id: DAY_ID,
  school_id: SCHOOL_ID,
  classroom_id: CLASSROOM_ID,
  day: "2026-07-29",
  status: "draft",
  published_at: null,
  published_by: null,
});
if (dayError) throw dayError;

for (const table of ["shift_handoffs", "daily_summaries", "routine_entries", "attendance_records"]) {
  const { error } = await supabase.from(table).delete().eq("school_day_id", SECOND_DAY_ID);
  if (error) throw error;
}

const { error: secondDayError } = await supabase.from("school_days").upsert({
  id: SECOND_DAY_ID,
  school_id: SCHOOL_ID,
  classroom_id: SECOND_CLASSROOM_ID,
  day: "2026-07-29",
  status: "draft",
  published_at: null,
  published_by: null,
});
if (secondDayError) throw secondDayError;

console.log("Operational validation data is ready.");
console.log(
  accounts.map(({ email, role }) => `${role}: ${email}`).join("\n"),
);
