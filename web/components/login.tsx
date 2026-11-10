'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

export function Login({ onEntrar }: { onEntrar: () => void }) {
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setEnviando(true);
    setErro('');
    try {
      await api.login(String(fd.get('email')), String(fd.get('senha')));
      onEntrar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
      setEnviando(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login" onSubmit={entrar}>
        <div className="brand login-brand">
          <div className="brand-mark" aria-hidden="true">CC</div>
          <div>
            <div className="brand-name">Casa da Charque</div>
            <div className="brand-sub">CRM · CEASA Recife</div>
          </div>
        </div>
        <div>
          <h1>Entrar</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Use o e-mail e a senha que a gerência cadastrou para você.</p>
        </div>
        <label className="fld">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="username" required autoFocus />
        </label>
        <label className="fld">
          <span>Senha</span>
          <input name="senha" type="password" autoComplete="current-password" required />
        </label>
        {erro && <p className="login-erro" role="alert">{erro}</p>}
        <button className="btn primary login-btn" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}
