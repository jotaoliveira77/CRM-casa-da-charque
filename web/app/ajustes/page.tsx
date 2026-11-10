'use client';

import { useState, type FormEvent } from 'react';
import { useCrm } from '@/components/crm-provider';
import { ConfirmButton } from '@/components/modal';
import { api } from '@/lib/api';
import { produtosAtivos } from '@/lib/calculos';
import { uid } from '@/lib/formato';
import type { Papel, Usuario } from '@/lib/tipos';

export default function AjustesPage() {
  const { db, isAdmin } = useCrm();
  return (
    <>
      <div className="view-head">
        <div>
          <div className="eyebrow">Ajustes</div>
          <h1>Configurações do CRM</h1>
          {!isAdmin && <p>Só a gerência altera meta, produtos, usuários e dados. Você pode baixar a cópia de segurança.</p>}
        </div>
      </div>
      <div className="settings">
        {/* Remonta os formulários quando os dados salvos mudam */}
        <Meta key={`meta-${db.config.metaMensal}`} />
        <Usuarios />
        <Produtos key={JSON.stringify(produtosAtivos(db))} />
        <Dados />
      </div>
    </>
  );
}

function Meta() {
  const { db, isAdmin, executar } = useCrm();
  const [meta, setMeta] = useState(String(db.config.metaMensal));
  return (
    <section className="panel">
      <h2>Meta comercial</h2>
      <label className="fld">
        <span>Meta de vendas por mês (R$)</span>
        <input type="number" min="0" step="500" value={meta} disabled={!isAdmin} onChange={e => setMeta(e.target.value)} />
      </label>
      {isAdmin && (
        <div>
          <button className="btn primary" onClick={() => executar(() => api.salvarMeta(Math.max(0, +meta || 0)), 'Meta salva.')}>
            Salvar meta
          </button>
        </div>
      )}
    </section>
  );
}

function Usuarios() {
  const { db, usuario, isAdmin, executar } = useCrm();
  const [novo, setNovo] = useState(false);

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await executar(
      () =>
        api.criarUsuario({
          nome: String(fd.get('nome')),
          email: String(fd.get('email')),
          senha: String(fd.get('senha')),
          papel: String(fd.get('papel')) as Papel,
        }),
      'Usuário criado. Passe o e-mail e a senha para a pessoa.',
    );
    if (ok !== false) setNovo(false);
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Vendedores e acessos</h2>
        {isAdmin && !novo && <button className="btn sm" onClick={() => setNovo(true)}>+ Usuário</button>}
      </div>
      {novo && (
        <form className="grid2" onSubmit={criar}>
          <label className="fld span2"><span>Nome</span><input name="nome" required autoFocus /></label>
          <label className="fld span2"><span>E-mail</span><input name="email" type="email" required /></label>
          <label className="fld"><span>Senha inicial</span><input name="senha" type="password" minLength={6} required autoComplete="new-password" /></label>
          <label className="fld">
            <span>Acesso</span>
            <select name="papel" defaultValue="VENDEDOR">
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Gerência</option>
            </select>
          </label>
          <div className="toolbar span2">
            <button className="btn primary">Criar usuário</button>
            <button type="button" className="btn ghost" onClick={() => setNovo(false)}>Cancelar</button>
          </div>
        </form>
      )}
      <div className="list">
        {db.usuarios.map(u => (
          <LinhaUsuario key={u.id} u={u} eu={u.id === usuario.id} podeEditar={isAdmin} executar={executar} />
        ))}
      </div>
    </section>
  );
}

function LinhaUsuario({
  u, eu, podeEditar, executar,
}: { u: Usuario; eu: boolean; podeEditar: boolean; executar: ReturnType<typeof useCrm>['executar'] }) {
  const [senha, setSenha] = useState<string | null>(null);
  return (
    <div className="user-row">
      <div style={{ minWidth: 0 }}>
        <strong>{u.nome}</strong>{eu && <span className="muted"> (você)</span>}
        <div className="muted" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{u.email}</div>
      </div>
      <div className="toolbar">
        <span className={`chip ${u.papel === 'ADMIN' ? 'accent' : ''}`}>{u.papel === 'ADMIN' ? 'Gerência' : 'Vendedor'}</span>
        {!u.ativo && <span className="chip warn">Inativo</span>}
      </div>
      {podeEditar && (
        <div className="toolbar span2" style={{ gridColumn: '1 / -1' }}>
          {senha === null ? (
            <button className="btn sm ghost" onClick={() => setSenha('')}>Trocar senha</button>
          ) : (
            <>
              <input className="input" type="password" placeholder="Nova senha" minLength={6} value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" aria-label={`Nova senha de ${u.nome}`} />
              <button className="btn sm" onClick={async () => { if ((await executar(() => api.alterarUsuario(u.id, { senha }), 'Senha alterada.')) !== false) setSenha(null); }}>Salvar</button>
              <button className="btn sm ghost" onClick={() => setSenha(null)}>Cancelar</button>
            </>
          )}
          {!eu && (
            <>
              <button className="btn sm ghost" onClick={() => executar(() => api.alterarUsuario(u.id, { papel: u.papel === 'ADMIN' ? 'VENDEDOR' : 'ADMIN' }), 'Acesso alterado.')}>
                {u.papel === 'ADMIN' ? 'Tornar vendedor' : 'Tornar gerência'}
              </button>
              <button className="btn sm ghost" onClick={() => executar(() => api.alterarUsuario(u.id, { ativo: !u.ativo }), u.ativo ? 'Usuário desativado.' : 'Usuário reativado.')}>
                {u.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Produtos() {
  const { db, isAdmin, executar } = useCrm();
  const [prods, setProds] = useState(() =>
    produtosAtivos(db).map(p => ({ chave: p.id, id: p.id as string | undefined, nome: p.nome, precoKg: String(p.precoKg) })),
  );
  const muda = (chave: string, patch: Partial<{ nome: string; precoKg: string }>) =>
    setProds(l => l.map(x => (x.chave === chave ? { ...x, ...patch } : x)));

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Produtos e preço por quilo</h2>
        {isAdmin && <button className="btn sm" onClick={() => setProds(l => [...l, { chave: uid(), id: undefined, nome: '', precoKg: '' }])}>+ Produto</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {prods.map(p => (
          <div className="prod-row" key={p.chave}>
            <input value={p.nome} disabled={!isAdmin} aria-label="Nome do produto" autoFocus={!p.id} onChange={e => muda(p.chave, { nome: e.target.value })} />
            <input className="num" type="number" step="0.01" min="0" value={p.precoKg} disabled={!isAdmin} aria-label="Preço por kg" onChange={e => muda(p.chave, { precoKg: e.target.value })} />
            {isAdmin ? (
              <button className="icon-btn" aria-label="Remover produto" onClick={() => setProds(l => l.filter(x => x.chave !== p.chave))}>×</button>
            ) : <span />}
          </div>
        ))}
      </div>
      {isAdmin && (
        <>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>Produtos removidos saem do catálogo, mas continuam aparecendo nas vendas antigas.</p>
          <div>
            <button
              className="btn primary"
              onClick={() =>
                executar(
                  () => api.salvarProdutos(prods.filter(p => p.nome.trim()).map(p => ({ id: p.id, nome: p.nome.trim(), precoKg: +p.precoKg || 0 }))),
                  'Produtos salvos.',
                )
              }
            >
              Salvar produtos
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Dados() {
  const { isAdmin, executar } = useCrm();
  return (
    <section className="panel">
      <h2>Cópia de segurança e dados</h2>
      <p className="muted" style={{ margin: 0 }}>
        Os dados ficam no banco do servidor, compartilhados por toda a equipe. Baixe uma cópia em JSON de vez em quando para guardar fora do servidor.
      </p>
      <div className="toolbar">
        <a className="btn" href="/api/backup" download>Baixar cópia (JSON)</a>
      </div>
      {isAdmin && (
        <>
          <p className="muted" style={{ margin: 0 }}>
            Apague os clientes e vendas de exemplo para começar a usar com dados reais. Usuários, produtos e meta são mantidos.
          </p>
          <div className="toolbar">
            <ConfirmButton
              label="Apagar dados e começar do zero"
              confirmLabel="Confirmar: apagar tudo"
              onConfirm={() => executar(() => api.resetar('zerar'), 'Dados apagados. Cadastre o primeiro cliente.')}
            />
            <ConfirmButton
              className="btn"
              label="Recarregar exemplo"
              confirmLabel="Confirmar: substituir pelos exemplos"
              onConfirm={() => executar(() => api.resetar('exemplo'), 'Dados de exemplo recarregados.')}
            />
          </div>
        </>
      )}
    </section>
  );
}
