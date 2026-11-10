/**
 * Prepara um banco recém-criado. Só age quando não existe nenhum usuário,
 * então pode rodar a cada subida do container sem apagar nada.
 */
import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { env } from './env.js';
import { PRODUTOS_PADRAO, carregarExemplo } from './exemplo.js';

async function main() {
  if ((await prisma.usuario.count()) > 0) {
    console.log('[seed] Banco já tem usuários; nada a fazer.');
    return;
  }
  await prisma.usuario.create({
    data: { nome: 'Gerência', email: env.SEED_ADMIN_EMAIL, senhaHash: await bcrypt.hash(env.SEED_SENHA, 10), papel: 'ADMIN' },
  });
  if (env.SEED_EXEMPLO) {
    await carregarExemplo();
    console.log('[seed] Usuário da gerência, vendedores e dados de exemplo criados.');
  } else {
    await prisma.produto.createMany({ data: PRODUTOS_PADRAO.map(({ nome, precoKg }) => ({ nome, precoKg })) });
    await prisma.configuracao.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    console.log('[seed] Usuário da gerência e catálogo de produtos criados.');
  }
  console.log(`[seed] Entre com ${env.SEED_ADMIN_EMAIL} e a senha definida em SEED_SENHA.`);
}

main()
  .catch(e => {
    console.error('[seed] Falhou:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
