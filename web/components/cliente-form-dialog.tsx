'use client';

import { useState, type FormEvent } from 'react';
import { TIPOS } from '@/lib/constantes';
import { api } from '@/lib/api';
import { nomeUsuario, responsaveis } from '@/lib/calculos';
import type { Cliente, DadosCliente } from '@/lib/tipos';
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
  const { db, usuario, executar, fecharDialogo, fecharDrawer, abrirCli } = useCrm();
  const [salvando, setSalvando] = useState(false);
  const novo = !c.id;
  const resps = responsaveis(db);

  async function salvarCli(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const dados: DadosCliente = {
      nome: fd.nome,
      doc: fd.doc ?? '',
      tipo: fd.tipo,
      tel: fd.tel ?? '',
      whatsapp: fd.whatsapp ?? '',
      email: fd.email ?? '',
      cidade: fd.cidade ?? '',
      uf: (fd.uf || '').toUpperCase(),
      responsavelId: fd.responsavelId || null,
      obs: fd.obs ?? '',
    };
    setSalvando(true);
    const salvo = await executar(() => (c.id ? api.salvarCliente(c.id, dados) : api.criarCliente(dados)), 'Cliente salvo.');
    setSalvando(false);
    if (salvo === false) return;
    fecharDialogo();
    if (novo) abrirCli(salvo.id);
  }

  async function excluir() {
    const ok = await executar(() => api.excluirCliente(c.id!), 'Cliente excluído.');
    if (ok === false) return;
    fecharDialogo();
    fecharDrawer();
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
            <input name="uf" maxLength={2} minLength={2} required defaultValue={c.uf ?? 'PE'} />
          </label>
          <label className="fld span2">
            <span>Responsável comercial</span>
            <select name="responsavelId" defaultValue={novo ? (c.responsavelId ?? usuario.id) : (c.responsavelId ?? '')}>
              <option value="">Sem responsável</option>
              {resps.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
              {c.responsavelId && !resps.some(r => r.id === c.responsavelId) && (
                <option value={c.responsavelId}>{nomeUsuario(db, c.responsavelId)} (inativo)</option>
              )}
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
        <button className="btn primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
      </footer>
    </form>
  );
}
