import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { autenticar } from '../auth.js';
import { CANAIS } from '../dominio.js';
import { interacaoDTO } from '../serializar.js';

const NovaInteracao = z.object({
  clienteId: z.string().min(1),
  canal: z.enum(CANAIS),
  nota: z.string().trim().min(1, 'Escreva o que foi conversado'),
});

export async function rotasInteracoes(app: FastifyInstance) {
  app.addHook('preHandler', autenticar);

  app.get('/interacoes', async () => {
    const lista = await prisma.interacao.findMany({ orderBy: { data: 'desc' } });
    return lista.map(interacaoDTO);
  });

  /** O contato fica registrado no nome de quem está logado. */
  app.post('/interacoes', async (req, reply) => {
    const dados = NovaInteracao.parse(req.body);
    const i = await prisma.interacao.create({ data: { ...dados, usuarioId: req.usuario.id } });
    return reply.code(201).send(interacaoDTO(i));
  });
}
