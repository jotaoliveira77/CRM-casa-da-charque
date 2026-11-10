import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { autenticar } from '../auth.js';
import { ETAPAS, dataFechamento, paraData } from '../dominio.js';
import { oportunidadeDTO } from '../serializar.js';

const Etapa = z.enum(ETAPAS);
const Item = z.object({
  produtoId: z.string().min(1),
  kg: z.number().positive('Os quilos precisam ser maiores que zero'),
  precoKg: z.number().nonnegative(),
});
const DadosOportunidade = z.object({
  clienteId: z.string().min(1, 'Escolha o cliente'),
  titulo: z.string().trim().default('').transform(t => t || 'Oportunidade'),
  etapa: Etapa.default('novo'),
  responsavelId: z.string().nullable().default(null),
  origem: z.string().trim().default(''),
  prazo: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Prazo no formato AAAA-MM-DD')
    .default(''),
  proximaAcao: z.string().trim().default(''),
  motivoPerda: z.string().trim().default(''),
  obs: z.string().trim().default(''),
  itens: z.array(Item).default([]),
});
const Id = z.object({ id: z.string() });
const comItens = { itens: true } as const;

export async function rotasOportunidades(app: FastifyInstance) {
  app.addHook('preHandler', autenticar);

  app.get('/oportunidades', async () => {
    const lista = await prisma.oportunidade.findMany({ include: comItens, orderBy: { criadoEm: 'desc' } });
    return lista.map(oportunidadeDTO);
  });

  app.post('/oportunidades', async (req, reply) => {
    const { itens, prazo, ...dados } = DadosOportunidade.parse(req.body);
    const o = await prisma.oportunidade.create({
      data: {
        ...dados,
        prazo: paraData(prazo),
        fechadoEm: dataFechamento(dados.etapa, null, null),
        itens: { create: itens },
      },
      include: comItens,
    });
    return reply.code(201).send(oportunidadeDTO(o));
  });

  /** Substitui todos os campos e a lista de produtos. */
  app.put('/oportunidades/:id', async req => {
    const { id } = Id.parse(req.params);
    const { itens, prazo, ...dados } = DadosOportunidade.parse(req.body);
    const o = await prisma.$transaction(async tx => {
      const antes = await tx.oportunidade.findUniqueOrThrow({ where: { id } });
      await tx.itemOportunidade.deleteMany({ where: { oportunidadeId: id } });
      return tx.oportunidade.update({
        where: { id },
        data: {
          ...dados,
          prazo: paraData(prazo),
          fechadoEm: dataFechamento(dados.etapa, antes.etapa, antes.fechadoEm),
          itens: { create: itens },
        },
        include: comItens,
      });
    });
    return oportunidadeDTO(o);
  });

  /** Move entre etapas do funil (arrastar e soltar). */
  app.patch('/oportunidades/:id/etapa', async req => {
    const { id } = Id.parse(req.params);
    const { etapa } = z.object({ etapa: Etapa }).parse(req.body);
    const antes = await prisma.oportunidade.findUniqueOrThrow({ where: { id } });
    const o = await prisma.oportunidade.update({
      where: { id },
      data: { etapa, fechadoEm: dataFechamento(etapa, antes.etapa, antes.fechadoEm) },
      include: comItens,
    });
    return oportunidadeDTO(o);
  });

  app.delete('/oportunidades/:id', async (req, reply) => {
    const { id } = Id.parse(req.params);
    await prisma.oportunidade.delete({ where: { id } });
    return reply.code(204).send();
  });
}
