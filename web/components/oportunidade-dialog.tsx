'use client';

import { useState, type FormEvent } from 'react';
import { ETAPAS, ORIGENS } from '@/lib/constantes';
import { ajustaFechamento, cliente, produto } from '@/lib/calculos';
import { BRL, uid } from '@/lib/formato';
import type { EtapaId, Oportunidade } from '@/lib/tipos';
import { useCrm } from './crm-provider';
import { ConfirmButton, DlgHead, Modal } from './modal';

interface LinhaItem {
  key: string;
  produtoId: string;
  kg: string;
  precoKg: string;
}

const noLista = (lista: string[], v: string | undefined) => (v && lista.includes(v) ? v : lista[0] ?? '');

export function OportunidadeDialog({ op }: { op: Partial<Oportunidade> | null }) {
  const { fecharDialogo } = useCrm();
  return (
    <Modal open={!!op} onClose={fecharDialogo}>
      {op && <FormOportunidade o={op} />}
    </Modal>
  );
}

function FormOportunidade({ o }: { o: Partial<Oportunidade> }) {
  const { db, alterar, toast, fecharDialogo } = useCrm();
  const novo = !o.id;
  const prods = db.config.produtos;
  const linha = (i: Partial<{ produtoId: string; kg: number; precoKg: number }> = {}): LinhaItem => {
    const pid = i.produtoId || prods[0]?.id || '';
    return { key: uid(), produtoId: pid, kg: i.kg != null ? String(i.kg) : '', precoKg: String(i.precoKg ?? produto(db, pid)?.precoKg ?? '') };
  };
  const [etapaSel, setEtapaSel] = useState<EtapaId>(o.etapa || 'novo');
  const [itens, setItens] = useState<LinhaItem[]>(() => (o.itens?.length ? o.itens : [{}]).map(linha));
  const total = itens.reduce((a, i) => a + (+i.kg || 0) * (+i.precoKg || 0), 0);
  const origens = [...ORIGENS, 'Recompra'];

  const mudaItem = (key: string, patch: Partial<LinhaItem>) =>
    setItens(lst => lst.map(i => (i.key === key ? { ...i, ...patch } : i)));

  function salvarOp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!fd.clienteId) {
      toast('Escolha o cliente antes de salvar.');
      return;
    }
    const lista = itens
      .map(i => ({ produtoId: i.produtoId, kg: +i.kg || 0, precoKg: +i.precoKg || 0 }))
      .filter(i => i.kg > 0);
    alterar(d => {
      let alvo = d.oportunidades.find(x => x.id === o.id);
      if (!alvo) {
        alvo = { id: uid(), criadoEm: Date.now(), fechadoEm: null } as Oportunidade;
        d.oportunidades.push(alvo);
      }
      const antes = alvo.etapa;
      Object.assign(alvo, {
        clienteId: fd.clienteId,
        titulo: fd.titulo || 'Oportunidade',
        etapa: etapaSel,
        responsavel: fd.responsavel ?? '',
        origem: fd.origem ?? '',
        prazo: fd.prazo ?? '',
        proximaAcao: fd.proximaAcao ?? '',
        motivoPerda: fd.motivoPerda ?? alvo.motivoPerda ?? '',
        obs: fd.obs ?? '',
        itens: lista,
      });
      ajustaFechamento(alvo, antes);
    });
    fecharDialogo();
    toast('Oportunidade salva.');
  }

  function excluir() {
    alterar(d => {
      d.oportunidades = d.oportunidades.filter(x => x.id !== o.id);
    });
    fecharDialogo();
    toast('Oportunidade excluída.');
  }

  const clientesOrdenados = [...db.clientes].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <form className="dlg" onSubmit={salvarOp}>
      <DlgHead
        eyebrow={`${novo ? 'Nova' : 'Editar'} oportunidade`}
        titulo={novo ? 'Registrar oportunidade' : cliente(db, o.clienteId!)?.nome}
        onClose={fecharDialogo}
      />
      <div className="dlg-body">
        <div className="grid2">
          <label className="fld span2">
            <span>Cliente</span>
            <select name="clienteId" required defaultValue={o.clienteId ?? ''}>
              {!o.clienteId && <option value="">Escolha o cliente…</option>}
              {clientesOrdenados.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="fld span2">
            <span>Descrição</span>
            <input name="titulo" defaultValue={o.titulo ?? ''} placeholder="Ex.: Reposição semanal" />
          </label>
          <label className="fld">
            <span>Etapa</span>
            <select name="etapa" value={etapaSel} onChange={e => setEtapaSel(e.target.value as EtapaId)}>
              {ETAPAS.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="fld">
            <span>Responsável</span>
            <select name="responsavel" defaultValue={noLista(db.config.responsaveis, o.responsavel)}>
              {db.config.responsaveis.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="fld">
            <span>Origem do cliente</span>
            <select name="origem" defaultValue={noLista(origens, o.origem)}>
              {origens.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="fld">
            <span>Prazo</span>
            <input type="date" name="prazo" defaultValue={o.prazo ?? ''} />
          </label>
          <label className="fld span2">
            <span>Próxima ação</span>
            <input name="proximaAcao" defaultValue={o.proximaAcao ?? ''} placeholder="Ex.: Ligar na quinta para confirmar o pedido" />
          </label>
        </div>

        <fieldset className="itens">
          <legend>Produtos</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {itens.map(i => (
              <div className="item-row" key={i.key}>
                <select
                  aria-label="Produto"
                  value={i.produtoId}
                  onChange={e => {
                    const p = produto(db, e.target.value);
                    mudaItem(i.key, { produtoId: e.target.value, ...(p ? { precoKg: String(p.precoKg) } : {}) });
                  }}
                >
                  {prods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                  {i.produtoId && !produto(db, i.produtoId) && <option value={i.produtoId}>Produto removido</option>}
                </select>
                <input className="num" type="number" min="0" step="0.5" placeholder="0" aria-label="Quilos" value={i.kg} onChange={e => mudaItem(i.key, { kg: e.target.value })} />
                <span className="unit">kg</span>
                <input className="num" type="number" min="0" step="0.01" aria-label="Preço por kg" value={i.precoKg} onChange={e => mudaItem(i.key, { precoKg: e.target.value })} />
                <span className="unit">R$/kg</span>
                <button type="button" className="icon-btn" aria-label="Remover produto" onClick={() => setItens(lst => lst.filter(x => x.key !== i.key))}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <div>
            <button type="button" className="btn sm ghost" onClick={() => setItens(lst => [...lst, linha()])}>
              + Adicionar produto
            </button>
          </div>
        </fieldset>

        <div className="total-row">
          <span className="muted">Valor estimado</span>
          <strong>{BRL.format(total)}</strong>
        </div>
        {etapaSel === 'perdida' && (
          <label className="fld">
            <span>Motivo da perda</span>
            <input name="motivoPerda" defaultValue={o.motivoPerda ?? ''} />
          </label>
        )}
        <label className="fld">
          <span>Observações</span>
          <textarea name="obs" defaultValue={o.obs ?? ''} />
        </label>
      </div>
      <footer className="dlg-foot">
        {!novo && <ConfirmButton label="Excluir" confirmLabel="Confirmar exclusão" onConfirm={excluir} />}
        <span className="grow" />
        <button type="button" className="btn ghost" onClick={fecharDialogo}>
          Cancelar
        </button>
        <button className="btn primary">Salvar</button>
      </footer>
    </form>
  );
}
