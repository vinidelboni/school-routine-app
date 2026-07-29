import { chromium } from "playwright";

const baseUrl = process.env.VERIFY_URL ?? "http://localhost:3000";
const password = "LacoValidacao!2026";
const browser = await chromium.launch({ headless: true });
const results = [];

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
});

for (const result of results) {
  if (result.errors.length > 0 || result.overlay > 0) {
    throw new Error(`${result.name} failed: ${JSON.stringify(result)}`);
  }
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
