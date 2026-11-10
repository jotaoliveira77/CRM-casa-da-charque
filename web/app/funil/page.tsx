'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { useCrm } from '@/components/crm-provider';
import { BannerExemplo } from '@/components/banner-exemplo';
import { ABERTAS, ETAPAS, ORIGENS, etapa } from '@/lib/constantes';
import { api } from '@/lib/api';
import { atrasada, cliente, kgOp, nomeUsuario, porPrazo, responsaveis, somaValor, valorOp } from '@/lib/calculos';
import { BRL0, NUM, diasAtras, fmtData, parseDia } from '@/lib/formato';
import type { EtapaId } from '@/lib/tipos';

export default function FunilPage() {
  const { db, usuario, executar, abrirOp } = useCrm();
  const [busca, setBusca] = useState('');
  const [resp, setResp] = useState('');
  const [colOver, setColOver] = useState<EtapaId | null>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const arrastando = useRef<string | null>(null);

  const q = busca.toLowerCase();
  const ops = db.oportunidades.filter(
    o => (!resp || o.responsavelId === resp) && (!q || `${cliente(db, o.clienteId)?.nome} ${o.titulo}`.toLowerCase().includes(q)),
  );
  const pipeline = somaValor(ops.filter(o => ABERTAS.includes(o.etapa)));

  async function soltar(destino: EtapaId) {
    const id = arrastando.current;
    arrastando.current = null;
    setArrastandoId(null);
    setColOver(null);
    const o = db.oportunidades.find(x => x.id === id);
    if (!o || o.etapa === destino) return;
    const ok = await executar(() => api.moverOportunidade(o.id, destino), `Movida para “${etapa(destino).nome}”.`);
    // Venda perdida sem motivo: abre o formulário para registrar o motivo.
    if (ok !== false && destino === 'perdida' && !o.motivoPerda) abrirOp({ ...o, etapa: destino });
  }

  return (
    <>
      <BannerExemplo />
      <div className="view-head">
        <div>
          <div className="eyebrow">Funil de vendas</div>
          <h1>{BRL0.format(pipeline)} em negociação</h1>
          <p>Arraste os cartões entre as etapas ou clique para editar.</p>
        </div>
        <div className="toolbar">
          <input className="input" type="search" placeholder="Buscar cliente…" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar no funil" />
          <select className="input" value={resp} onChange={e => setResp(e.target.value)} aria-label="Responsável">
            <option value="">Todos os vendedores</option>
            {responsaveis(db).map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          <button
            className="btn primary"
            onClick={() => abrirOp({ etapa: 'novo', responsavelId: resp || usuario.id, origem: ORIGENS[0], itens: [] })}
          >
            + Nova oportunidade
          </button>
        </div>
      </div>

      <div className="board-wrap">
        <div className="board">
          {ETAPAS.map(e => {
            const fechada = e.id === 'ganha' || e.id === 'perdida';
            const lista = ops
              .filter(o => o.etapa === e.id && (!fechada || diasAtras(o.fechadoEm!) <= 30))
              .sort(porPrazo);
            return (
              <div
                key={e.id}
                className={`col ${colOver === e.id ? 'over' : ''}`}
                style={{ '--stage': e.cor } as CSSProperties}
                onDragOver={ev => {
                  if (!arrastando.current) return;
                  ev.preventDefault();
                  if (colOver !== e.id) setColOver(e.id);
                }}
                onDrop={ev => {
                  if (!arrastando.current) return;
                  ev.preventDefault();
                  soltar(e.id);
                }}
              >
                <div className="col-head">
                  <div className="row">
                    <h3>{e.nome}</h3>
                    <span className="count">{lista.length}</span>
                  </div>
                  <span className="sum">
                    {BRL0.format(somaValor(lista))}
                    {fechada ? ' · últimos 30 dias' : ''}
                  </span>
                </div>
                <div className="col-body">
                  {lista.map(o => {
                    const aberta = ABERTAS.includes(o.etapa);
                    const atraso = atrasada(o);
                    const nome = cliente(db, o.clienteId)?.nome || 'Cliente removido';
                    return (
                      <div
                        key={o.id}
                        className={`card ${arrastandoId === o.id ? 'dragging' : ''}`}
                        draggable
                        tabIndex={0}
                        role="button"
                        aria-label={nome}
                        onClick={() => abrirOp(o)}
                        onKeyDown={ev => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            abrirOp(o);
                          }
                        }}
                        onDragStart={ev => {
                          arrastando.current = o.id;
                          setArrastandoId(o.id);
                          ev.dataTransfer.effectAllowed = 'move';
                          ev.dataTransfer.setData('text/plain', o.id);
                        }}
                        onDragEnd={() => {
                          arrastando.current = null;
                          setArrastandoId(null);
                          setColOver(null);
                        }}
                      >
                        <span className="c-cli">{nome}</span>
                        <span className="c-tit">{o.titulo} · {NUM.format(kgOp(o))} kg</span>
                        <div className="c-row">
                          <span className="c-val">{BRL0.format(valorOp(o))}</span>
                          {aberta ? (
                            <span className={`chip ${atraso ? 'bad' : ''}`}>
                              {atraso ? 'Atrasado' : o.prazo ? fmtData(parseDia(o.prazo)).slice(0, 5) : 'sem prazo'}
                            </span>
                          ) : (
                            <span className="chip">{fmtData(o.fechadoEm).slice(0, 5)}</span>
                          )}
                        </div>
                        <div className="c-row muted">
                          <span>{nomeUsuario(db, o.responsavelId)}</span>
                          <span>{o.origem}</span>
                        </div>
                        {o.proximaAcao && aberta && <div className="c-next"><b>Próx.</b>{o.proximaAcao}</div>}
                        {o.etapa === 'perdida' && o.motivoPerda && <div className="c-next"><b>Motivo</b>{o.motivoPerda}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
