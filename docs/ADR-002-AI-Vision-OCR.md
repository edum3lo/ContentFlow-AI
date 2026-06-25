# ADR 002: OCR e Extração de Produtos via GPT-4o Vision

**Data:** 25 de Junho de 2026
**Status:** Aceito

## Contexto
O primeiro passo do fluxo do usuário é subir catálogos soltos em formatos diversos (Fotos, PDFs promocionais, Listas de WhatsApp) para o sistema catalogar e criar uma base de dados de Produtos.

## Alternativas Consideradas
1. Tesseract OCR ou Google Cloud Vision: Bons para ler texto, mas exigem algoritmos avançados de NLP locais para tentar deduzir o que é o nome do produto, o que é preço e o que é categoria. Daria muita margem a erros devido à falta de padrão visual dos fornecedores.
2. **GPT-4o (Vision API)**: Usar Inteligência Artificial multimodal que consegue ler a imagem e *compreender* o contexto dos elementos visuais.

## Decisão
Decidimos utilizar a API Multimodal do OpenAI (`gpt-4o`) para a ingestão de dados. Enviamos o arquivo como Base64 (em caso de imagens) junto a um *System Prompt* forte forçando o retorno de um JSON estruturado (`response_format: json_object`).

## Justificativa
A IA consegue discernir a intenção do texto visual. Se há escrito "$ 199 <s>$ 250</s>", ela entende inteligentemente que o preço final é 199. Ela também consegue inferir categorias, nomes de marcas e calcular um "score de confiança" baseando-se em sua certeza. O custo um pouco mais elevado de tokens se paga totalmente na redução drástica de tempo de engenharia em regex e tratamento de strings.

## Consequências
- Os resultados não são determinísticos, o que exigiu a criação de um Módulo Inteiro de CRUD (`/dashboard/products`) para o usuário atuar como "Moderador Humano" aprovando as inferências da IA.
- Limite de tamanho de arquivo. Precisamos garantir que arquivos grandes não excedam os limites de payload da API.
