'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCrm } from '@/components/crm-provider';
import { BannerExemplo } from '@/components/banner-exemplo';
import { GraficoMensal } from '@/components/grafico-mensal';
import { ABERTAS, DAY, ORIGENS, etapa } from '@/lib/constantes';
import {
  PERIODOS, abertasCliente, atrasada, cliente, comprasCliente, periodo, porPrazo, produto,
  somaValor, somaVendas, vendas, vendasEntre, valorOp, type PeriodoId,
} from '@/lib/calculos';
import { BRL0, NUM, PCT, diasAtras, fmtData, isoDia, parseDia, relDias } from '@/lib/formato';

export default function PainelPage() {
  const { db, abrirOp, abrirCli } = useCrm();
  const [per, setPer] = useState<PeriodoId>('mes');
  const p = periodo(per);
  const vs = vendasEntre(db, p.s, p.e);
  const total = somaValor(vs);
  const ticket = vs.length ? total / vs.length : 0;
  const fechadas = db.oportunidades.filter(
    o => (o.etapa === 'ganha' || o.etapa === 'perdida') && o.fechadoEm != null && o.fechadoEm >= p.s && o.fechadoEm < p.e,
  );
  const conv = fechadas.length ? vs.length / fechadas.length : 0;
  const props = db.oportunidades.filter(o => o.etapa === 'proposta' || o.etapa === 'negociacao');
  const aguard = db.oportunidades.filter(o => o.etapa === 'aguardando');
  const todas = vendas(db);
  const compradores = [...new Set(vs.map(o => o.clienteId))];
  const novos = compradores.filter(id => !todas.some(o => o.clienteId === id && o.fechadoEm! < p.s)).length;
  const recorr = compradores.length - novos;

  // Meta do mês corrente
  const pm = periodo('mes');
  const noMes = somaVendas(db, pm.s, pm.e);
  const meta = +db.config.metaMensal || 0;
  const pctMeta = meta ? noMes / meta : 0;
  const hoje = new Date();
  const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const restantes = diasMes - hoje.getDate();
  const porDia = restantes > 0 ? Math.max(0, meta - noMes) / restantes : 0;

  // Produtos mais vendidos no período
  const prod: Record<string, { kg: number; rs: number }> = {};
  vs.forEach(o =>
    o.itens.forEach(i => {
      const k = (prod[i.produtoId] ??= { kg: 0, rs: 0 });
      k.kg += +i.kg || 0;
      k.rs += (+i.kg || 0) * (+i.precoKg || 0);
    }),
  );
  const ranking = Object.entries(prod).sort((a, b) => b[1].kg - a[1].kg).slice(0, 6);
  const maxKg = ranking[0]?.[1].kg || 1;

  const acoes = db.oportunidades.filter(o => ABERTAS.includes(o.etapa)).sort(porPrazo).slice(0, 6);
  // Recompra: já comprou, última compra há mais de 30 dias, sem oportunidade aberta
  const recompra = db.clientes
    .map(c => ({ c, compras: comprasCliente(db, c.id) }))
    .filter(x => x.compras.length && diasAtras(x.compras[0].fechadoEm!) > 30 && !abertasCliente(db, x.c.id).length)
    .sort((a, b) => a.compras[0].fechadoEm! - b.compras[0].fechadoEm!)
    .slice(0, 6);

  const novaOp = () => abrirOp({ etapa: 'novo', responsavel: db.config.responsaveis[0], origem: ORIGENS[0], itens: [] });

  return (
    <>
      <BannerExemplo />
      <div className="view-head">
        <div>
          <div className="eyebrow">Painel comercial</div>
          <h1>Vendas de {p.rot}</h1>
        </div>
        <div className="toolbar">
          <label className="muted" htmlFor="sel-periodo">Período</label>
          <select className="input" id="sel-periodo" value={per} onChange={e => setPer(e.target.value as PeriodoId)}>
            {PERIODOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <button className="btn primary" onClick={novaOp}>+ Nova oportunidade</button>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi lead">
          <span className="eyebrow">Vendas do período</span>
          <span className="val">{BRL0.format(total)}</span>
          <span className="sub">{vs.length} {vs.length === 1 ? 'pedido fechado' : 'pedidos fechados'}</span>
        </div>
        <div className="kpi">
          <span className="eyebrow">Ticket médio</span>
          <span className="val">{BRL0.format(ticket)}</span>
          <span className="sub">por pedido</span>
        </div>
        <div className="kpi">
          <span className="eyebrow">Taxa de conversão</span>
          <span className="val">{fechadas.length ? PCT.format(conv) : '—'}</span>
          <span className="sub">{vs.length} ganhas de {fechadas.length} encerradas</span>
        </div>
        <div className="kpi">
          <span className="eyebrow">Propostas abertas</span>
          <span className="val">{props.length}</span>
          <span className="sub">{BRL0.format(somaValor(props))} em proposta ou negociação</span>
        </div>
        <div className="kpi">
          <span className="eyebrow">Aguardando retorno</span>
          <span className="val">{aguard.length}</span>
          <span className="sub">{BRL0.format(somaValor(aguard))} aguardando decisão</span>
        </div>
        <div className="kpi">
          <span className="eyebrow">Novos × recorrentes</span>
          <span className="val">
            {novos} <span className="muted" style={{ fontWeight: 500 }}>×</span> {recorr}
          </span>
          <div className="split" aria-hidden="true">
            <i style={{ width: `${compradores.length ? (novos / compradores.length) * 100 : 0}%`, background: 'var(--accent)' }} />
            <i style={{ width: `${compradores.length ? (recorr / compradores.length) * 100 : 0}%`, background: 'var(--good)' }} />
          </div>
          <span className="sub">{compradores.length} clientes compraram</span>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Meta comercial do mês</h2>
            <Link className="btn sm ghost" href="/ajustes">Alterar meta</Link>
          </div>
          <div className="meta-line">
            <span>
              <strong className="num">{BRL0.format(noMes)}</strong> <span className="muted">de {BRL0.format(meta)}</span>
            </span>
            <span className={`chip ${pctMeta >= hoje.getDate() / diasMes ? 'good' : 'warn'}`}>{PCT.format(pctMeta)} da meta</span>
          </div>
          <div className="meta-bar" role="progressbar" aria-valuenow={Math.round(pctMeta * 100)} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${Math.min(100, pctMeta * 100)}%` }} />
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {pctMeta >= 1
              ? 'Meta batida.'
              : restantes > 0
                ? `Faltam ${BRL0.format(meta - noMes)} em ${restantes} dias: ${BRL0.format(porDia)} por dia.`
                : `Faltaram ${BRL0.format(meta - noMes)}.`}
          </p>
          <GraficoMensal meta={meta} />
          <div className="legend">
            <span><i className="sw" style={{ background: 'var(--accent)' }} />Mês atual</span>
            <span><i className="sw" style={{ background: 'var(--bar)' }} />Meses anteriores</span>
            <span><i className="sw dash" />Meta mensal</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Produtos mais vendidos</h2>
            <span className="muted" style={{ fontSize: 12 }}>por quilo, {p.rot}</span>
          </div>
          {ranking.length ? (
            <div className="hbars">
              {ranking.map(([pid, v]) => (
                <div className="hbar" key={pid}>
                  <span>{produto(db, pid)?.nome || 'Produto removido'}</span>
                  <span className="num">
                    <strong>{NUM.format(v.kg)} kg</strong> <span className="muted">· {BRL0.format(v.rs)}</span>
                  </span>
                  <span className="track"><i style={{ width: `${(v.kg / maxKg) * 100}%` }} /></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Nenhuma venda fechada neste período.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Próximas ações</h2>
            <Link className="btn sm ghost" href="/funil">Abrir funil</Link>
          </div>
          {acoes.length ? (
            <div className="list">
              {acoes.map(o => {
                const atraso = atrasada(o);
                return (
                  <div className="list-row" key={o.id}>
                    <div style={{ minWidth: 0 }}>
                      <button className="linkish t" onClick={() => abrirOp(o)}>{cliente(db, o.clienteId)?.nome}</button>
                      <div className="s">{o.proximaAcao || etapa(o.etapa).nome}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`chip ${atraso ? 'bad' : ''}`}>
                        {atraso ? 'Atrasado · ' : ''}
                        {o.prazo ? fmtData(parseDia(o.prazo)) : 'sem prazo'}
                      </span>
                      <div className="s num">{BRL0.format(valorOp(o))}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty">Nenhuma oportunidade em aberto.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Oportunidades de recompra</h2>
            <span className="muted" style={{ fontSize: 12 }}>sem compra há mais de 30 dias</span>
          </div>
          {recompra.length ? (
            <div className="list">
              {recompra.map(({ c, compras }) => (
                <div className="list-row" key={c.id}>
                  <div style={{ minWidth: 0 }}>
                    <button className="linkish t" onClick={() => abrirCli(c.id)}>{c.nome}</button>
                    <div className="s">
                      Última compra {relDias(compras[0].fechadoEm)} · {compras.length} {compras.length === 1 ? 'pedido' : 'pedidos'} no histórico
                    </div>
                  </div>
                  <button
                    className="btn sm"
                    onClick={() =>
                      abrirOp({
                        clienteId: c.id,
                        titulo: 'Recompra',
                        etapa: 'proposta',
                        responsavel: c.responsavel,
                        origem: 'Recompra',
                        prazo: isoDia(Date.now() + 3 * DAY),
                        proximaAcao: 'Oferecer repetição do último pedido',
                        itens: compras[0].itens.map(i => ({ ...i, precoKg: produto(db, i.produtoId)?.precoKg ?? i.precoKg })),
                      })
                    }
                  >
                    Criar oportunidade
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Todos os clientes ativos compraram nos últimos 30 dias.</p>
          )}
        </section>
      </div>
    </>
  );
}
