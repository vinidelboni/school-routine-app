# Arquitetura do Laço

## Limites do projeto

O Laço possui recursos próprios e não compartilha banco, credenciais,
variáveis, projeto Vercel ou armazenamento com outros produtos.

- GitHub: `vinidelboni/school-routine-app`
- Vercel: `school-routine-app`
- Supabase: `Laco School Routine`
- Supabase ref: `dspgrikddsdpsqswohal`

## Ambientes

- Local: `.env.local`, nunca versionado.
- Preview: variáveis do projeto Vercel no ambiente Preview.
- Produção: variáveis do projeto Vercel no ambiente Production.

Variáveis são configuradas somente no nível do projeto, nunca no nível da
equipe.

## Autorização

O banco é multi-instituição. Todas as tabelas operacionais possuem `school_id`.
O isolamento é aplicado por Row Level Security no PostgreSQL.

Papéis:

- `director`: administra a escola e acessa todas as turmas da instituição.
- `teacher`: acessa somente turmas atribuídas.
- `family`: acessa somente crianças com vínculo ativo.

## Dados sensíveis

- O MVP coleta somente os dados necessários ao fluxo aprovado.
- Fotos, medicamentos e documentos financeiros permanecem fora do primeiro
  corte vertical.
- Resumos publicados não são apagados silenciosamente.
- Ações relevantes são registradas em `audit_logs`.
- O uso de dados reais depende de revisão jurídica, termos, política de
  retenção e processo de incidentes.
