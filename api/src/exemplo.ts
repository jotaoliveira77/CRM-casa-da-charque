import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Etapa, Prisma } from '@prisma/client';
import { prisma } from './db.js';
import { env } from './env.js';
import { CANAIS, DIA, ORIGENS, paraData } from './dominio.js';

type Tx = Prisma.TransactionClient;

/** Gerador pseudoaleatório com semente fixa: os dados de exemplo saem sempre iguais. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDia = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const PRODUTOS_PADRAO = [
  { chave: 'p1', nome: 'Charque bovino ponta de agulha', precoKg: 38.9 },
  { chave: 'p2', nome: 'Charque bovino traseiro', precoKg: 52.5 },
  { chave: 'p3', nome: 'Carne de sol (coxão duro)', precoKg: 49.9 },
  { chave: 'p4', nome: 'Jabá dianteiro', precoKg: 34.0 },
  { chave: 'p5', nome: 'Linguiça calabresa', precoKg: 27.9 },
  { chave: 'p6', nome: 'Bacon manta', precoKg: 31.5 },
  { chave: 'p7', nome: 'Paio', precoKg: 29.9 },
  { chave: 'p8', nome: 'Toucinho salgado', precoKg: 18.9 },
];

const VENDEDORES = [
  { nome: 'Marcos Lima', email: 'marcos@casadacharque.local' },
  { nome: 'Rita Alves', email: 'rita@casadacharque.local' },
  { nome: 'Severino Costa', email: 'severino@casadacharque.local' },
];

/** Apaga clientes, oportunidades (com itens) e contatos. */
export async function limparMovimento(tx: Tx) {
  await tx.interacao.deleteMany();
  await tx.itemOportunidade.deleteMany();
  await tx.oportunidade.deleteMany();
  await tx.cliente.deleteMany();
}

/** Garante que os vendedores de exemplo existam e devolve os ids deles, na ordem. */
async function vendedoresExemplo(tx: Tx) {
  const ids: string[] = [];
  const hash = await bcrypt.hash(env.SEED_SENHA, 10);
  for (const v of VENDEDORES) {
    const u = await tx.usuario.upsert({ where: { email: v.email }, update: {}, create: { ...v, senhaHash: hash, papel: 'VENDEDOR' } });
    ids.push(u.id);
  }
  return ids;
}

type Base = [nome: string, doc: string, tipo: string, cidade: string, compras: number, idade: number, ultima: number | null, pref: string[]];

/** Substitui clientes, vendas, contatos e produtos pelos dados fictícios de demonstração. */
export async function carregarExemplo() {
  const resps = await prisma.$transaction(tx => vendedoresExemplo(tx));

  const r = rng(20261021);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const entre = (a: number, b: number) => a + r() * (b - a);
  const agora = Date.now();

  const produtos = PRODUTOS_PADRAO.map(p => ({ ...p, id: randomUUID() }));
  const idProduto = Object.fromEntries(produtos.map(p => [p.chave, p.id]));
  const precoProduto = Object.fromEntries(produtos.map(p => [p.chave, p.precoKg]));

  const base: Base[] = [
    ['Restaurante Sabor do Sertão', '11.222.333/0001-81', 'Restaurante', 'Recife', 7, 320, 4, ['p1', 'p3']],
    ['Mercadinho Boa Vista', '22.333.444/0001-72', 'Mercadinho', 'Olinda', 5, 260, 12, ['p1', 'p5']],
    ['Distribuidora Agreste Carnes', '33.444.555/0001-63', 'Distribuidor', 'Caruaru', 6, 400, 9, ['p1', 'p4', 'p2']],
    ['Bar e Petiscaria Maré Alta', '44.555.666/0001-54', 'Restaurante', 'Recife', 4, 200, 46, ['p3', 'p5']],
    ['Atacadão do Cabo', '55.666.777/0001-45', 'Atacado', 'Cabo de Santo Agostinho', 5, 350, 18, ['p1', 'p6', 'p8']],
    ['Lúcia Ferreira (Feira de Casa Amarela)', '123.456.789-09', 'Feirante', 'Recife', 6, 280, 7, ['p4', 'p8']],
    ['Pousada Mar de Porto', '66.777.888/0001-36', 'Restaurante', 'Ipojuca', 3, 210, 52, ['p2', 'p3']],
    ['Supermercado Guararapes', '77.888.999/0001-27', 'Varejo', 'Jaboatão dos Guararapes', 5, 300, 15, ['p1', 'p5', 'p6']],
    ['Feijoada da Tia Nena', '88.999.000/0001-18', 'Restaurante', 'Paulista', 4, 180, 38, ['p4', 'p7', 'p6']],
    ['Empório Nordestino', '99.000.111/0001-09', 'Varejo', 'Recife', 3, 150, 21, ['p2', 'p3']],
    ['Comercial Mata Norte', '10.111.222/0001-90', 'Distribuidor', 'Goiana', 2, 120, 64, ['p1', 'p4']],
    ['Cantina Universitária Graças', '20.222.333/0001-80', 'Restaurante', 'Recife', 1, 26, 10, ['p3']],
    ['José Carlos Revendas', '987.654.321-00', 'Varejo', 'Camaragibe', 0, 9, null, ['p1']],
    ['Self-Service Mais Sabor', '30.333.444/0001-70', 'Restaurante', 'Recife', 0, 14, null, ['p3', 'p5']],
  ];
  const kgFaixa: Record<string, [number, number]> = {
    Atacado: [140, 380], Distribuidor: [160, 420], Restaurante: [15, 55], Varejo: [40, 130], Mercadinho: [25, 80], Feirante: [12, 30],
  };
  const titulos = ['Reposição semanal', 'Pedido do mês', 'Abastecimento da loja', 'Cardápio de fim de semana', 'Pedido para evento', 'Reposição de estoque'];
  const obs = [
    'Prefere entrega cedo, antes das 7h. Paga no PIX.',
    'Pede charque mais magra. Negociar prazo de 14 dias.',
    'Compra no balcão às sextas. Gosta de provar antes.',
    'Só fecha com nota fiscal. Contato pelo WhatsApp.',
    'Sensível a preço; comparar com concorrente do galpão ao lado.',
    'Aumenta pedido em junho (São João) e dezembro.',
  ];
  const notas: Record<string, string> = {
    'Ligação': 'Ligou para saber o preço da semana.',
    'WhatsApp': 'Mandou tabela de preços atualizada.',
    'Visita': 'Visita ao estabelecimento, conferiu estoque com o cliente.',
    'E-mail': 'Enviou cotação por e-mail.',
    'Balcão': 'Passou no box da CEASA, provou a ponta de agulha.',
  };
  const origens = ORIGENS.filter(o => o !== 'Recompra');

  const clientes: Prisma.ClienteCreateManyInput[] = [];
  const oportunidades: Prisma.OportunidadeCreateManyInput[] = [];
  const itens: Prisma.ItemOportunidadeCreateManyInput[] = [];
  const interacoes: Prisma.InteracaoCreateManyInput[] = [];

  const fazItens = (opId: string, tipo: string, pref: string[]) => {
    const [a, b] = kgFaixa[tipo];
    const n = 1 + Math.floor(r() * Math.min(2, pref.length));
    const usados = [...pref].sort(() => r() - 0.5).slice(0, n);
    if (r() < 0.3) usados.push(pick(produtos).chave);
    let total = 0;
    for (const chave of new Set(usados)) {
      const kg = Math.max(5, Math.round(entre(a, b) / n / 5) * 5);
      const precoKg = +(precoProduto[chave] * entre(0.95, 1.02)).toFixed(2);
      itens.push({ id: randomUUID(), oportunidadeId: opId, produtoId: idProduto[chave], kg, precoKg });
      total += kg * precoKg;
    }
    return total;
  };
  const vendas: { fechadoEm: number; valor: number }[] = [];
  const op = (o: Omit<Prisma.OportunidadeCreateManyInput, 'id' | 'prazo'> & { prazo: string; tipo: string; pref: string[] }) => {
    const { tipo, pref, prazo, ...resto } = o;
    const id = randomUUID();
    oportunidades.push({ ...resto, id, prazo: paraData(prazo) });
    const valor = fazItens(id, tipo, pref);
    if (o.etapa === 'ganha') vendas.push({ fechadoEm: (o.fechadoEm as Date).getTime(), valor });
  };

  base.forEach(([nome, doc, tipo, cidade, compras, idade, ultima, pref], i) => {
    const id = randomUUID();
    const criadoEm = agora - idade * DIA;
    const tel = `(81) 9${String(8100 + Math.floor(r() * 1800))}-${String(1000 + Math.floor(r() * 8999))}`;
    const resp = resps[i % 3];
    const slug = nome.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().split(' ').slice(0, 2).join('');
    clientes.push({ id, nome, doc, tel, whatsapp: tel, email: `${slug}@exemplo.com.br`, cidade, uf: 'PE', tipo, responsavelId: resp, obs: pick(obs), criadoEm: new Date(criadoEm) });
    let t = ultima != null ? agora - ultima * DIA : null;
    for (let k = 0; k < compras && t && t > criadoEm; k++) {
      const fech = t - Math.floor(entre(8, 15)) * 36e5;
      op({
        clienteId: id, titulo: pick(titulos), etapa: 'ganha', responsavelId: resp,
        origem: k === compras - 1 ? pick(origens) : 'Recompra', prazo: isoDia(fech),
        criadoEm: new Date(fech - Math.floor(entre(2, 9)) * DIA), fechadoEm: new Date(fech), tipo, pref,
      });
      t -= Math.floor(entre(16, 34)) * DIA;
    }
    const nInt = 1 + Math.floor(r() * 3);
    for (let k = 0; k < nInt; k++) {
      const quando = agora - Math.floor(entre(0, Math.min(idade, 45))) * DIA - Math.floor(entre(1, 10)) * 36e5;
      const canal = pick(CANAIS);
      interacoes.push({ id: randomUUID(), clienteId: id, data: new Date(quando), canal, nota: notas[canal], usuarioId: resp });
    }
  });

  const abertas: [number, Etapa, number, string][] = [
    [12, 'novo', 2, 'Ligar para apresentar a tabela de preços'],
    [13, 'qualificacao', 1, 'Visitar o restaurante e entender o volume semanal'],
    [11, 'necessidade', 4, 'Montar proposta com carne de sol para o cardápio'],
    [3, 'proposta', 3, 'Cobrar retorno da proposta pelo WhatsApp'],
    [6, 'proposta', -2, 'Reenviar proposta com frete incluso'],
    [10, 'negociacao', 5, 'Contraproposta: 3% de desconto acima de 300 kg'],
    [4, 'negociacao', 1, 'Fechar prazo de pagamento (21 dias)'],
    [8, 'aguardando', -1, 'Confirmar pedido para o sábado'],
    [2, 'aguardando', 2, 'Aguardar aprovação do comprador'],
    [0, 'novo', 6, 'Oferecer charque traseiro para prato novo'],
    [7, 'qualificacao', 7, 'Verificar se compram de outro fornecedor'],
    [9, 'proposta', 0, 'Enviar amostra de jabá'],
  ];
  abertas.forEach(([ci, etapa, prazo, acao]) => {
    const c = clientes[ci];
    op({
      clienteId: c.id!, titulo: pick(titulos), etapa, responsavelId: c.responsavelId, origem: pick(origens),
      prazo: isoDia(agora + prazo * DIA), proximaAcao: acao, criadoEm: new Date(agora - Math.floor(entre(2, 18)) * DIA),
      fechadoEm: null, tipo: c.tipo, pref: base[ci][7],
    });
  });

  const perdidas: [number, number, string][] = [
    [3, 25, 'Preço acima do concorrente'], [6, 40, 'Cliente reduziu o cardápio'], [1, 12, 'Prazo de pagamento'],
    [10, 70, 'Sem retorno do cliente'], [8, 5, 'Comprou de outro fornecedor'],
  ];
  perdidas.forEach(([ci, dias, motivo]) => {
    const c = clientes[ci];
    const fech = agora - dias * DIA;
    op({
      clienteId: c.id!, titulo: pick(titulos), etapa: 'perdida', responsavelId: c.responsavelId, origem: pick(origens),
      prazo: isoDia(fech), criadoEm: new Date(fech - 8 * DIA), fechadoEm: new Date(fech), motivoPerda: motivo,
      tipo: c.tipo, pref: base[ci][7],
    });
  });

  // Meta: média dos 3 últimos meses fechados + 15%, arredondada para múltiplos de R$ 5 mil
  const d = new Date();
  let soma = 0;
  for (let i = 1; i <= 3; i++) {
    const s = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
    const e = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
    soma += vendas.filter(v => v.fechadoEm >= s && v.fechadoEm < e).reduce((a, v) => a + v.valor, 0);
  }
  const meta = Math.max(10000, Math.round(((soma / 3) * 1.15) / 5000) * 5000);

  await prisma.$transaction(
    async tx => {
      await limparMovimento(tx);
      await tx.produto.deleteMany();
      await tx.produto.createMany({ data: produtos.map(({ id, nome, precoKg }) => ({ id, nome, precoKg })) });
      await tx.cliente.createMany({ data: clientes });
      await tx.oportunidade.createMany({ data: oportunidades });
      await tx.itemOportunidade.createMany({ data: itens });
      await tx.interacao.createMany({ data: interacoes });
      await tx.configuracao.upsert({
        where: { id: 1 },
        create: { id: 1, metaMensal: meta, exemplo: true },
        update: { metaMensal: meta, exemplo: true },
      });
    },
    { timeout: 30_000 },
  );
}
