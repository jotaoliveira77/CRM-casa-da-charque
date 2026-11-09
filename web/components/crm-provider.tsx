'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { carregar, salvar } from '@/lib/armazenamento';
import { gerarExemplo } from '@/lib/exemplo';
import type { Cliente, Db, Oportunidade } from '@/lib/tipos';
import { OportunidadeDialog } from './oportunidade-dialog';
import { ClienteFormDialog } from './cliente-form-dialog';
import { ClienteDrawer } from './cliente-drawer';

type Dialogo =
  | { tipo: 'op'; op: Partial<Oportunidade>; key: number }
  | { tipo: 'cli'; cli: Partial<Cliente>; key: number }
  | null;

interface CrmCtx {
  db: Db;
  /** Aplica uma alteração numa cópia dos dados, salva no navegador e re-renderiza. */
  alterar: (fn: (d: Db) => void) => void;
  substituir: (db: Db) => void;
  toast: (msg: string) => void;
  abrirOp: (o: Partial<Oportunidade>) => void;
  abrirFormCli: (c?: Partial<Cliente>) => void;
  abrirCli: (id: string) => void;
  fecharDialogo: () => void;
  fecharDrawer: () => void;
}

const Ctx = createContext<CrmCtx | null>(null);

export function useCrm() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCrm precisa estar dentro de <CrmProvider>');
  return c;
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [drawerCli, setDrawerCli] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seq = useRef(0);
  const pathname = usePathname();

  // Os dados vivem no localStorage, então só existem no navegador: carrega depois de montar.
  useEffect(() => {
    setDb(carregar() ?? gerarExemplo());
  }, []);
  useEffect(() => {
    if (db) salvar(db);
  }, [db]);
  useEffect(() => {
    document.getElementById('main')?.scrollTo(0, 0);
  }, [pathname]);

  const alterar = useCallback((fn: (d: Db) => void) => {
    setDb(prev => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);
  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  if (!db) return <div className="carregando">Carregando…</div>;

  const ctx: CrmCtx = {
    db,
    alterar,
    substituir: setDb,
    toast,
    abrirOp: op => setDialogo({ tipo: 'op', op, key: ++seq.current }),
    abrirFormCli: (cli = {}) => setDialogo({ tipo: 'cli', cli, key: ++seq.current }),
    abrirCli: id => setDrawerCli(id),
    fecharDialogo: () => setDialogo(null),
    fecharDrawer: () => setDrawerCli(null),
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <ClienteDrawer id={drawerCli && db.clientes.some(c => c.id === drawerCli) ? drawerCli : null} />
      <OportunidadeDialog key={dialogo?.tipo === 'op' ? dialogo.key : 'op'} op={dialogo?.tipo === 'op' ? dialogo.op : null} />
      <ClienteFormDialog key={dialogo?.tipo === 'cli' ? dialogo.key : 'cli'} cli={dialogo?.tipo === 'cli' ? dialogo.cli : null} />
      <div className="toast" role="status" hidden={!msg}>
        {msg}
      </div>
    </Ctx.Provider>
  );
}
