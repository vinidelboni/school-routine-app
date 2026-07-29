import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const outputDir = "workshots";
const baseUrl = process.env.VERIFY_URL ?? "http://localhost:3000";
await mkdir(outputDir, { recursive: true });

const results = [];

async function verify(name, viewport, roleLabel, journey) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: roleLabel }).click();
  await journey(page);

  const overlay = await page
    .locator(
      '[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay',
    )
    .count();
  const bodyText = await page.locator("body").innerText();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  await page.screenshot({
    path: `${outputDir}/${name}.png`,
    fullPage: true,
  });

  results.push({
    name,
    overlay,
    errors,
    hasContent: bodyText.trim().length > 100,
    horizontalOverflow,
    interactiveElements: await page.locator("button, a, input").count(),
  });
  await page.close();
}

await verify(
  "teacher-tablet",
  { width: 1024, height: 900 },
  "Entrar como professora",
  async (page) => {
    await page.getByRole("button", { name: /Alimentação/ }).click();
    await page.getByRole("button", { name: /Cecília/ }).click();
    await page.getByRole("button", { name: /Concluir ajuste/ }).click();
    await page.getByRole("button", { name: /Revisar registro/ }).click();
    await page.getByRole("button", { name: /Publicar 16 agendas/ }).click();
    await page.getByText("Pronto, Ana.").waitFor();
  },
);

await verify(
  "director-desktop",
  { width: 1440, height: 1000 },
  "Entrar como direção",
  async (page) => {
    await page.getByRole("button", { name: /4 boletos precisam/ }).click();
    await page.getByRole("button", { name: /Confirmar vínculo/ }).click();
    await page.getByRole("button", { name: /Distribuir 4 boletos/ }).click();
    await page.getByText("4 boletos distribuídos").waitFor();
  },
);

await verify(
  "family-mobile",
  { width: 390, height: 844 },
  "Entrar como responsável",
  async (page) => {
    await page.getByRole("button", { name: /Cheguei ao fim/ }).click();
    await page.getByText("Visualização registrada").first().waitFor();
  },
);

console.log(JSON.stringify(results, null, 2));
await browser.close();
