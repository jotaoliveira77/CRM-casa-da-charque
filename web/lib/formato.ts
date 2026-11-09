import { DAY } from './constantes';

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const NUM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const PCT = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export const uid = () => Math.random().toString(36).slice(2, 10);

export const inicioDia = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const diasAtras = (t: number) => Math.floor((inicioDia(Date.now()) - inicioDia(t)) / DAY);
export const fmtData = (t: number | null | undefined) => (t ? new Date(t).toLocaleDateString('pt-BR') : '—');
export const relDias = (t: number | null | undefined) => {
  if (!t) return '—';
  const d = diasAtras(t);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
};
export const isoDia = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const parseDia = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};
export const fmtMil = (v: number) => (v >= 1000 ? `R$ ${NUM.format(v / 1000)} mil` : BRL0.format(v));
