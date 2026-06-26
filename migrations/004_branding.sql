-- Marca do cliente: nome e logotipo que aparecem nas artes geradas.
-- Como aplicar: Supabase → SQL Editor → cole e rode. Idempotente.
--
-- O logo é enviado para o bucket "products" (já existente), na pasta do usuário
-- (<user_id>/brand/...), coberto pelas policies da migration 003.

alter table public.profiles add column if not exists brand_name text;
alter table public.profiles add column if not exists brand_logo_url text;
