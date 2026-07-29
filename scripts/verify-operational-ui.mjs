import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.VERIFY_URL ?? "http://localhost:3000";
const password = "LacoValidacao!2026";
const browser = await chromium.launch({ headless: true });
const results = [];
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin =
  serviceRoleKey && supabaseUrl
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

async function cleanupValidationChildren() {
  if (!admin) return;
  const { error } = await admin
    .from("children")
    .delete()
    .in("first_name", ["Validação", "Importada"])
    .eq("school_id", "10000000-0000-4000-8000-000000000001");
  if (error) throw error;
}

async function cleanupValidationClassrooms() {
  if (!admin) return;
  const { error } = await admin
    .from("classrooms")
    .delete()
    .eq("name", "Turma Validação")
    .eq("school_id", "10000000-0000-4000-8000-000000000001");
  if (error) throw error;
}

await cleanupValidationChildren();
await cleanupValidationClassrooms();

async function login(page, email) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar com segurança" }).click();
  await page.waitForURL(/\/app\//);
}

async function journey(name, email, run) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page, email);
  await run(page);
  const overlay = await page
    .locator('[data-nextjs-dialog], #webpack-dev-server-client-overlay')
    .count();
  results.push({ name, errors, overlay, url: page.url() });
  await page.close();
}

await journey("teacher", "professora@laco.validacao", async (page) => {
  await page.getByRole("navigation", { name: "Turma" }).getByText("Berçário II").waitFor();
  await page.getByText("4 crianças previstas").waitFor();
  await page.getByRole("button", { name: "Marcar grupo presente" }).click();
  await page.getByRole("button", { name: "Atualizar chamada" }).waitFor();

  for (const moduleName of ["Alimentação", "Hidratação", "Atividade"]) {
    const moduleForm = page.locator("form").filter({ has: page.getByRole("heading", { name: moduleName }) });
    if (moduleName === "Alimentação") {
      await moduleForm.getByLabel("Exceção de Alimentação para Cecília").selectOption("Comeu pouco");
    }
    await moduleForm.getByRole("button", { name: "Aplicar para o grupo" }).click();
    await moduleForm.getByText("4/4 registrados").waitFor();
  }

  await page.getByPlaceholder(/Bento precisa trocar/).fill("Bento precisa trocar a roupa após o descanso.");
  await page.getByRole("button", { name: "Registrar passagem de turno" }).click();
  await page.getByRole("link", { name: "Tarde" }).click();
  await page.getByText("3 crianças previstas").waitFor();
  await page.getByText("Bento precisa trocar a roupa após o descanso.").waitFor();
  await page.getByRole("button", { name: "Marcar como resolvida" }).click();

  for (const moduleName of ["Alimentação", "Hidratação", "Atividade"]) {
    const moduleForm = page.locator("form").filter({ has: page.getByRole("heading", { name: moduleName }) });
    await moduleForm.getByRole("button", { name: "Aplicar para o grupo" }).click();
    await moduleForm.getByText("3/3 registrados").waitFor();
  }

  await page.getByRole("button", { name: "Publicar agendas" }).click();
  await page.getByText("Dia publicado").waitFor();
});

await journey("family", "familia@laco.validacao", async (page) => {
  await page.getByText("O dia de Alice").waitFor();
  await page.getByRole("button", { name: "Registrar que visualizei" }).click();
  await page.getByRole("button", { name: "Visualização registrada" }).waitFor();
});

await journey("director", "direcao@laco.validacao", async (page) => {
  await page.getByText("O que precisa de atenção.").waitFor();
  await page.getByText("Resumos publicados").waitFor();
  await page.getByText("Visualizações registradas").waitFor();
  await page.getByText("CRM da rotina").waitFor();
  await page.getByText("Jornadas das crianças").waitFor();
  await page.getByRole("link", { name: "Pessoas e turmas" }).click();
  await page.getByText("Estrutura da escola").waitFor();
  await page.getByRole("link", { name: /Berçário II 1 a 2 anos/ }).waitFor();

  const classroomForm = page.locator("form").filter({ hasText: "Nova turma" });
  const createButtonColor = await classroomForm
    .getByRole("button", { name: "Criar turma" })
    .evaluate((element) => getComputedStyle(element).color);
  if (createButtonColor !== "rgb(255, 255, 255)") {
    throw new Error(`create classroom button has insufficient contrast: ${createButtonColor}`);
  }
  await classroomForm.locator('[name="name"]').fill("Turma Validação");
  await classroomForm.locator('[name="ageGroup"]').fill("3 a 4 anos");
  await classroomForm.locator('[name="teacherMembershipId"]').selectOption({ label: "Ana Souza" });
  await classroomForm.getByRole("button", { name: "Criar turma" }).click();
  await page.getByText("Turma criada com sucesso!").waitFor();
  await page.getByRole("link", { name: /Turma Validação 3 a 4 anos/ }).waitFor();

  const enrollmentForm = page.locator("form").filter({ hasText: "Nova matrícula" });
  await enrollmentForm.locator('[name="firstName"]').fill("Validação");
  await enrollmentForm.locator('[name="lastName"]').fill("Automática");
  await enrollmentForm.locator('[name="birthDate"]').fill("2023-05-10");
  await enrollmentForm.getByRole("button", { name: "Cadastrar criança" }).click();
  await page.getByText("Criança cadastrada com sucesso!").waitFor();
  await page.getByText("Validação Automática").waitFor();

  await page.locator('input[type="file"]').setInputFiles({
    name: "validacao.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "nome,sobrenome,nascimento,jornada,entrada,saida\nImportada,Automática,2023-06-11,Manhã,07:30,12:00\n",
      "utf8",
    ),
  });
  await page.getByText("Importada Automática").waitFor();
  await page.getByRole("button", { name: "Confirmar 1 cadastros" }).click();
  await page.getByText("1 crianças importadas com sucesso.").waitFor();
});

for (const result of results) {
  if (result.errors.length > 0 || result.overlay > 0) {
    throw new Error(`${result.name} failed: ${JSON.stringify(result)}`);
  }
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
await cleanupValidationChildren();
await cleanupValidationClassrooms();
