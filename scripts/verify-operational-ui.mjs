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
  await page.getByRole("button", { name: "Marcar turma presente" }).click();
  await page.getByRole("button", { name: "Atualizar chamada" }).waitFor();
  await page.getByLabel("Exceção de Cecília").selectOption("Comeu pouco");
  await page.getByRole("button", { name: "Salvar alimentação" }).click();
  await page.getByRole("button", { name: /Publicar 4 agendas/ }).click();
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
});

for (const result of results) {
  if (result.errors.length > 0 || result.overlay > 0) {
    throw new Error(`${result.name} failed: ${JSON.stringify(result)}`);
  }
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
