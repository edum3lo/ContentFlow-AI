# Arquitetura do ContentFlow AI

## 1. Visão Geral
O ContentFlow AI é um SaaS B2B desenvolvido para automatizar a criação de conteúdo para redes sociais (Instagram, TikTok, WhatsApp). A plataforma foca em resolver a "página em branco" de lojistas e revendedores, transformando tabelas de preço, PDFs e fotos em posts completos (arte, legenda, hashtags e CTA).

## 2. Stack Tecnológico (Tech Stack)
A escolha das tecnologias foi guiada por performance, produtividade e alinhamento com os padrões mais recentes do ecossistema React.

- **Framework Principal**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Shadcn UI (Componentes Radix)
- **Ícones**: Lucide React
- **Banco de Dados & Autenticação**: Supabase (PostgreSQL) com RLS (Row Level Security)
- **Inteligência Artificial**: OpenAI API (`gpt-4o`)
- **Geração de Imagens Dinâmicas**: `next/og` (ImageResponse - Vercel Edge)

## 3. Padrões de Arquitetura

### Server Components vs. Client Components
A aplicação utiliza intensamente a nova arquitetura do Next.js (RSC - React Server Components).
- **Server Components (Padrão)**: Utilizados para buscar dados diretamente do Supabase (`page.tsx`, `layout.tsx`). Isso garante segurança (as chaves não vazam) e envio de menos JavaScript para o navegador.
- **Client Components (`'use client'`)**: Isolados estritamente em componentes interativos que necessitam de estado ou hooks (`useState`, `useTransition`, `onClick`). Ex: `content-generator.tsx`, `products-table.tsx`.

### Mutação de Dados (Server Actions)
A alteração de dados no banco (CRUD) não utiliza rotas de API REST tradicionais (com exceção das rotas de IA). O projeto utiliza **React Server Actions** localizados em arquivos `actions.ts`.
Isso permite que componentes client invoquem funções assíncronas do servidor diretamente, com tipagem forte e validação nativa, atualizando o cache local via `revalidatePath`.

## 4. Estrutura de Diretórios e Arquivos Importantes

O projeto segue a estrutura padrão do App Router:

```text
src/
├── app/                  # Roteamento e páginas da aplicação
│   ├── (auth)/           # Rotas agrupadas: /login, /reset-password
│   ├── api/              # Endpoints HTTP tradicionais (Serverless/Edge)
│   │   ├── catalogs/upload/route.ts  # Recebe arquivos, faz OCR e extrai produtos via GPT-4o
│   │   ├── contents/[id]/art/route.tsx # Gera as imagens .png dinamicamente (next/og)
│   │   └── contents/generate/route.ts  # Consulta a OpenAI para gerar textos
│   ├── dashboard/        # Área logada e protegida
│   │   ├── catalogs/     # Visualização do histórico de uploads
│   │   ├── contents/     # Geração e histórico de posts/stories
│   │   ├── products/     # CRUD e revisão de produtos extraídos
│   │   └── calendar/     # Planejador de publicações
│   ├── layout.tsx        # Layout global e configuração de fontes
│   └── page.tsx          # Landing page institucional
├── components/           # Componentes reutilizáveis
│   ├── dashboard/        # Componentes complexos da área logada (Tabelas, Geradores)
│   ├── layout/           # Sidebar, Header, Navegação
│   └── ui/               # Componentes Shadcn (Botões, Inputs, Badges, etc)
├── lib/                  # Utilitários globais
│   ├── supabase/         # Clientes Supabase (Browser, Server, Middleware)
│   └── utils.ts          # Utilitários de strings (cn)
└── types/                # Tipagens TypeScript (ex: database.ts)
```

## 5. Fluxos de Funcionamento Principais

### A. Fluxo de Autenticação
1. O usuário acessa `/login` e insere credenciais no `LoginForm`.
2. A requisição vai para a Server Action (`login/actions.ts`), que chama o `supabase.auth`.
3. O Supabase grava os cookies de sessão e redireciona para `/dashboard`.
4. Em `/dashboard/layout.tsx`, ocorre a verificação: se o usuário não tiver sessão, ele é barrado (redirect para `/login`), garantindo a segurança de todas as rotas filhas.

### B. Fluxo de Upload de Catálogo & Extração (OCR)
1. O usuário sobe um arquivo em `/dashboard/catalogs`. O `upload-zone.tsx` converte o arquivo para Base64.
2. A rota `api/catalogs/upload/route.ts` recebe os dados.
3. Envia o Buffer para o Supabase Storage.
4. Envia o Base64 da imagem/pdf para a API da OpenAI (`gpt-4o`), que possui capacidade visual nativa.
5. A OpenAI processa a imagem, extrai os produtos em formato JSON (Structured Output).
6. A rota salva o catálogo e faz a inserção em lote (`insert`) dos produtos no Supabase.

### C. Fluxo de Validação de Produtos (CRUD)
1. Os produtos extraídos caem na aba `/dashboard/products` com status `review` e um `confidence_score`.
2. O usuário utiliza a tabela (`products-table.tsx`) para editar campos incorretos inline.
3. Ao salvar ou aprovar, a Server Action em `actions.ts` valida as permissões e atualiza o banco, chamando `revalidatePath` para atualizar a tabela instantaneamente na tela sem Refresh da página.

### D. Fluxo de Geração de Conteúdo
1. Em `/dashboard/contents`, o usuário seleciona 1 ou mais produtos aprovados e escolhe o formato (Post, Story, Carrossel).
2. O `content-generator.tsx` faz um `POST` para `api/contents/generate/route.ts`.
3. A rota constrói o prompt, envia para a OpenAI, que retorna Título, Legenda, Hashtags e Slides da arte no formato JSON.
4. A rota salva o retorno na tabela `generated_contents` e vincula com os produtos (`content_products`).

### E. Geração da Arte Visual (Edge Rendering)
1. Para cada post gerado, o `content-card.tsx` exibe um preview chamando uma URL como `<img src="/api/contents/{id}/art?template=X&format=Y" />`.
2. Esta URL aciona o endpoint `art/route.tsx`.
3. Em vez de retornar um HTML, a rota utiliza `new ImageResponse` (da biblioteca `next/og`).
4. Ele desenha um componente React no lado do servidor em tempo real e devolve a resposta como um arquivo binário `.PNG` estilizado.
