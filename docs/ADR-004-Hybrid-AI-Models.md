# ADR 004: Estratégia Híbrida de Modelos de Inteligência Artificial

**Data:** 25 de Junho de 2026
**Status:** Aceito

## Contexto
O SaaS executa duas tarefas distintas baseadas em Inteligência Artificial Generativa:
1. **Extração de Dados (OCR e Vision)**: Leitura de PDFs desformatados e imagens de tabelas de preço para estruturar os dados em JSON.
2. **Geração de Copywriting**: Escrita de legendas persuasivas, títulos e hashtags para redes sociais com base em dados de produtos previamente higienizados.

Com a preocupação de manter a saúde financeira do projeto (otimização extrema do custo da API da OpenAI) e manter a precisão dos dados, precisávamos definir qual modelo de linguagem (LLM) usar.

## Alternativas Consideradas
1. **Usar `gpt-4o` para tudo**:
   - *Prós*: Qualidade máxima absoluta em todos os fluxos.
   - *Contras*: O custo seria insustentável. Arquivos PDF pesados e imagens base64 consomem dezenas de milhares de tokens, drenando o saldo de créditos muito rápido.
2. **Usar `gpt-4o-mini` para tudo**:
   - *Prós*: Custo drasticamente menor (cerca de 30x mais barato no custo de entrada).
   - *Contras*: O modelo "mini" é excelente para geração de texto, mas tem mais dificuldade em extração OCR de imagens bagunçadas, o que poderia gerar erros em preços de produtos. "Economizar num modelo que erra e te faz refazer é economia falsa."

## Decisão
Decidimos implementar uma **Estratégia Híbrida Configurável**:
- **Para Extração (Qualidade Crítica)**: O padrão é utilizar o modelo maior (`gpt-4o`). Se a IA errar um preço no início do funil, o erro contamina o resto inteiro.
- **Para Copywriting (Qualidade Aceitável)**: O padrão é utilizar o modelo menor (`gpt-4o-mini`), que é infinitamente mais barato e gera excelentes textos em português focados em marketing.

Para implementar isso sem acoplamento rígido ao código, adotamos a injeção via variáveis de ambiente:
```env
OPENAI_EXTRACTION_MODEL=gpt-4o
OPENAI_GENERATION_MODEL=gpt-4o-mini
```
Essas variáveis possuem *fallbacks* (padrões) no código caso não sejam fornecidas.

## Justificativa
A abordagem híbrida ataca o problema exato: não derruba a qualidade onde ela importa (leitura de preços) e economiza massivamente onde não importa tanto (escrever legenda). O uso de variáveis de ambiente flexibiliza a arquitetura, permitindo testes A/B entre modelos no futuro sem a necessidade de re-fazer o *build* ou *deploy* do código, alterando apenas os parâmetros no painel da Vercel.

## Consequências
- Economia garantida de custos mantendo a integridade dos dados extraídos.
- Qualquer alteração de preços na API da OpenAI no futuro nos permite trocar os modelos instantaneamente alterando as variáveis de ambiente.
