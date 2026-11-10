import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { autenticar, exigirAdmin } from '../auth.js';
import { carregarExemplo, limparMovimento } from '../exemplo.js';
import {
  clienteDTO, configuracaoDTO, interacaoDTO, oportunidadeDTO, produtoDTO, usuarioDTO,
} from '../serializar.js';

const ListaProdutos = z.array(
  z.object({
    id: z.string().optional(),
    nome: z.string().trim().min(1),
    precoKg: z.number().nonnegative(),
  }),
);

export const configuracao = () =>
  prisma.configuracao.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

export async function rotasAjustes(app: FastifyInstance) {
  app.addHook('preHandler', autenticar);

  // ---- Produtos ----
  /** Lista todos, inclusive os inativos (necessários para mostrar o histórico de vendas). */
  app.get('/produtos', async () => {
    const lista = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
    return lista.map(produtoDTO);
  });

  /** Recebe o catálogo inteiro: atualiza os que têm id, cria os novos e inativa os que saíram da lista. */
  app.put('/produtos', { preHandler: exigirAdmin }, async req => {
    const lista = ListaProdutos.parse(req.body);
    await prisma.$transaction(async tx => {
      const existentes = new Set((await tx.produto.findMany({ select: { id: true } })).map(p => p.id));
      const mantidos: string[] = [];
      for (const p of lista) {
        if (p.id && existentes.has(p.id)) {
          await tx.produto.update({ where: { id: p.id }, data: { nome: p.nome, precoKg: p.precoKg, ativo: true } });
          mantidos.push(p.id);
        } else {
          const novo = await tx.produto.create({ data: { nome: p.nome, precoKg: p.precoKg } });
          mantidos.push(novo.id);
        }
      }
      await tx.produto.updateMany({ where: { id: { notIn: mantidos } }, data: { ativo: false } });
    });
    const todos = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
    return todos.map(produtoDTO);
  });

  // ---- Configuração ----
  app.get('/configuracao', async () => configuracaoDTO(await configuracao()));

  app.put('/configuracao', { preHandler: exigirAdmin }, async req => {
    const { metaMensal } = z.object({ metaMensal: z.number().nonnegative() }).parse(req.body);
    await configuracao();
    return configuracaoDTO(await prisma.configuracao.update({ where: { id: 1 }, data: { metaMensal } }));
  });

  // ---- Cópia de segurança e dados ----
  app.get('/backup', async (_req, reply) => {
    const [usuarios, clientes, oportunidades, interacoes, produtos, config] = await Promise.all([
      prisma.usuario.findMany(),
      prisma.cliente.findMany(),
      prisma.oportunidade.findMany({ include: { itens: true } }),
      prisma.interacao.findMany(),
      prisma.produto.findMany(),
      configuracao(),
    ]);
    const nome = `crm-casa-da-charque-${new Date().toISOString().slice(0, 10)}.json`;
    reply.header('Content-Disposition', `attachment; filename="${nome}"`);
    return {
      geradoEm: new Date().toISOString(),
      usuarios: usuarios.map(usuarioDTO),
      clientes: clientes.map(clienteDTO),
      oportunidades: oportunidades.map(oportunidadeDTO),
      interacoes: interacoes.map(interacaoDTO),
      produtos: produtos.map(produtoDTO),
      configuracao: configuracaoDTO(config),
    };
  });

  /**
   * zerar: apaga clientes, oportunidades e contatos (mantém usuários, produtos e meta).
   * exemplo: apaga tudo isso e carrega de novo os dados fictícios de demonstração.
   */
  app.post('/admin/reset', { preHandler: exigirAdmin }, async req => {
    const { modo } = z.object({ modo: z.enum(['zerar', 'exemplo']) }).parse(req.body);
    if (modo === 'zerar') {
      await prisma.$transaction(async tx => {
        await limparMovimento(tx);
        await tx.configuracao.upsert({ where: { id: 1 }, create: { id: 1, exemplo: false }, update: { exemplo: false } });
      });
    } else {
      await carregarExemplo();
    }
    return { ok: true };
  });
}
