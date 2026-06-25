# ADR 003: Renderização de Arte Visual (Edge e next/og)

**Data:** 25 de Junho de 2026
**Status:** Aceito

## Contexto
O MVP exige que o usuário, após a IA criar a legenda e o modelo de conteúdo, seja capaz de fazer o download do Post ou Story no formato de imagem (PNG/JPG) com um design finalizado e os dados do produto inseridos.

## Alternativas Consideradas
1. **HTML to Canvas Frontend (`html2canvas`)**: Consiste em desenhar o post no DOM do navegador usando HTML/CSS oculto, e usar bibliotecas JavaScript para capturar um screenshot daquele elemento em canvas e forçar o download.
   - *Contras*: Suporte irregular de CSS (ex: degradês modernos ou flexbox avançado frequentemente quebram). Baixa performance em celulares dependendo da complexidade do DOM.
2. **Bibliotecas de Imagem de Backend (ex: `sharp` ou `puppeteer`)**: Puppeteer subiria um Chrome Headless e tiraria um print.
   - *Contras*: Custos exorbitantes de memória na hospedagem (Vercel não suporta puppeteer adequadamente em serverless padrão sem adaptações complexas). Tempo de geração lento.
3. **`next/og` (ImageResponse)**: Uma tecnologia desenvolvida para gerar tags Open Graph estáticas via Edge Runtime usando o motor Satori que converte React + Tailwind em SVG/PNG incrivelmente rápido.

## Decisão
Decidimos usar a rota de API com **`ImageResponse` (`next/og`)**. Os templates da arte (Moderno, Premium, Minimalista) foram construídos como componentes React com *inline styles* e são renderizados sob demanda pelo servidor Edge assim que a tag `<img src="...">` bate no backend.

## Justificativa
A renderização é instantânea, ocorre nos servidores de borda da Vercel (Edge) economizando processamento do navegador do cliente e gera PNGs perfeitamente cristalinos, com fontes customizadas e degradês precisos suportados pelo ecossistema Satori. É a melhor junção de Performance, Escalabilidade (custo computacional irrisório) e Qualidade Visual.

## Consequências
- A estilização do Satori tem restrições. Ele suporta a maioria dos elementos CSS (`flexbox`, `border-radius`, etc), mas não suporta `CSS Grid` e propriedades muito obscuras, exigindo um leve retrabalho para montar designs com *flex direction*.
- Todas as fontes precisam ser embarcadas ou lidas do Google Fonts manualmente via URL.
