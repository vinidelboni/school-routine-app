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

async function cleanupValidationContacts() {
  if (!admin) return;
  const { error } = await admin
    .from("family_contacts")
    .delete()
    .in("full_name", ["Responsável Validação", "Retirada Validação"])
    .eq("school_id", "10000000-0000-4000-8000-000000000001");
  if (error) throw error;
}

await cleanupValidationChildren();
await cleanupValidationClassrooms();
await cleanupValidationContacts();

async function login(page, email) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar com segurança" }).click();
  await page.waitForURL(/\/app(?:\/|$)/);
  if (new URL(page.url()).pathname === "/app") {
    const destination = email.startsWith("direcao")
      ? "/app/direction"
      : email.startsWith("professora")
        ? "/app/teacher"
        : "/app/family";
    await page.goto(`${baseUrl}${destination}`, { waitUntil: "networkidle" });
  }
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

  await page.getByRole("link", { name: "Avisos à escola" }).click();
  await page.getByText("Avisos à escola", { exact: true }).waitFor();
  const requestForm = page.locator("form").filter({ hasText: "Informar a escola" });
  await requestForm.locator('[name="detailPrimary"]').fill("Consulta médica");
  await requestForm.locator('[name="detailSecondary"]').fill("Retorna amanhã");
  await requestForm.getByRole("button", { name: "Enviar aviso à direção" }).click();
  await page.getByText("Aviso enviado para a direção!").waitFor();
  await page.locator("article").filter({ hasText: "Faltará" }).waitFor();

  const extendedForm = page.locator("form").filter({ hasText: "Informar a escola" });
  await extendedForm
    .locator('[name="requestType"]')
    .selectOption("extended_period");
  await extendedForm.locator('[name="detailPrimary"]').fill("18:30");
  await extendedForm
    .locator('[name="detailSecondary"]')
    .fill("Compromisso profissional");
  await extendedForm.getByRole("button", { name: "Enviar aviso à direção" }).click();
  await page
    .locator("article")
    .filter({ hasText: "Período integral excepcional" })
    .waitFor();

  await page.getByRole("link", { name: "Medicamentos" }).click();
  await page.getByText("Solicitar administração").waitFor();
  const medicationForm = page
    .locator("form")
    .filter({ hasText: "Enviar solicitação" });
  await medicationForm.locator('[name="medicationName"]').fill("Medicamento teste");
  await medicationForm.locator('[name="dosage"]').fill("5 gotas");
  await medicationForm.locator('[name="scheduledTime"]').fill("14:00");
  await medicationForm
    .locator('[name="instructions"]')
    .fill("Administrar após o almoço");
  await medicationForm
    .locator('[name="authorizationReference"]')
    .fill("Receita entregue na secretaria");
  await medicationForm.locator('[name="policyConfirmed"]').check();
  await medicationForm.getByRole("button", { name: "Enviar solicitação" }).click();
  await page.getByText("Solicitação enviada para análise da direção!").waitFor();
  await page.getByText("Aguardando análise").first().waitFor();
});

await journey("director", "direcao@laco.validacao", async (page) => {
  await page.getByText("O que precisa de atenção.").waitFor();
  await page.getByText("Resumos publicados").waitFor();
  await page.getByText("Visualizações registradas").waitFor();
  await page.getByText("CRM da rotina").waitFor();
  await page.getByText("Jornadas das crianças").waitFor();
  await page.getByRole("link", { name: "Pessoas e turmas" }).click();
  await page.getByText("Estrutura da escola").waitFor();
  await page.getByRole("button", { name: /Berçário II 1 a 2 anos/ }).waitFor();

  await page.evaluate(() => {
    window.__lacoClassroomSelectionMarker = "preserved";
  });
  await page.getByRole("button", { name: /Maternal I 2 a 3 anos/ }).click();
  await page.getByText("Nova matrícula · Maternal I").waitFor();
  const selectionMarker = await page.evaluate(
    () => window.__lacoClassroomSelectionMarker,
  );
  if (selectionMarker !== "preserved") {
    throw new Error("classroom selection reloaded the document");
  }
  if (!page.url().includes("classroom=")) {
    throw new Error("classroom selection did not update the shareable URL");
  }

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
  await page.getByRole("button", { name: /Turma Validação 3 a 4 anos/ }).waitFor();

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

  await page.getByRole("link", { name: "Famílias e acessos" }).click();
  await page.getByText("Quem pode acessar cada criança").waitFor();
  await page.getByRole("heading", { name: "Fernanda Moreira" }).waitFor();

  const contactForm = page.locator("form").filter({ hasText: "Cadastrar contato" });
  await contactForm.getByText("Alice Moreira").click();
  await contactForm.getByText("Eva Lima").click();
  await contactForm.locator('[name="fullName"]').fill("Responsável Validação");
  await contactForm.locator('[name="relationship"]').fill("Pai");
  await contactForm.locator('[name="email"]').fill("responsavel@laco.validacao");
  await contactForm.locator('[name="phone"]').fill("(11) 99999-2020");
  await contactForm.locator('[name="sendInvite"]').check();
  await contactForm.getByRole("button", { name: "Cadastrar e vincular" }).click();
  await page.getByText("Contato cadastrado e vinculado!").waitFor();
  await page.getByText("Convite pendente").first().waitFor();
  await page.getByText("2 criança(s)").waitFor();
  await page.getByRole("button", { name: "Simular ativação" }).click();
  await page.getByText("Situação do acesso atualizada!").waitFor();
  await page.getByText("Acesso ativado").first().waitFor();
  await page.getByRole("button", { name: "Suspender acesso" }).click();
  await page.getByText("Acesso suspenso").first().waitFor();

  const pickupForm = page.locator("form").filter({ hasText: "Cadastrar contato" });
  await pickupForm.getByText("Bento Ribeiro").click();
  await pickupForm.locator('[name="fullName"]').fill("Retirada Validação");
  await pickupForm.locator('[name="relationship"]').fill("Tia");
  await pickupForm.locator('[name="phone"]').fill("(11) 98888-3030");
  await pickupForm.locator('[name="kind"]').selectOption("pickup_only");
  await pickupForm.getByText("não terá acesso ao aplicativo").waitFor();
  await pickupForm.getByRole("button", { name: "Cadastrar e vincular" }).click();
  await page.getByText("Contato cadastrado e vinculado!").waitFor();
  await page
    .getByText("Este contato não possui nem receberá acesso ao aplicativo.")
    .waitFor();

  await page.getByRole("link", { name: "Avisos e solicitações" }).click();
  await page.getByText("Avisos e solicitações", { exact: true }).waitFor();
  const absenceCard = page.locator("article").filter({ hasText: "Faltará" });
  await absenceCard
    .getByRole("button", { name: "Confirmar recebimento" })
    .click();
  await page.getByText("Solicitação atualizada!").waitFor();
  const extendedCard = page
    .locator("article")
    .filter({ hasText: "Período integral excepcional" });
  await extendedCard
    .getByRole("button", { name: "Aprovar solicitação" })
    .click();
  await page.getByText("Aprovado").waitFor();

  await page.getByRole("link", { name: "Medicamentos" }).click();
  await page.getByText("Medicamentos", { exact: true }).waitFor();
  const medicationCard = page
    .locator("article")
    .filter({ hasText: "Medicamento teste" });
  await medicationCard
    .getByRole("button", { name: "Aceitar solicitação" })
    .click();
  await page.getByText("Aceitos e aguardando registro").waitFor();
  const acceptedMedicationCard = page
    .locator("article")
    .filter({ hasText: "Medicamento teste" });
  await acceptedMedicationCard.locator('[name="note"]').fill("Sem intercorrências");
  await acceptedMedicationCard.getByRole("button", { name: "Registrar" }).click();
  await page.getByText("Administração registrada!").waitFor();
  await page.getByText("Administrado · Sem intercorrências").waitFor();
});

await journey("family-request-status", "familia@laco.validacao", async (page) => {
  await page.getByRole("link", { name: "Avisos à escola" }).click();
  await page.getByText("Recebido pela escola").waitFor();
  await page.getByText("Aprovado").waitFor();
  await page.getByRole("link", { name: "Medicamentos" }).click();
  await page.getByText("Administração confirmada pela escola").waitFor();
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
await cleanupValidationContacts();
