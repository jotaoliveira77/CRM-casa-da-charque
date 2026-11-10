'use client';

import type { FormEvent } from 'react';
import { TIPOS } from '@/lib/constantes';
import { uid } from '@/lib/formato';
import type { Cliente } from '@/lib/tipos';
import { useCrm } from './crm-provider';
import { ConfirmButton, DlgHead, Modal } from './modal';

export function ClienteFormDialog({ cli }: { cli: Partial<Cliente> | null }) {
  const { fecharDialogo } = useCrm();
  return (
    <Modal open={!!cli} onClose={fecharDialogo}>
      {cli && <FormCliente c={cli} />}
    </Modal>
  );
}

function FormCliente({ c }: { c: Partial<Cliente> }) {
  const { db, alterar, toast, fecharDialogo, fecharDrawer, abrirCli } = useCrm();
  const novo = !c.id;
  const resps = db.config.responsaveis;

  function salvarCli(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    fd.uf = (fd.uf || '').toUpperCase();
    const id = c.id ?? uid();
    alterar(d => {
      let alvo = d.clientes.find(x => x.id === id);
      if (!alvo) {
        alvo = { id, criadoEm: Date.now() } as Cliente;
        d.clientes.push(alvo);
      }
      Object.assign(alvo, fd);
    });
    fecharDialogo();
    toast('Cliente salvo.');
    if (novo) abrirCli(id);
  }

  function excluir() {
    alterar(d => {
      d.clientes = d.clientes.filter(x => x.id !== c.id);
      d.oportunidades = d.oportunidades.filter(o => o.clienteId !== c.id);
      d.interacoes = d.interacoes.filter(i => i.clienteId !== c.id);
    });
    fecharDialogo();
    fecharDrawer();
    toast('Cliente excluído.');
  }

  return (
    <form className="dlg" onSubmit={salvarCli}>
      <DlgHead eyebrow={`${novo ? 'Novo' : 'Editar'} cliente`} titulo={novo ? 'Cadastrar cliente' : c.nome} onClose={fecharDialogo} />
      <div className="dlg-body">
        <div className="grid2">
          <label className="fld span2">
            <span>Nome / razão social</span>
            <input name="nome" required defaultValue={c.nome ?? ''} />
          </label>
          <label className="fld">
            <span>CPF / CNPJ</span>
            <input name="doc" defaultValue={c.doc ?? ''} inputMode="numeric" />
          </label>
          <label className="fld">
            <span>Tipo de cliente</span>
            <select name="tipo" defaultValue={c.tipo && TIPOS.includes(c.tipo) ? c.tipo : TIPOS[0]}>
              {TIPOS.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="fld">
            <span>Telefone</span>
            <input name="tel" defaultValue={c.tel ?? ''} inputMode="tel" placeholder="(81) 9…" />
          </label>
          <label className="fld">
            <span>WhatsApp</span>
            <input name="whatsapp" defaultValue={c.whatsapp ?? ''} inputMode="tel" />
          </label>
          <label className="fld span2">
            <span>E-mail</span>
            <input name="email" type="email" defaultValue={c.email ?? ''} />
          </label>
          <label className="fld">
            <span>Cidade</span>
            <input name="cidade" defaultValue={c.cidade ?? 'Recife'} />
          </label>
          <label className="fld">
            <span>UF</span>
            <input name="uf" maxLength={2} defaultValue={c.uf ?? 'PE'} />
          </label>
          <label className="fld span2">
            <span>Responsável comercial</span>
            <select name="responsavel" defaultValue={c.responsavel && resps.includes(c.responsavel) ? c.responsavel : resps[0]}>
              {resps.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="fld span2">
            <span>Observações e preferências</span>
            <textarea name="obs" defaultValue={c.obs ?? ''} placeholder="Ex.: prefere entrega cedo, paga no PIX, gosta de charque mais magra" />
          </label>
        </div>
      </div>
      <footer className="dlg-foot">
        {!novo && <ConfirmButton label="Excluir cliente" confirmLabel="Excluir cliente e histórico" onConfirm={excluir} />}
        <span className="grow" />
        <button type="button" className="btn ghost" onClick={fecharDialogo}>
          Cancelar
        </button>
        <button className="btn primary">Salvar</button>
      </footer>
    </form>
  );
}
