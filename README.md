# ContentFlow AI

**Transforme catálogos em conteúdo pronto para redes sociais com Inteligência Artificial.**

Plataforma SaaS que recebe catálogos (PDF), listas de preços ou fotos de produtos e,
usando OCR + IA, extrai os produtos e gera posts, stories, carrosséis, roteiros de vídeo,
legendas e hashtags prontos para publicar no Instagram, TikTok, Facebook e WhatsApp.

> Projeto de portfólio que demonstra Front-end, Back-end, Banco de Dados, Upload de
> arquivos, OCR, IA, SaaS, CRUD, Dashboard e UX/UI.

---

## ✨ Funcionalidades

- **Autenticação** — cadastro, login e **recuperação de senha** (Supabase Auth)
- **Upload + extração por IA** — PDF (texto) e imagens (Vision), via OpenAI `gpt-4o`
- **Banco de produtos** — CRUD completo com **validação**: editar, aprovar, rejeitar,
  reabrir, excluir e aprovar em massa
- **Gerador de conteúdo** — Post, Story, Carrossel e **Vídeo** (gancho, roteiro, texto
  de tela e CTA). Só produtos **aprovados** entram na geração
- **Exportação de arte** — gera a imagem (PNG) do post/story em 4 templates
  (Premium, Minimalista, Moderno, Corporativo) usando `next/og`
- **Calendário de conteúdo** — plano de 7/15/30/60 dias com temas e horários sugeridos
- **Dashboard** — métricas e atividade recente

---

## 🧱 Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn / @base-ui**
- **Supabase** — Auth, PostgreSQL e Storage
- **OpenAI API** — extração (Vision) e geração de conteúdo
- **next/og** — geração das artes em imagem
- Deploy: **Vercel**

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js 20+
- Conta no [Supabase](https://supabase.com) e chave da [OpenAI](https://platform.openai.com)

### Passos

1. **Instale as dependências**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   Preencha `.env.local` com os valores do seu projeto (veja a seção abaixo).

3. **Configure o Supabase** (banco, storage e auth) — ver [Configuração do Supabase](#-configuração-do-supabase).

4. **Rode o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

---

## 🔑 Variáveis de ambiente

| Variável | Onde encontrar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `OPENAI_EXTRACTION_MODEL` *(opcional)* | Modelo da extração OCR/Vision. Padrão: `gpt-4o` (qualidade) |
| `OPENAI_GENERATION_MODEL` *(opcional)* | Modelo da geração de texto. Padrão: `gpt-4o-mini` (custo) |

---

## 🗄️ Configuração do Supabase

Execute na ordem, no **SQL Editor** do Supabase:

1. **Schema principal** — cole o conteúdo de [`schema.sql`](./schema.sql).
   Cria tabelas (`profiles`, `catalogs`, `products`, `generated_contents`,
   `content_products`), enums, RLS e o trigger que cria o profile no cadastro.

2. **Migração do tipo "video"** — rode [`migrations/001_add_video_content_type.sql`](./migrations/001_add_video_content_type.sql).
   Necessário para o gerador de vídeos.

3. **Storage** — rode [`migrations/002_storage_setup.sql`](./migrations/002_storage_setup.sql).
   Cria o bucket `catalogs` (público) e as políticas de upload/leitura por usuário.

4. **Redirect URLs do Auth** — em **Authentication → URL Configuration**, adicione em
   *Redirect URLs*:
   - `http://localhost:3000/**`
   - `https://SEU-DOMINIO.vercel.app/**` (após o deploy)

   Sem isso, o link de **recuperação de senha** enviado por email não redireciona.

> Dica: a confirmação de email pode ser desativada em **Authentication → Providers → Email**
> durante o desenvolvimento, para testar o cadastro mais rápido.

---

## ☁️ Deploy na Vercel — checklist

- [ ] Repositório no GitHub
- [ ] Importar o projeto na [Vercel](https://vercel.com/new) (framework Next.js é detectado)
- [ ] Adicionar as 3 variáveis de ambiente em **Settings → Environment Variables**:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `OPENAI_API_KEY`
- [ ] No Supabase, garantir que rodou: `schema.sql`, `migrations/001`, `migrations/002`
- [ ] No Supabase → Auth → URL Configuration, adicionar a **Redirect URL** do domínio da Vercel
- [ ] Fazer o **Deploy**
- [ ] Testar o fluxo completo: cadastro → upload de catálogo → revisar/aprovar produtos →
      gerar conteúdo → baixar arte → recuperar senha

### Observações
- O processamento do upload (OCR + IA) roda de forma **síncrona** na request. PDFs muito
  grandes podem se aproximar do tempo limite de função da Vercel — para produção em escala,
  o próximo passo é mover para processamento em background.
- O build falha em qualquer erro de TypeScript/ESLint (não estão ignorados). Para validar
  sem buildar:
  ```bash
  npx tsc --noEmit
  npx eslint src --ext .ts,.tsx
  ```

---

## 🏗️ Arquitetura

App **Next.js (App Router)** full-stack: o front (React Server/Client Components)
e o back (Route Handlers + Server Actions) vivem no mesmo projeto. O estado
persiste no **Supabase** (PostgreSQL + Auth + Storage) e a inteligência vem da
**OpenAI**.

### Fluxo principal (do catálogo ao post)

```
1. Upload         2. Extração (IA)        3. Validação        4. Geração (IA)      5. Exportação
┌──────────┐      ┌────────────────┐      ┌──────────────┐    ┌────────────────┐   ┌──────────────┐
│ Usuário  │      │ /api/catalogs/ │      │ /dashboard/  │    │ /api/contents/ │   │ /api/.../art │
│ envia PDF│ ───► │ upload         │ ───► │ products     │──► │ generate       │─► │ (next/og)    │
│ ou foto  │      │ • Storage      │      │ revisa e     │    │ post/story/    │   │ PNG p/ baixar│
└──────────┘      │ • OCR/Vision   │      │ APROVA       │    │ carrossel/vídeo│   └──────────────┘
                  │ • salva produ*│       └──────────────┘    └────────────────┘
                  └────────────────┘
        * produtos entram como "review"; só os "approved" seguem para a geração.
```

### Camadas

- **Apresentação** — `app/` (páginas) e `components/` (UI). Server Components
  buscam dados; Client Components cuidam de interação (upload, gerador, tabela).
- **Aplicação** — Route Handlers (`app/api/*`) para operações pesadas/externas
  (IA, imagem) e Server Actions (`*/actions.ts`) para mutações simples (CRUD,
  auth) com `revalidatePath`.
- **Domínio (lógica pura e testável)** — `src/lib/*` (validação de upload,
  sanitização de redirect, roteiro de vídeo, plano de calendário). Sem
  dependência de React/Next/Supabase → fácil de testar isoladamente.
- **Dados** — Supabase. Tipos em `src/types/database.ts`.

### Modelo de segurança

A autorização é feita no **banco**, via **Row Level Security (RLS)**: toda tabela
tem políticas `auth.uid() = user_id`. Por isso, mesmo rotas que buscam por `id`
sem filtrar o usuário (ex.: a geração de arte) são seguras — o RLS devolve `null`
para dados de outro usuário. As rotas/actions ainda checam a sessão (`getUser()`)
como segunda camada. Segredos (`OPENAI_API_KEY`) ficam só no servidor.

### Dois "pipelines" de IA (modelos separados por tarefa)

- **Extração** (OCR/Vision): precisão é crítica → modelo forte por padrão
  (`OPENAI_EXTRACTION_MODEL`, default `gpt-4o`).
- **Geração de texto**: mais tolerante → modelo barato por padrão
  (`OPENAI_GENERATION_MODEL`, default `gpt-4o-mini`).

---

## 🧪 Testes

A lógica pura de `src/lib` é coberta por testes usando o **test runner nativo do
Node** (`node:test`) — **sem dependências extras**. Os testes em TypeScript são
compilados pelo `tsc` e executados pelo Node:

```bash
npm test        # compila tsconfig.test.json e roda os testes
npm run typecheck  # checagem de tipos sem build
npm run lint       # ESLint
```

Cada push/PR roda **lint + typecheck + testes + build** automaticamente via
GitHub Actions (`.github/workflows/ci.yml`).

---

## 📂 Estrutura

```
src/
  app/
    page.tsx                    # Landing page
    login/ forgot-password/ reset-password/   # Autenticação
    auth/callback/              # Troca de código por sessão (Supabase)
    dashboard/                  # Área logada (dashboard, catalogs, products, contents, calendar)
    api/
      catalogs/upload/          # Upload + OCR/IA
      contents/generate/        # Geração de conteúdo (IA)
      contents/[id]/art/        # Geração da arte em PNG (next/og)
  components/
    dashboard/                  # Upload, gerador, tabela de produtos, calendário, cards
    layout/                     # Sidebar e header
    ui/                         # Componentes base (shadcn / base-ui)
  lib/                          # Lógica pura testável (validação, calendário, etc.)
  lib/supabase/                 # Clients server/browser
  types/database.ts             # Tipos do banco
tests/                          # Testes (node:test) da lógica de src/lib
.github/workflows/ci.yml        # CI: lint + typecheck + testes + build
schema.sql                      # Schema inicial
migrations/                     # Migrações incrementais
tsconfig.test.json              # Config de compilação dos testes
```

---

## 🛣️ Roadmap

- [ ] Processamento de upload em background (fila) + status em tempo real
- [ ] Upload em lote de múltiplas fotos
- [ ] Exportação em JPG (hoje: PNG)
- [ ] Agendamento real das postagens (integração com o calendário)
- [ ] Mais públicos: clínicas, academias, farmácias, restaurantes
