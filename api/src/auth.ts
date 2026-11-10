import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { env } from './env.js';
import { prisma } from './db.js';
import { usuarioDTO, type UsuarioDTO } from './serializar.js';

export const COOKIE_SESSAO = 'crm_sessao';
const DURACAO_S = 60 * 60 * 12; // 12 horas, um turno de trabalho

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
  }
}
declare module 'fastify' {
  interface FastifyRequest {
    usuario: UsuarioDTO;
  }
}

export async function registrarAuth(app: FastifyInstance) {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: COOKIE_SESSAO, signed: false },
    sign: { expiresIn: DURACAO_S },
  });
}

export function gravarSessao(reply: FastifyReply, token: string) {
  reply.setCookie(COOKIE_SESSAO, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    maxAge: DURACAO_S,
  });
}

export function limparSessao(reply: FastifyReply) {
  reply.clearCookie(COOKIE_SESSAO, { path: '/' });
}

/** preHandler: exige sessão válida de um usuário ativo. */
export async function autenticar(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { sub } = await req.jwtVerify<{ sub: string }>();
    const u = await prisma.usuario.findUnique({ where: { id: sub } });
    if (!u || !u.ativo) throw new Error('usuário inativo');
    req.usuario = usuarioDTO(u);
  } catch {
    return reply.code(401).send({ erro: 'Faça login para continuar.' });
  }
}

/** preHandler: exige papel ADMIN (gerência). Use depois de `autenticar`. */
export async function exigirAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (req.usuario?.papel !== 'ADMIN') return reply.code(403).send({ erro: 'Só a gerência pode fazer isso.' });
}
