import { criarApp } from './app.js';
import { prisma } from './db.js';
import { env } from './env.js';

const app = await criarApp();

const encerrar = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);

await app.listen({ port: env.PORT, host: env.HOST });
