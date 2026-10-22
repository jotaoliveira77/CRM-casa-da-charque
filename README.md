# CRM Casa da Charque

Sistema web de gestão do relacionamento com clientes (CRM) para a **Casa da Charque**, distribuidora de charque e carnes salgadas na CEASA de Recife-PE.

Projeto de Intervenção da disciplina **Atividades Práticas Interdisciplinares de Extensão II**, do curso de Ciência da Computação da UNINASSAU, campus Graças, Grupo 10, turma 8NB, 2026.

> **Versão atual: v1 (protótipo funcional, só front-end).** Os dados ficam salvos no navegador. Ver [Limitações da v1](#limitações-da-v1).

## Funcionalidades

### Painel comercial
- Vendas do período (este mês, mês passado, últimos 90 dias, este ano)
- Ticket médio e taxa de conversão (vendas ganhas ÷ oportunidades encerradas)
- Propostas abertas e propostas aguardando retorno
- Clientes novos × recorrentes
- Produtos mais vendidos, em kg e em R$
- Meta comercial do mês, com quanto falta vender por dia, e gráfico dos últimos 6 meses
- Próximas ações por prazo, com as atrasadas em destaque
- Oportunidades de recompra: clientes sem compra há mais de 30 dias. Um clique cria uma oportunidade que repete o último pedido.

### Funil de vendas
- Quadro com 8 etapas: Novo contato → Qualificação → Necessidade identificada → Proposta enviada → Negociação → Aguardando decisão → Venda fechada / Venda perdida
- Os cartões são arrastados entre as etapas
- Cada oportunidade guarda cliente, produtos (kg × R$/kg), valor estimado (calculado), responsável, prazo, origem, próxima ação e motivo da perda
- Filtro por vendedor e busca por cliente

### Clientes
- Cadastro com nome/razão social, CPF/CNPJ, telefone, WhatsApp, e-mail, cidade/UF, tipo (varejo, atacado, restaurante, distribuidor, mercadinho, feirante), responsável comercial e observações
- Busca e filtros por tipo e por situação (Prospecto, Novo, Recorrente, Inativo)
- Ficha do cliente com total comprado, ticket médio, última compra, oportunidades em aberto, histórico de compras e registro de contatos (ligação, WhatsApp, visita, e-mail, balcão)

### Ajustes
- Meta de vendas mensal
- Lista de vendedores
- Catálogo de produtos com preço por kg
- Cópia de segurança: exportar e restaurar os dados em JSON
- Apagar os dados de exemplo para começar do zero

## Como executar

Não há nada para instalar. Abra o arquivo no navegador:

```
crm-casa-da-charque.html
```

Para servir por HTTP (opcional, útil para testar no celular na mesma rede):

```bash
python -m http.server 8765
```

Depois acesse `http://localhost:8765/crm-casa-da-charque.html`.

Na primeira abertura, o sistema carrega **dados de exemplo fictícios**: 14 clientes, cerca de 50 vendas nos últimos 6 meses e 12 oportunidades em andamento. Para usar com dados reais, vá em **Ajustes → Apagar dados e começar do zero**.

## Tecnologias

- HTML, CSS e JavaScript puro (sem frameworks nem build)
- Persistência em `localStorage`
- Gráficos desenhados em SVG
- Fontes do Google Fonts (Bricolage Grotesque, Public Sans, IBM Plex Mono)
- Tema claro e escuro automático, layout responsivo para celular

## Estrutura do código

Todo o sistema está em um único arquivo, `crm-casa-da-charque.html`, dividido em blocos:

| Bloco | O que faz |
| --- | --- |
| `<style>` | Tokens de cor e tipografia (`:root`), tema escuro e estilos das telas |
| Constantes | Etapas do funil, tipos de cliente, origens e canais de contato |
| Armazenamento | `carregar()` e `salvar()` no `localStorage` (chave `crm-casa-da-charque-v1`) |
| Dados de exemplo | `gerarExemplo()`, que gera dados com gerador pseudoaleatório fixo, sempre iguais |
| Cálculos | Vendas por período, situação do cliente, último contato |
| Visões | `viewPainel()`, `viewFunil()`, `viewClientes()`, `viewAjustes()` |
| Diálogos | Formulários de oportunidade e de cliente, e a ficha do cliente |
| Eventos | Cliques, formulários e arrastar-e-soltar, por delegação de eventos |

A navegação usa a âncora da URL: `#painel`, `#funil`, `#clientes`, `#ajustes`.

## Modelo de dados

```js
{
  clientes: [{ id, nome, doc, tel, whatsapp, email, cidade, uf, tipo, responsavel, obs, criadoEm }],
  oportunidades: [{
    id, clienteId, titulo, etapa, responsavel, origem, prazo, proximaAcao,
    itens: [{ produtoId, kg, precoKg }],
    criadoEm, fechadoEm, motivoPerda, obs
  }],
  interacoes: [{ id, clienteId, data, canal, nota, responsavel }],
  config: { metaMensal, responsaveis: [], produtos: [{ id, nome, precoKg }] }
}
```

- Uma **venda** é uma oportunidade na etapa `ganha`. A data da venda é `fechadoEm`.
- O **valor** de uma oportunidade é a soma de `kg × precoKg` dos itens.
- **Situação do cliente:** sem compras = Prospecto; 1 compra = Novo; 2 ou mais = Recorrente; última compra há mais de 45 dias = Inativo.

## Limitações da v1

- **Sem back-end:** os dados ficam só no navegador onde foram cadastrados. Outro computador ou outro navegador não vê os mesmos dados.
- **Sem login:** qualquer pessoa com acesso à página pode ver e alterar tudo.
- **Risco de perda:** limpar os dados do navegador apaga o CRM. Use a cópia de segurança em Ajustes.

## Próximos passos

| Sprint | Entrega |
| --- | --- |
| Sprint 3 (22/10 a 13/11) | Validar a v1 com a Casa da Charque; back-end com API REST, banco de dados e login por vendedor |
| Sprint 4 (16/11 a 04/12) | Cadastrar os clientes reais, treinar a equipe e fazer a apresentação final |
| Futuro | Integração com WhatsApp, emissão de pedidos e estoque, ERP/financeiro, follow-up automático, IA para análise de clientes |

## Equipe

| Integrante | Matrícula |
| --- | --- |
| Carlos Eduardo Nogueira Cabral | 016333454 |
| Danilo Leite Nunes | 01608104 |
| Gabriel Henrique Dos Santos Oliveira | 01607719 |
| Geraldo Barbosa Neto | 01600900 |
| João Pedro Souza de Oliveira | 01606352 |

## Documentação

- [Documentação do projeto](https://claude.ai/artifact/NvFWCJN7ER4RSSLuNxG9as): tema, problema, objetivos, requisitos, casos de uso, backlog e cronograma
- [Protótipo publicado](https://claude.ai/artifact/UsVanHe12P5AMd9ZhAn7Xm)
