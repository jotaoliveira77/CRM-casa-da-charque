# CRM Casa da Charque

Sistema web de gestão do relacionamento com clientes (CRM) para a **Casa da Charque**, distribuidora de charque e carnes salgadas na CEASA de Recife-PE.

Projeto de Intervenção da disciplina **Atividades Práticas Interdisciplinares de Extensão II**, do curso de Ciência da Computação da UNINASSAU, campus Graças, Grupo 10, turma 8NB, 2026.

> **Versão atual: v2**, com front em Next.js, API REST, banco PostgreSQL e login por vendedor, tudo em Docker. Ver [Versão 2](#versão-2-nextjs--api--postgresql). O protótipo v1 (só front-end, dados no navegador) continua em `crm-casa-da-charque.html`.

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

## Versão 2 (Next.js + API + PostgreSQL)

Os dados ficam num banco PostgreSQL no servidor, compartilhados por toda a equipe, e cada pessoa entra com o próprio e-mail e senha.

| Serviço | Pasta | Tecnologia | Porta |
| --- | --- | --- | --- |
| Front | `web/` | Next.js 16, React 19, TypeScript | 3000 |
| API | `api/` | Node.js, Fastify 5, Prisma 6, Zod | 3333 |
| Banco | — | PostgreSQL 17 | 5432 (só local) |

O navegador fala só com o front: o Next repassa as chamadas `/api/*` para a API. Assim o cookie de sessão fica no mesmo endereço e não é preciso configurar CORS.

### Como executar com Docker

Requer o [Docker Desktop](https://www.docker.com/products/docker-desktop/) (no Windows, com WSL 2).

```bash
docker compose up -d --build
```

Depois acesse `http://localhost:3000`. Na primeira subida, a API cria as tabelas, o usuário da gerência, três vendedores e os dados de exemplo. O e-mail e a senha de desenvolvimento estão em [`.env.example`](.env.example).

Antes de usar com dados reais:

1. Copie `.env.example` para `.env` e troque `POSTGRES_PASSWORD`, `JWT_SECRET` e `SEED_SENHA`.
2. Em **Ajustes**, troque a senha da gerência, cadastre os vendedores reais e clique em **Apagar dados e começar do zero**.

Comandos úteis:

```bash
docker compose logs -f api
```

```bash
docker compose down
```

`docker compose down -v` também apaga o banco (volume `dados-postgres`).

### Como executar sem Docker (desenvolvimento)

Requer Node.js 20.9 ou superior e um PostgreSQL rodando (pode ser só o do Docker: `docker compose up -d db`).

```bash
cd api
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed:dev
npm run dev
```

Em outro terminal:

```bash
cd web
npm install
npm run dev
```

### Acesso e permissões

| Papel | Pode |
| --- | --- |
| Vendedor | Ver tudo; cadastrar e editar clientes, oportunidades e contatos; baixar a cópia de segurança |
| Gerência (`ADMIN`) | Tudo do vendedor, mais: meta mensal, catálogo de produtos, usuários (criar, trocar senha, mudar acesso, desativar) e apagar ou recarregar os dados |

A sessão dura 12 horas e fica num cookie `httpOnly`. Senhas são guardadas com bcrypt.

### Banco de dados

O modelo está em [`api/prisma/schema.prisma`](api/prisma/schema.prisma) e as migrações em `api/prisma/migrations/`.

| Tabela | Conteúdo |
| --- | --- |
| `usuarios` | Nome, e-mail, hash da senha, papel (`ADMIN`/`VENDEDOR`), ativo |
| `clientes` | Cadastro do cliente e vendedor responsável |
| `produtos` | Catálogo com preço por kg; produtos removidos ficam inativos para não quebrar o histórico |
| `oportunidades` | Etapa do funil, responsável, prazo, próxima ação, data de fechamento |
| `itens_oportunidade` | Produtos de cada oportunidade: kg × preço por kg negociado |
| `interacoes` | Contatos com o cliente (canal, nota, quem registrou) |
| `configuracao` | Linha única com a meta mensal e se os dados são de exemplo |

Valores em dinheiro e quilos usam `DECIMAL`. A data de fechamento (`fechado_em`) é marcada pela API quando a oportunidade entra em "Venda fechada" ou "Venda perdida", e apagada se ela voltar para uma etapa aberta.

### API REST

Todas as rotas ficam sob `/api` e, exceto login e `health`, exigem sessão. Erros voltam como `{ "erro": "mensagem em português" }`.

| Método e rota | O que faz |
| --- | --- |
| `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | Sessão |
| `GET /usuarios` · `POST /usuarios`* · `PATCH /usuarios/:id`* | Usuários |
| `GET/POST /clientes` · `GET/PUT/DELETE /clientes/:id` | Clientes (excluir apaga oportunidades e contatos dele) |
| `GET/POST /oportunidades` · `PUT/DELETE /oportunidades/:id` | Oportunidades com os itens |
| `PATCH /oportunidades/:id/etapa` | Move no funil |
| `GET/POST /interacoes` | Contatos |
| `GET /produtos` · `PUT /produtos`* | Catálogo (o `PUT` recebe a lista inteira) |
| `GET /configuracao` · `PUT /configuracao`* | Meta mensal |
| `GET /backup` | Cópia de todos os dados em JSON (sem senhas) |
| `POST /admin/reset`* | `{ "modo": "zerar" }` ou `{ "modo": "exemplo" }` |
| `GET /health` | Verificação de saúde (usada pelo Docker) |

\* Só gerência.

### Estrutura

| Pasta | O que tem |
| --- | --- |
| `api/src/rotas/` | Um arquivo por recurso da API |
| `api/src/exemplo.ts` · `api/src/seed.ts` | Dados de exemplo e preparação do banco vazio |
| `web/app/` | Layout, estilos e uma página por tela (`/painel`, `/funil`, `/clientes`, `/ajustes`) |
| `web/components/` | Estado e sessão (`crm-provider.tsx`), login, diálogos, ficha do cliente, gráfico |
| `web/lib/` | Cliente da API, tipos, constantes, formatação e cálculos do painel |

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
| Sprint 3 (22/10 a 13/11) | Validar a v1 com a Casa da Charque; back-end com API REST, banco de dados e login por vendedor (feito na v2) |
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
