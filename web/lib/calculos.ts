import { ABERTAS, DAY } from './constantes';
import { diasAtras, inicioDia, parseDia } from './formato';
import type { Db, Oportunidade, Situacao } from './tipos';

export const valorOp = (o: Pick<Oportunidade, 'itens'>) =>
  o.itens.reduce((s, i) => s + (+i.kg || 0) * (+i.precoKg || 0), 0);
export const kgOp = (o: Pick<Oportunidade, 'itens'>) => o.itens.reduce((s, i) => s + (+i.kg || 0), 0);
export const somaValor = (ops: Oportunidade[]) => ops.reduce((a, o) => a + valorOp(o), 0);

export const produto = (db: Db, id: string) => db.produtos.find(p => p.id === id);
export const cliente = (db: Db, id: string) => db.clientes.find(c => c.id === id);
export const nomeUsuario = (db: Db, id: string | null | undefined) => (id && db.usuarios.find(u => u.id === id)?.nome) || '—';
/** Quem pode ser responsável por clientes e oportunidades: usuários ativos. */
export const responsaveis = (db: Db) => db.usuarios.filter(u => u.ativo);
export const produtosAtivos = (db: Db) => db.produtos.filter(p => p.ativo);

export const vendas = (db: Db) => db.oportunidades.filter(o => o.etapa === 'ganha');
export const vendasEntre = (db: Db, s: number, e: number) =>
  vendas(db).filter(o => o.fechadoEm != null && o.fechadoEm >= s && o.fechadoEm < e);
export const somaVendas = (db: Db, s: number, e: number) => somaValor(vendasEntre(db, s, e));
export const comprasCliente = (db: Db, id: string) =>
  vendas(db)
    .filter(o => o.clienteId === id)
    .sort((a, b) => (b.fechadoEm ?? 0) - (a.fechadoEm ?? 0));
export const abertasCliente = (db: Db, id: string) =>
  db.oportunidades.filter(o => o.clienteId === id && ABERTAS.includes(o.etapa));

export function ultimoContato(db: Db, id: string) {
  const ts = [
    ...db.interacoes.filter(i => i.clienteId === id).map(i => i.data),
    ...db.oportunidades.filter(o => o.clienteId === id).map(o => o.fechadoEm || o.criadoEm),
  ];
  return ts.length ? Math.max(...ts) : cliente(db, id)?.criadoEm;
}

export function statusCliente(db: Db, id: string): Situacao {
  const c = comprasCliente(db, id);
  if (!c.length) return { rot: 'Prospecto', cls: '' };
  if (diasAtras(c[0].fechadoEm!) > 45) return { rot: 'Inativo', cls: 'warn' };
  if (c.length === 1) return { rot: 'Novo', cls: 'accent' };
  return { rot: 'Recorrente', cls: 'good' };
}

export type PeriodoId = 'mes' | 'mesPassado' | '90d' | 'ano';
export const PERIODOS: [PeriodoId, string][] = [
  ['mes', 'Este mês'],
  ['mesPassado', 'Mês passado'],
  ['90d', 'Últimos 90 dias'],
  ['ano', 'Este ano'],
];

export function periodo(chave: PeriodoId) {
  const d = new Date(),
    y = d.getFullYear(),
    m = d.getMonth();
  const mesAno = (dt: Date) => dt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  switch (chave) {
    case 'mesPassado':
      return { s: new Date(y, m - 1, 1).getTime(), e: new Date(y, m, 1).getTime(), rot: mesAno(new Date(y, m - 1, 1)) };
    case '90d':
      return { s: inicioDia(Date.now() - 89 * DAY), e: Date.now() + DAY, rot: 'últimos 90 dias' };
    case 'ano':
      return { s: new Date(y, 0, 1).getTime(), e: new Date(y + 1, 0, 1).getTime(), rot: String(y) };
    default:
      return { s: new Date(y, m, 1).getTime(), e: new Date(y, m + 1, 1).getTime(), rot: mesAno(d) };
  }
}

export function passoBonito(x: number) {
  const p = 10 ** Math.floor(Math.log10(x));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Ordena por prazo; sem prazo vai para o fim. */
export const porPrazo = (a: Oportunidade, b: Oportunidade) =>
  (parseDia(a.prazo) ?? 9e15) - (parseDia(b.prazo) ?? 9e15);

export const atrasada = (o: Oportunidade) =>
  ABERTAS.includes(o.etapa) && !!o.prazo && parseDia(o.prazo)! < inicioDia(Date.now());
