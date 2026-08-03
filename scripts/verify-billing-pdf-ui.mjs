import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const baseUrl = process.env.VERIFY_URL ?? "http://localhost:3000";
const password = "LacoValidacao!2026";
const validationTitle = `Validação PDF ${Date.now()}`;
const fixture = join(tmpdir(), `boleto-alice-moreira-${Date.now()}.pdf`);
await writeFile(fixture, "%PDF-1.4\n% SomaMais validation fixture\n%%EOF\n");

const localEnv = await readFile(join(process.cwd(), ".env.local"), "utf8");
function env(name) {
  const line = localEnv.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line?.slice(name.length + 1).replace(/^['"]|['"]$/g, "");
}
const admin = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const browser = await chromium.launch({ headless: true });

async function login(page, email, destination) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(?:\/|$)/);
  await page.goto(`${baseUrl}${destination}`, { waitUntil: "networkidle" });
}

async function cleanup() {
  const { data: batch } = await admin.from("billing_batches").select("id").eq("title", validationTitle).maybeSingle();
  if (!batch) return;
  const { data: documents } = await admin.from("billing_documents").select("storage_path").eq("batch_id", batch.id);
  const paths = (documents ?? []).map((item) => item.storage_path).filter(Boolean);
  if (paths.length) await admin.storage.from("billing-documents").remove(paths);
  await admin.from("billing_batches").delete().eq("id", batch.id);
}

try {
  const directorContext = await browser.newContext();
  const director = await directorContext.newPage();
  await login(director, "direcao@laco.validacao", "/app/direction/billing");
  await director.getByLabel("Nome do lote").fill(validationTitle);
  await director.locator('input[type="file"]').setInputFiles(fixture);
  await director.getByText("Linha digitável / código de barras").waitFor();
  await director.getByPlaceholder("Cole os 44, 47 ou 48 números").fill("00190500954014481606906809350314337370000000100");
  await director.getByRole("button", { name: "Enviar PDFs e criar lote" }).click();
  await director.waitForURL(/success=batch-created/, { timeout: 30000 });
  await director.getByRole("button", { name: "Distribuir lote às famílias" }).click();
  await director.waitForURL(/success=batch-distributed/, { timeout: 30000 });

  const familyContext = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const family = await familyContext.newPage();
  await login(family, "familia@laco.validacao", "/app/family/documents");
  const card = family.locator("article").filter({ hasText: validationTitle });
  await card.getByRole("button", { name: "Copiar linha digitável" }).click();
  await card.getByText("Copiado").waitFor();
  const downloadLink = card.getByRole("link", { name: "Abrir PDF seguro" });
  const href = await downloadLink.getAttribute("href");
  const pdfResponse = await family.request.get(`${baseUrl}${href}`);
  const contentType = pdfResponse.headers()["content-type"] ?? "";

  if (!pdfResponse.ok() || !["application/pdf", "application/octet-stream"].some((type) => contentType.includes(type))) {
    throw new Error(`O PDF seguro não foi entregue (${pdfResponse.status()} · ${contentType}).`);
  }
  console.log(JSON.stringify({ upload: true, distribution: true, copy: true, securePdf: true }));
} finally {
  await browser.close();
  await cleanup();
  await unlink(fixture).catch(() => undefined);
}
