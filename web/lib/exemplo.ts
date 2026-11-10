import { CANAIS, DAY, ORIGENS } from './constantes';
import { valorOp } from './calculos';
import { isoDia, uid } from './formato';
import type { Cliente, Db, EtapaId, Interacao, Item, Oportunidade, Produto } from './tipos';

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

type Base = [nome: string, doc: string, tipo: string, cidade: string, compras: number, idade: number, ultima: number | null, pref: string[]];

export function gerarExemplo(): Db {
  const r = rng(20261021);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const entre = (a: number, b: number) => a + r() * (b - a);
  const agora = Date.now();
  const produtos: Produto[] = [
    { id: 'p1', nome: 'Charque bovino ponta de agulha', precoKg: 38.9 },
    { id: 'p2', nome: 'Charque bovino traseiro', precoKg: 52.5 },
    { id: 'p3', nome: 'Carne de sol (coxão duro)', precoKg: 49.9 },
    { id: 'p4', nome: 'Jabá dianteiro', precoKg: 34.0 },
    { id: 'p5', nome: 'Linguiça calabresa', precoKg: 27.9 },
    { id: 'p6', nome: 'Bacon manta', precoKg: 31.5 },
    { id: 'p7', nome: 'Paio', precoKg: 29.9 },
    { id: 'p8', nome: 'Toucinho salgado', precoKg: 18.9 },
  ];
  const responsaveis = ['Marcos Lima', 'Rita Alves', 'Severino Costa'];
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
  const clientes: Cliente[] = [], oportunidades: Oportunidade[] = [], interacoes: Interacao[] = [];

  const fazItens = (tipo: string, pref: string[]): Item[] => {
    const [a, b] = kgFaixa[tipo];
    const n = 1 + Math.floor(r() * Math.min(2, pref.length));
    const usados = [...pref].sort(() => r() - 0.5).slice(0, n);
    if (r() < 0.3) usados.push(pick(produtos).id);
    return [...new Set(usados)].map(pid => ({
      produtoId: pid,
      kg: Math.max(5, Math.round(entre(a, b) / n / 5) * 5),
      precoKg: +(produtos.find(p => p.id === pid)!.precoKg * entre(0.95, 1.02)).toFixed(2),
    }));
  };
  const op = (o: Omit<Oportunidade, 'id' | 'obs' | 'motivoPerda'> & Partial<Oportunidade>): Oportunidade => ({
    id: uid(), obs: '', motivoPerda: '', ...o,
  });

  base.forEach(([nome, doc, tipo, cidade, compras, idade, ultima, pref], i) => {
    const id = 'c' + (i + 1);
    const criadoEm = agora - idade * DAY;
    const tel = `(81) 9${String(8100 + Math.floor(r() * 1800))}-${String(1000 + Math.floor(r() * 8999))}`;
    const resp = responsaveis[i % 3];
    const slug = nome.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().split(' ').slice(0, 2).join('');
    clientes.push({ id, nome, doc, tel, whatsapp: tel, email: `${slug}@exemplo.com.br`, cidade, uf: 'PE', tipo, responsavel: resp, obs: pick(obs), criadoEm });
    let t = ultima != null ? agora - ultima * DAY : null;
    for (let k = 0; k < compras && t && t > criadoEm; k++) {
      const fech = t - Math.floor(entre(8, 15)) * 36e5;
      oportunidades.push(op({
        clienteId: id, titulo: pick(titulos), etapa: 'ganha', responsavel: resp,
        origem: k === compras - 1 ? pick(ORIGENS) : 'Recompra', prazo: isoDia(fech), proximaAcao: '',
        itens: fazItens(tipo, pref), criadoEm: fech - Math.floor(entre(2, 9)) * DAY, fechadoEm: fech,
      }));
      t -= Math.floor(entre(16, 34)) * DAY;
    }
    const nInt = 1 + Math.floor(r() * 3);
    for (let k = 0; k < nInt; k++) {
      const quando = agora - Math.floor(entre(0, Math.min(idade, 45))) * DAY - Math.floor(entre(1, 10)) * 36e5;
      const canal = pick(CANAIS);
      interacoes.push({ id: uid(), clienteId: id, data: quando, canal, nota: notas[canal], responsavel: resp });
    }
  });

  // Oportunidades em andamento: índice do cliente, etapa, dias até o prazo, próxima ação
  const abertas: [number, EtapaId, number, string][] = [
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
  abertas.forEach(([ci, et, prazo, acao]) => {
    const c = clientes[ci];
    oportunidades.push(op({
      clienteId: c.id, titulo: pick(titulos), etapa: et, responsavel: c.responsavel, origem: pick(ORIGENS),
      prazo: isoDia(agora + prazo * DAY), proximaAcao: acao, itens: fazItens(c.tipo, base[ci][7]),
      criadoEm: agora - Math.floor(entre(2, 18)) * DAY, fechadoEm: null,
    }));
  });

  const perdidas: [number, number, string][] = [
    [3, 25, 'Preço acima do concorrente'], [6, 40, 'Cliente reduziu o cardápio'], [1, 12, 'Prazo de pagamento'],
    [10, 70, 'Sem retorno do cliente'], [8, 5, 'Comprou de outro fornecedor'],
  ];
  perdidas.forEach(([ci, dias, motivo]) => {
    const c = clientes[ci];
    const fech = agora - dias * DAY;
    oportunidades.push(op({
      clienteId: c.id, titulo: pick(titulos), etapa: 'perdida', responsavel: c.responsavel, origem: pick(ORIGENS),
      prazo: isoDia(fech), proximaAcao: '', itens: fazItens(c.tipo, base[ci][7]), criadoEm: fech - 8 * DAY,
      fechadoEm: fech, motivoPerda: motivo,
    }));
  });

  // Meta: média dos 3 últimos meses fechados + 15%, arredondada
  const d = new Date();
  let soma = 0;
  for (let i = 1; i <= 3; i++) {
    const s = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
    const e = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
    soma += oportunidades
      .filter(o => o.etapa === 'ganha' && o.fechadoEm! >= s && o.fechadoEm! < e)
      .reduce((a, o) => a + valorOp(o), 0);
  }
  const meta = Math.max(10000, Math.round((soma / 3) * 1.15 / 5000) * 5000);
  return { versao: 1, exemplo: true, clientes, oportunidades, interacoes, config: { metaMensal: meta, produtos, responsaveis } };
}
