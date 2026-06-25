# ADR 001: Escolha do Stack Principal (Next.js 15, Supabase, Shadcn)

**Data:** 25 de Junho de 2026
**Status:** Aceito

## Contexto
Para o ContentFlow AI, necessitávamos de um stack que permitisse desenvolvimento ágil (MVP rápido) de uma aplicação SaaS B2B complexa, com autenticação, banco de dados seguro, chamadas complexas de API e boa experiência de usuário.

## Decisão
Abolimos a arquitetura clássica de SPA (ex: React puro + Node.js Express backend) em favor de uma **arquitetura de servidor integrada**. 
- Adotamos o **Next.js 15 (App Router)** como framework full-stack.
- Adotamos o **Supabase** como Backend as a Service (BaaS).
- Adotamos **Shadcn UI** em vez de bibliotecas de componentes acopladas (como Material UI ou Bootstrap).

## Justificativa
1. **Next.js**: A união do Backend e Frontend no mesmo repositório com Server Components evita o "waterfall" de requisições de dados e melhora drasticamente o tempo de carregamento e o SEO. Server Actions dispensaram a criação de dezenas de rotas de API.
2. **Supabase**: Em vez de configurar um banco PostgreSQL, Prisma/TypeORM, roteador JWT e envio de e-mails do zero, o Supabase fornece tudo em uma suíte unificada. O Row Level Security (RLS) garante que clientes SaaS diferentes nunca acessarão dados de outros usuários.
3. **Shadcn UI**: Permite que tenhamos controle total sobre o CSS e comportamento dos componentes (já que eles são baixados para a pasta `src/components/ui`), além de utilizar os primitivos acessíveis do Radix UI.

## Consequências
- A necessidade de entender estritamente as fronteiras de rede (onde termina o Server Component e começa o Client Component).
- As Server Actions e chamadas ao Supabase exigem cookies, o que nos forçou a configurar corretamente o middleware de autenticação (SSR package do Supabase).
