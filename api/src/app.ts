import Fastify from 'fastify';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { registrarAuth } from './auth.js';
import { prisma } from './db.js';
import { rotasAuth } from './rotas/auth.js';
import { rotasUsuarios } from './rotas/usuarios.js';
import { rotasClientes } from './rotas/clientes.js';
import { rotasOportunidades } from './rotas/oportunidades.js';
import { rotasInteracoes } from './rotas/interacoes.js';
import { rotasAjustes } from './rotas/ajustes.js';

export async function criarApp() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

  await registrarAuth(app);

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      const primeiro = err.issues[0];
      return reply.code(400).send({ erro: primeiro?.message ?? 'Dados inválidos.', detalhes: err.issues });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return reply.code(404).send({ erro: 'Registro não encontrado.' });
      if (err.code === 'P2002') return reply.code(409).send({ erro: 'Já existe um registro com esse valor (provavelmente o e-mail).' });
      if (err.code === 'P2003') return reply.code(400).send({ erro: 'Referência inválida: cliente, produto ou usuário não existe.' });
    }
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode && e.statusCode < 500 ? e.statusCode : 500;
    if (status === 500) req.log.error(err);
    return reply.code(status).send({ erro: status === 500 ? 'Erro interno no servidor.' : e.message });
  });

  app.get('/api/health', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  await app.register(
    async api => {
      await api.register(rotasAuth);
      await api.register(rotasUsuarios);
      await api.register(rotasClientes);
      await api.register(rotasOportunidades);
      await api.register(rotasInteracoes);
      await api.register(rotasAjustes);
    },
    { prefix: '/api' },
  );

  return app;
}
