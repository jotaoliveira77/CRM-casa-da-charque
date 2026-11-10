import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { autenticar, gravarSessao, limparSessao } from '../auth.js';
import { usuarioDTO } from '../serializar.js';

const Login = z.object({ email: z.string().trim().toLowerCase().email(), senha: z.string().min(1) });

export async function rotasAuth(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const { email, senha } = Login.parse(req.body);
    const u = await prisma.usuario.findUnique({ where: { email } });
    // Mesma resposta para e-mail inexistente e senha errada, para não revelar quem tem conta.
    if (!u || !u.ativo || !(await bcrypt.compare(senha, u.senhaHash))) {
      return reply.code(401).send({ erro: 'E-mail ou senha incorretos.' });
    }
    gravarSessao(reply, app.jwt.sign({ sub: u.id }));
    return usuarioDTO(u);
  });

  app.post('/auth/logout', async (_req, reply) => {
    limparSessao(reply);
    return reply.code(204).send();
  });

  app.get('/auth/me', { preHandler: autenticar }, async req => req.usuario);
}
