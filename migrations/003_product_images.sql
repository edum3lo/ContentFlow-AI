-- Configuração do Storage para as FOTOS de produto (Fase 2).
-- Cria o bucket "products" (público, para que a image_url salva funcione na arte)
-- e as policies que permitem cada usuário enviar/ler/editar/excluir imagens na
-- sua própria pasta (o caminho começa com o id do usuário: "<user_id>/...").
--
-- Como aplicar: Supabase → SQL Editor → cole e rode.
-- Idempotente: pode rodar quantas vezes quiser (recria as policies sem dar
-- erro de "already exists").

-- 1) Bucket
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2) Upload: usuários autenticados só na própria pasta
drop policy if exists "Users can upload own product images" on storage.objects;
create policy "Users can upload own product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Update: necessário para reenviar/substituir a foto (upsert)
drop policy if exists "Users can update own product images" on storage.objects;
create policy "Users can update own product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Leitura autenticada da própria pasta (o bucket público já permite leitura
--    via URL pública; esta policy cobre acesso autenticado direto)
drop policy if exists "Users can read own product images" on storage.objects;
create policy "Users can read own product images"
on storage.objects for select to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5) Exclusão da própria pasta
drop policy if exists "Users can delete own product images" on storage.objects;
create policy "Users can delete own product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);
