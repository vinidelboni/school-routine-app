import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "LacoValidacao!2026";

if (!url || !anonKey) throw new Error("Supabase variables are required.");

const cases = [
  {
    role: "director",
    email: "direcao@laco.validacao",
    expectedChildren: 4,
    expectedMemberships: 3,
  },
  {
    role: "teacher",
    email: "professora@laco.validacao",
    expectedChildren: 4,
    expectedMemberships: 1,
  },
  {
    role: "family",
    email: "familia@laco.validacao",
    expectedChildren: 1,
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

  const isolatedVisible = children.some(
    (child) => child.first_name === "Criança" && child.school_id.endsWith("0099"),
  );

  const result = {
    role: testCase.role,
    childrenVisible: children.length,
    membershipsVisible: memberships.length,
    isolatedTenantVisible: isolatedVisible,
  };

  if (children.length !== testCase.expectedChildren) {
    throw new Error(`${testCase.role}: unexpected child visibility`);
  }
  if (memberships.length !== testCase.expectedMemberships) {
    throw new Error(`${testCase.role}: unexpected membership visibility`);
  }
  if (isolatedVisible) {
    throw new Error(`${testCase.role}: cross-tenant child was visible`);
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
    result.unauthorizedWriteBlocked = true;
    result.handoffsHidden = true;
  }

  results.push(result);
  await client.auth.signOut();
}

console.log(JSON.stringify(results, null, 2));
