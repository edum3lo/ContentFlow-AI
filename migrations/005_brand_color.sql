-- Cor principal da marca, extraída automaticamente do logo (hex, ex: #d4af37).
-- Usada como cor de destaque nas artes, pra elas seguirem a identidade visual.
-- Como aplicar: Supabase → SQL Editor → cole e rode. Idempotente.

alter table public.profiles add column if not exists brand_color text;
