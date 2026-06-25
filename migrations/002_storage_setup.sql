-- Configuração do Storage para o upload de catálogos.
-- Como aplicar: Supabase → SQL Editor → cole e rode.
--
-- Cria o bucket "catalogs" (público para que o file_url salvo funcione)
-- e as políticas que permitem cada usuário enviar/ler arquivos na sua própria
-- pasta (o caminho do arquivo começa com o id do usuário: "<user_id>/...").

-- 1) Bucket
insert into storage.buckets (id, name, public)
values ('catalogs', 'catalogs', true)
on conflict (id) do nothing;

-- 2) Upload: usuários autenticados só na própria pasta
create policy "Users can upload own catalogs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'catalogs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Leitura autenticada da própria pasta (o bucket público já permite
--    leitura via URL pública; esta policy cobre acesso autenticado direto)
create policy "Users can read own catalogs"
on storage.objects for select to authenticated
using (
  bucket_id = 'catalogs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) (Opcional) Exclusão da própria pasta
create policy "Users can delete own catalogs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'catalogs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
