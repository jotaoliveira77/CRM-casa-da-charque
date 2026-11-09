'use client';

import { passoBonito, somaVendas } from '@/lib/calculos';
import { BRL, fmtMil } from '@/lib/formato';
import { useCrm } from './crm-provider';

/** Barras das vendas dos últimos 6 meses com a linha tracejada da meta. */
export function GraficoMensal({ meta }: { meta: number }) {
  const { db } = useCrm();
  const d = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const s = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const e = new Date(d.getFullYear(), d.getMonth() - i + 1, 1);
    meses.push({
      rot: s.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      v: somaVendas(db, s.getTime(), e.getTime()),
      atual: i === 0,
    });
  }
  const W = 560, H = 210, pl = 64, pr = 8, pt = 18, pb = 26;
  const max = Math.max(meta, ...meses.map(m => m.v), 1);
  const step = passoBonito(max / 4);
  const top = Math.ceil(max / step) * step;
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  const bw = (W - pl - pr) / meses.length;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-6; v += step) ticks.push(v);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Vendas dos últimos 6 meses">
      {ticks.map(v => (
        <g key={v}>
          <line className="grid" x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} />
          <text className="tick" x={pl - 8} y={y(v) + 4} textAnchor="end">{fmtMil(v)}</text>
        </g>
      ))}
      {meses.map((m, i) => {
        const x = pl + i * bw + bw * 0.2, w = bw * 0.6;
        return (
          <g key={i}>
            <rect className={`bar ${m.atual ? 'now' : ''}`} x={x} y={y(m.v)} width={w} height={Math.max(0, y(0) - y(m.v))} rx={3}>
              <title>{`${m.rot}: ${BRL.format(m.v)}`}</title>
            </rect>
            <text className="tick" x={x + w / 2} y={H - 8} textAnchor="middle">{m.rot}</text>
          </g>
        );
      })}
      {meta > 0 && <line className="meta" x1={pl} x2={W - pr} y1={y(meta)} y2={y(meta)} />}
    </svg>
  );
}
