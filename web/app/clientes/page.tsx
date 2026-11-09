'use client';

import { useState } from 'react';
import { useCrm } from '@/components/crm-provider';
import { BannerExemplo } from '@/components/banner-exemplo';
import { SITUACOES, TIPOS } from '@/lib/constantes';
import { comprasCliente, somaValor, statusCliente, ultimoContato } from '@/lib/calculos';
import { BRL0, relDias } from '@/lib/formato';

export default function ClientesPage() {
  const { db, abrirCli, abrirFormCli } = useCrm();
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [situacao, setSituacao] = useState('');

  const q = busca.toLowerCase();
  const linhas = db.clientes
    .map(c => {
      const compras = comprasCliente(db, c.id);
      return { c, compras, total: somaValor(compras), st: statusCliente(db, c.id), ult: ultimoContato(db, c.id) };
    })
    .filter(
      x =>
        (!q || [x.c.nome, x.c.doc, x.c.cidade, x.c.tel].join(' ').toLowerCase().includes(q)) &&
        (!tipo || x.c.tipo === tipo) &&
        (!situacao || x.st.rot === situacao),
    )
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <BannerExemplo />
      <div className="view-head">
        <div>
          <div className="eyebrow">Clientes e parceiros</div>
          <h1>{db.clientes.length} clientes cadastrados</h1>
        </div>
        <div className="toolbar">
          <input className="input" type="search" placeholder="Nome, CPF/CNPJ, cidade…" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar clientes" />
          <select className="input" value={tipo} onChange={e => setTipo(e.target.value)} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input" value={situacao} onChange={e => setSituacao(e.target.value)} aria-label="Situação">
            <option value="">Todas as situações</option>
            {SITUACOES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn primary" onClick={() => abrirFormCli({ responsavel: db.config.responsaveis[0] })}>
            + Novo cliente
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th><th>Tipo</th><th>Cidade/UF</th><th>Responsável</th><th>Último contato</th>
              <th className="num">Pedidos</th><th className="num">Total comprado</th><th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length ? (
              linhas.map(x => (
                <tr className="clickable" key={x.c.id} onClick={() => abrirCli(x.c.id)}>
                  <td>
                    <strong>{x.c.nome}</strong>
                    <span className="sub mono">{x.c.doc}</span>
                  </td>
                  <td>{x.c.tipo}</td>
                  <td>{x.c.cidade}/{x.c.uf}</td>
                  <td>{x.c.responsavel}</td>
                  <td>{relDias(x.ult)}</td>
                  <td className="num">{x.compras.length}</td>
                  <td className="num">{BRL0.format(x.total)}</td>
                  <td><span className={`chip ${x.st.cls}`}>{x.st.rot}</span></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="empty">Nenhum cliente encontrado com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
