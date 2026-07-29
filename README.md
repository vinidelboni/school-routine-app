# Laço

Plataforma de rotina e comunicação voltada a escolas particulares de educação
infantil. O repositório contém duas experiências completamente separadas:

- `/demo`: protótipo comercial com estado local e dados fictícios.
- `/app`: primeira área operacional, autenticada e conectada ao banco.

> Menos tempo preenchendo. Mais tempo presente.

## Sprint 0 + 1

- Projeto Supabase exclusivo do Laço, hospedado em São Paulo.
- Migrações versionadas e tipos TypeScript gerados do banco.
- Autenticação individual para direção, professora e família.
- Isolamento por escola, papel, turma e vínculo familiar com PostgreSQL RLS.
- Chamada coletiva, alimentação por exceção e publicação de resumos.
- Visualização individual da família e acompanhamento da direção.
- Auditoria da publicação.
- Testes automatizados de permissão e jornada no navegador.

## O que a demonstração apresenta

- Entrada demonstrativa por três perfis: professora, direção e família.
- Registro coletivo da rotina com ajustes apenas para as exceções.
- Revisão e publicação dos resumos após o horário de saída.
- Resumo individual, simples e narrativo para a família.
- Painel da direção orientado a pendências e ações.
- Leitura assistida de vários boletos em PDF, com validação humana antes da
  distribuição.

Todos os nomes e dados exibidos são fictícios. Embora a área `/app` já tenha
autenticação e isolamento reais, esta fase ainda não deve receber dados reais de
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
npm run typecheck
npm run build
npm run test:ui
```

O teste de interface requer o Chromium do Playwright:

```bash
npx playwright install chromium
```

Os testes operacionais usam somente o projeto Supabase do Laço:

```bash
npx vercel env run --environment development -- node scripts/seed-operational.mjs
npx vercel env run --environment development -- npm run test:rls
npm run test:operational
```

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons
- Supabase Auth, PostgreSQL e Row Level Security
- Zod para validação de ações
- Playwright para verificação dos fluxos

## Próxima fase

Antes de um piloto com dados reais ainda são necessários: convites por e-mail,
recuperação de senha, gestão completa de cadastros, armazenamento seguro,
consentimentos, política de retenção, resposta a incidentes e revisão jurídica.
