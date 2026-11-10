import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { autenticar, exigirAdmin } from '../auth.js';
import { usuarioDTO } from '../serializar.js';

const Papel = z.enum(['ADMIN', 'VENDEDOR']);
const Novo = z.object({
  nome: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
  papel: Papel.default('VENDEDOR'),
});
const Alteracao = z.object({
  nome: z.string().trim().min(1).optional(),
  papel: Papel.optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres').optional(),
});
const Id = z.object({ id: z.string() });

export async function rotasUsuarios(app: FastifyInstance) {
  app.addHook('preHandler', autenticar);

  app.get('/usuarios', async () => {
    const lista = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
    return lista.map(usuarioDTO);
  });

  app.post('/usuarios', { preHandler: exigirAdmin }, async (req, reply) => {
    const { senha, ...dados } = Novo.parse(req.body);
    const u = await prisma.usuario.create({ data: { ...dados, senhaHash: await bcrypt.hash(senha, 10) } });
    return reply.code(201).send(usuarioDTO(u));
  });

  app.patch('/usuarios/:id', { preHandler: exigirAdmin }, async (req, reply) => {
    const { id } = Id.parse(req.params);
    const { senha, ...dados } = Alteracao.parse(req.body);
    if (id === req.usuario.id && (dados.ativo === false || dados.papel === 'VENDEDOR')) {
      return reply.code(400).send({ erro: 'Você não pode desativar nem rebaixar o próprio usuário.' });
    }
    const u = await prisma.usuario.update({
      where: { id },
      data: { ...dados, ...(senha ? { senhaHash: await bcrypt.hash(senha, 10) } : {}) },
    });
    return usuarioDTO(u);
  });
}
