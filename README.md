# Laço

Protótipo funcional de validação para uma plataforma de rotina e comunicação
voltada a escolas particulares de educação infantil.

> Menos tempo preenchendo. Mais tempo presente.

## O que este protótipo demonstra

- Entrada demonstrativa por três perfis: professora, direção e família.
- Registro coletivo da rotina com ajustes apenas para as exceções.
- Revisão e publicação dos resumos após o horário de saída.
- Resumo individual, simples e narrativo para a família.
- Painel da direção orientado a pendências e ações.
- Leitura assistida de vários boletos em PDF, com validação humana antes da
  distribuição.

Todos os nomes e dados exibidos são fictícios. Esta versão não possui
autenticação, banco de dados ou armazenamento e não deve receber dados reais de
crianças.

## Executar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Validação

```bash
npm run lint
npm run build
node scripts/verify-ui.mjs
```

O teste de interface requer o Chromium do Playwright:

```bash
npx playwright install chromium
```

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons
- Playwright para verificação dos fluxos

## Próxima fase

Após validação com escolas, o protótipo deverá evoluir para um MVP operacional
com autenticação, isolamento entre instituições, banco de dados, armazenamento
seguro, auditoria, consentimentos, política de retenção e controles compatíveis
com a LGPD.
