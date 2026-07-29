import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "LacoValidacao!2026";

if (!url || !anonKey) throw new Error("Supabase variables are required.");

const cases = [
  {
    role: "director",
    email: "direcao@laco.validacao",
    minimumChildren: 5,
    expectedMemberships: 3,
  },
  {
    role: "teacher",
    email: "professora@laco.validacao",
    minimumChildren: 5,
    expectedMemberships: 1,
  },
  {
    role: "family",
    email: "familia@laco.validacao",
    minimumChildren: 1,
    exactChildren: 1,
    expectedMemberships: 1,
  },
];

const results = [];

for (const testCase of cases) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: loginError } = await client.auth.signInWithPassword({
    email: testCase.email,
    password,
  });
  if (loginError) throw loginError;

  const { data: children, error: childrenError } = await client
    .from("children")
    .select("id, first_name, school_id");
  if (childrenError) throw childrenError;

  const { data: memberships, error: membershipsError } = await client
    .from("school_memberships")
    .select("id, role, school_id");
  if (membershipsError) throw membershipsError;

  const { data: familyContacts, error: familyContactsError } = await client
    .from("family_contacts")
    .select("id, school_id");
  if (familyContactsError) throw familyContactsError;

  const { data: familyRequests, error: familyRequestsError } = await client
    .from("family_requests")
    .select("id, created_by");
  if (familyRequestsError) throw familyRequestsError;

  const { data: medicationRequests, error: medicationRequestsError } =
    await client.from("medication_requests").select("id, created_by");
  if (medicationRequestsError) throw medicationRequestsError;

  const isolatedVisible = children.some(
    (child) => child.first_name === "Criança" && child.school_id.endsWith("0099"),
  );

  const result = {
    role: testCase.role,
    childrenVisible: children.length,
    membershipsVisible: memberships.length,
    familyContactsVisible: familyContacts.length,
    familyRequestsVisible: familyRequests.length,
    medicationRequestsVisible: medicationRequests.length,
    isolatedTenantVisible: isolatedVisible,
  };

  if (
    children.length < testCase.minimumChildren ||
    (testCase.exactChildren && children.length !== testCase.exactChildren)
  ) {
    throw new Error(`${testCase.role}: unexpected child visibility`);
  }
  if (memberships.length !== testCase.expectedMemberships) {
    throw new Error(`${testCase.role}: unexpected membership visibility`);
  }
  if (isolatedVisible) {
    throw new Error(`${testCase.role}: cross-tenant child was visible`);
  }
  if (
    (testCase.role === "director" && familyContacts.length < 1) ||
    (testCase.role !== "director" && familyContacts.length !== 0)
  ) {
    throw new Error(`${testCase.role}: unexpected family contact visibility`);
  }
  if (testCase.role === "teacher" && familyRequests.length !== 0) {
    throw new Error("teacher: family requests were visible");
  }
  if (testCase.role === "teacher" && medicationRequests.length !== 0) {
    throw new Error("teacher: medication requests were visible");
  }

  if (testCase.role === "family") {
    const { data: handoffs, error: handoffReadError } = await client
      .from("shift_handoffs")
      .select("id");
    if (handoffReadError) throw handoffReadError;
    if (handoffs.length !== 0) {
      throw new Error("family: shift handoffs were visible");
    }

    const currentUser = (await client.auth.getUser()).data.user;
    const { error: forbiddenWriteError } = await client
      .from("routine_entries")
      .insert({
        school_id: memberships[0].school_id,
        school_day_id: "30000000-0000-4000-8000-000000000001",
        child_id: children[0].id,
        category: "meal",
        period_key: "unauthorized-test",
        value: { label: "Não deveria ser aceito" },
        recorded_by: currentUser.id,
      });
    if (!forbiddenWriteError) {
      throw new Error("family: unauthorized routine write was accepted");
    }
    const { error: forbiddenHandoffError } = await client
      .from("shift_handoffs")
      .insert({
        school_id: memberships[0].school_id,
        school_day_id: "30000000-0000-4000-8000-000000000001",
        classroom_id: "20000000-0000-4000-8000-000000000001",
        from_shift: "morning",
        to_shift: "afternoon",
        note: "Tentativa não autorizada",
        created_by: currentUser.id,
      });
    if (!forbiddenHandoffError) {
      throw new Error("family: unauthorized handoff write was accepted");
    }
    const { error: forbiddenContactError } = await client
      .from("family_contacts")
      .insert({
        school_id: memberships[0].school_id,
        full_name: "Contato não autorizado",
        phone: "(11) 90000-0000",
      });
    if (!forbiddenContactError) {
      throw new Error("family: unauthorized family contact write was accepted");
    }
    const { error: forbiddenRequestError } = await client
      .from("family_requests")
      .insert({
        school_id: memberships[0].school_id,
        child_id: "50000000-0000-4000-8000-000000000099",
        created_by: currentUser.id,
        request_type: "absence",
        effective_date: "2026-07-30",
        details: { reason: "Tentativa não autorizada" },
      });
    if (!forbiddenRequestError) {
      throw new Error("family: cross-tenant request write was accepted");
    }
    const { error: forbiddenMedicationError } = await client
      .from("medication_requests")
      .insert({
        school_id: memberships[0].school_id,
        child_id: "50000000-0000-4000-8000-000000000099",
        created_by: currentUser.id,
        medication_name: "Inválido",
        dosage: "5 gotas",
        scheduled_time: "14:00",
        starts_on: "2026-07-29",
        ends_on: "2026-07-29",
        instructions: "Não deveria ser aceito",
        authorization_reference: "Inválida",
      });
    if (!forbiddenMedicationError) {
      throw new Error("family: cross-tenant medication write was accepted");
    }
    result.unauthorizedWriteBlocked = true;
    result.handoffsHidden = true;
  }

  results.push(result);
  await client.auth.signOut();
}

console.log(JSON.stringify(results, null, 2));
