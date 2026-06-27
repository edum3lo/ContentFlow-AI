-- Categoria/pilar do conteúdo (vendas, promocao, educacional, beneficios,
-- prova_social, novidade). Usada pra variar o ângulo do texto e filtrar.
-- Como aplicar: Supabase → SQL Editor → cole e rode. Idempotente.

alter table public.generated_contents add column if not exists category text;
