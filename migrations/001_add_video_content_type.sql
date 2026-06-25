-- Migração: adiciona o tipo de conteúdo "video" ao enum content_type.
-- Necessário para o Gerador de Vídeos (gancho, roteiro, texto de tela, CTA).
--
-- Como aplicar: abra o Supabase → SQL Editor → cole e rode este comando.
-- Observação: ALTER TYPE ... ADD VALUE não pode rodar dentro de uma transação
-- explícita (BEGIN/COMMIT). No SQL Editor do Supabase, rode sozinho.

ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'video';
