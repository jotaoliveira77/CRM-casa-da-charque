import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { autenticar } from '../auth.js';
import { TIPOS } from '../dominio.js';
import { clienteDTO } from '../serializar.js';

const texto = z.string().trim().default('');
const DadosCliente = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do cliente'),
  doc: texto,
  tel: texto,
  whatsapp: texto,
  email: z.union([z.literal(''), z.string().trim().email('E-mail inválido')]).default(''),
  cidade: texto,
  uf: z.string().trim().toUpperCase().length(2, 'UF precisa ter 2 letras').default('PE'),
  tipo: z.enum(TIPOS),
  obs: texto,
  responsavelId: z.string().nullable().default(null),
});
const Id = z.object({ id: z.string() });

export async function rotasClientes(app: FastifyInstance) {
  app.addHook('preHandler', autenticar);

  app.get('/clientes', async () => {
    const lista = await prisma.cliente.findMany({ orderBy: { nome: 'asc' } });
    return lista.map(clienteDTO);
  });

  app.get('/clientes/:id', async req => {
    const { id } = Id.parse(req.params);
    return clienteDTO(await prisma.cliente.findUniqueOrThrow({ where: { id } }));
  });

  app.post('/clientes', async (req, reply) => {
    const dados = DadosCliente.parse(req.body);
    const c = await prisma.cliente.create({ data: dados });
    return reply.code(201).send(clienteDTO(c));
  });

  app.put('/clientes/:id', async req => {
    const { id } = Id.parse(req.params);
    const c = await prisma.cliente.update({ where: { id }, data: DadosCliente.parse(req.body) });
    return clienteDTO(c);
  });

  /** Apaga o cliente com as oportunidades e os contatos dele (cascata no banco). */
  app.delete('/clientes/:id', async (req, reply) => {
    const { id } = Id.parse(req.params);
    await prisma.cliente.delete({ where: { id } });
    return reply.code(204).send();
  });
}
