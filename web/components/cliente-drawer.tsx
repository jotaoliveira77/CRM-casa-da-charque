'use client';

import type { FormEvent } from 'react';
import { CANAIS, ORIGENS, etapa } from '@/lib/constantes';
import { abertasCliente, cliente, comprasCliente, produto, somaValor, statusCliente, ultimoContato, valorOp } from '@/lib/calculos';
import { BRL, BRL0, NUM, fmtData, relDias, uid } from '@/lib/formato';
import { useCrm } from './crm-provider';
import { DlgHead, Modal } from './modal';

export function ClienteDrawer({ id }: { id: string | null }) {
  const { fecharDrawer } = useCrm();
  return (
    <Modal open={!!id} onClose={fecharDrawer} className="drawer">
      {id && <FichaCliente id={id} />}
    </Modal>
  );
}

function FichaCliente({ id }: { id: string }) {
  const { db, alterar, toast, abrirOp, abrirFormCli, fecharDrawer } = useCrm();
  const c = cliente(db, id)!;
  const compras = comprasCliente(db, id);
  const abertas = abertasCliente(db, id);
  const total = somaValor(compras);
  const st = statusCliente(db, id);
  const ints = db.interacoes.filter(i => i.clienteId === id).sort((a, b) => b.data - a.data);
  const wpp = (c.whatsapp || '').replace(/\D/g, '');

  function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    alterar(d => {
      d.interacoes.push({ id: uid(), clienteId: id, data: Date.now(), canal: String(fd.get('canal')), nota: String(fd.get('nota')), responsavel: c.responsavel });
    });
    form.reset();
    toast('Contato registrado.');
  }

  return (
    <div className="dlg">
      <DlgHead eyebrow={`${c.tipo} · ${c.cidade}/${c.uf}`} titulo={c.nome} onClose={fecharDrawer}>
        <div style={{ marginTop: 6 }}>
          <span className={`chip ${st.cls}`}>{st.rot}</span>
        </div>
      </DlgHead>
      <div className="dlg-body">
        <div className="toolbar">
          <button className="btn primary sm" onClick={() => abrirOp({ clienteId: id, etapa: 'novo', responsavel: c.responsavel, origem: ORIGENS[0], itens: [] })}>
            + Nova oportunidade
          </button>
          <button className="btn sm" onClick={() => abrirFormCli(c)}>
            Editar cadastro
          </button>
        </div>
        <div className="stats">
          <div className="stat"><div className="v">{BRL0.format(total)}</div><div className="l">Total comprado</div></div>
          <div className="stat"><div className="v">{compras.length}</div><div className="l">Pedidos</div></div>
          <div className="stat"><div className="v">{compras.length ? BRL0.format(total / compras.length) : '—'}</div><div className="l">Ticket médio</div></div>
          <div className="stat"><div className="v">{compras.length ? relDias(compras[0].fechadoEm) : '—'}</div><div className="l">Última compra</div></div>
        </div>
        <dl className="facts">
          <div><dt>CPF / CNPJ</dt><dd className="mono">{c.doc || '—'}</dd></div>
          <div><dt>Responsável</dt><dd>{c.responsavel || '—'}</dd></div>
          <div><dt>Telefone</dt><dd>{c.tel || '—'}</dd></div>
          <div>
            <dt>WhatsApp</dt>
            <dd>
              {wpp ? (
                <>
                  {c.whatsapp} · <a href={`https://wa.me/55${wpp}`} target="_blank" rel="noopener">abrir conversa</a>
                </>
              ) : '—'}
            </dd>
          </div>
          <div><dt>E-mail</dt><dd>{c.email || '—'}</dd></div>
          <div><dt>Último contato</dt><dd>{relDias(ultimoContato(db, id))}</dd></div>
        </dl>

        {c.obs && (
          <section className="block">
            <h3>Observações e preferências</h3>
            <div className="note">{c.obs}</div>
          </section>
        )}

        <section className="block">
          <h3>Oportunidades em aberto</h3>
          {abertas.length ? (
            <div className="list">
              {abertas.map(o => (
                <div className="list-row" key={o.id}>
                  <div style={{ minWidth: 0 }}>
                    <button className="linkish t" onClick={() => abrirOp(o)}>{o.titulo}</button>
                    <div className="s">{etapa(o.etapa).nome}{o.proximaAcao ? ` · ${o.proximaAcao}` : ''}</div>
                  </div>
                  <span className="num"><strong>{BRL0.format(valorOp(o))}</strong></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty" style={{ margin: 0 }}>Nenhuma oportunidade em aberto.</p>
          )}
        </section>

        <section className="block">
          <h3>Histórico de compras</h3>
          {compras.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Data</th><th>Produtos</th><th className="num">Valor</th></tr></thead>
                <tbody>
                  {compras.map(o => (
                    <tr className="clickable" key={o.id} onClick={() => abrirOp(o)}>
                      <td className="num">{fmtData(o.fechadoEm)}</td>
                      <td>
                        {o.itens.map((i, k) => (
                          <div key={k}>{NUM.format(i.kg)} kg {produto(db, i.produtoId)?.nome || 'produto removido'}</div>
                        ))}
                      </td>
                      <td className="num">{BRL.format(valorOp(o))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty" style={{ margin: 0 }}>Ainda não comprou.</p>
          )}
        </section>

        <section className="block">
          <h3>Contatos e interações</h3>
          <form className="inline-form" onSubmit={registrar}>
            <select className="input" name="canal" aria-label="Canal">
              {CANAIS.map(cn => <option key={cn}>{cn}</option>)}
            </select>
            <input className="input" name="nota" placeholder="O que foi conversado?" required aria-label="Anotação" />
            <button className="btn">Registrar</button>
          </form>
          <div className="timeline">
            {ints.length ? ints.map(i => (
              <div className="tl-item" key={i.id}>
                <div className="when">{fmtData(i.data)}<br />{i.canal}</div>
                <div>{i.nota}<div className="muted" style={{ fontSize: 12 }}>{i.responsavel}</div></div>
              </div>
            )) : <p className="empty" style={{ margin: 0 }}>Nenhum contato registrado.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
