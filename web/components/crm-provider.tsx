'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ErroApi, api } from '@/lib/api';
import type { Cliente, Db, Oportunidade, Usuario } from '@/lib/tipos';
import { OportunidadeDialog } from './oportunidade-dialog';
import { ClienteFormDialog } from './cliente-form-dialog';
import { ClienteDrawer } from './cliente-drawer';
import { Login } from './login';

type Dialogo =
  | { tipo: 'op'; op: Partial<Oportunidade>; key: number }
  | { tipo: 'cli'; cli: Partial<Cliente>; key: number }
  | null;

interface CrmCtx {
  db: Db;
  usuario: Usuario;
  isAdmin: boolean;
  /**
   * Executa uma chamada à API, recarrega os dados e mostra a mensagem de sucesso.
   * Em caso de erro mostra a mensagem do servidor e devolve false.
   */
  executar: <T>(acao: () => Promise<T>, sucesso?: string) => Promise<T | false>;
  toast: (msg: string) => void;
  sair: () => Promise<void>;
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

type Estado = { fase: 'carregando' } | { fase: 'login' } | { fase: 'erro'; msg: string } | { fase: 'pronto'; usuario: Usuario; db: Db };

export function CrmProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [drawerCli, setDrawerCli] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seq = useRef(0);
  const pathname = usePathname();

  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setMsg(null), 2800);
  }, []);

  const iniciar = useCallback(async () => {
    try {
      // Confere a sessão antes de pedir os dados, para não disparar várias requisições 401 sem login.
      const usuario = await api.eu();
      const db = await api.tudo();
      setEstado({ fase: 'pronto', usuario, db });
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) setEstado({ fase: 'login' });
      else setEstado({ fase: 'erro', msg: e instanceof Error ? e.message : 'Erro ao carregar os dados.' });
    }
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);
  useEffect(() => {
    document.getElementById('main')?.scrollTo(0, 0);
  }, [pathname]);

  const executar = useCallback(
    async <T,>(acao: () => Promise<T>, sucesso?: string): Promise<T | false> => {
      try {
        const r = await acao();
        const db = await api.tudo();
        setEstado(s => (s.fase === 'pronto' ? { ...s, db } : s));
        if (sucesso) toast(sucesso);
        return r;
      } catch (e) {
        if (e instanceof ErroApi && e.status === 401) {
          setEstado({ fase: 'login' });
          toast('Sua sessão expirou. Entre de novo.');
        } else {
          toast(e instanceof Error ? e.message : 'Não foi possível salvar.');
        }
        return false;
      }
    },
    [toast],
  );

  const sair = useCallback(async () => {
    await api.logout().catch(() => {});
    setDialogo(null);
    setDrawerCli(null);
    setEstado({ fase: 'login' });
  }, []);

  if (estado.fase === 'carregando') return <div className="carregando">Carregando…</div>;
  if (estado.fase === 'erro')
    return (
      <div className="carregando">
        <p>{estado.msg}</p>
        <button className="btn" onClick={() => { setEstado({ fase: 'carregando' }); iniciar(); }}>Tentar de novo</button>
      </div>
    );
  if (estado.fase === 'login')
    return (
      <>
        <Login onEntrar={() => { setEstado({ fase: 'carregando' }); iniciar(); }} />
        <div className="toast" role="status" hidden={!msg}>{msg}</div>
      </>
    );

  const { db, usuario } = estado;
  const ctx: CrmCtx = {
    db,
    usuario,
    isAdmin: usuario.papel === 'ADMIN',
    executar,
    toast,
    sair,
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
