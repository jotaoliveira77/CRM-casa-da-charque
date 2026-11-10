'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCrm } from './crm-provider';

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ITENS = [
  { href: '/painel', rot: 'Painel', icone: <svg {...svg}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg> },
  { href: '/funil', rot: 'Funil de vendas', icone: <svg {...svg}><path d="M3 4h18l-7 8v6l-4 2v-8z" /></svg> },
  {
    href: '/clientes',
    rot: 'Clientes',
    icone: <svg {...svg}><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.6" /></svg>,
  },
  {
    href: '/ajustes',
    rot: 'Ajustes',
    icone: (
      <svg {...svg}>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
        <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, sair } = useCrm();
  return (
    <aside className="side">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo fixa e pequena, sem necessidade de otimização */}
        <img className="brand-logo" src="/logo-casa-da-charque.png" alt="Casa da Charque CEASA" width={440} height={250} />
        <div className="brand-sub">CRM comercial</div>
      </div>
      <nav className="nav" aria-label="Seções">
        {ITENS.map(i => (
          <Link key={i.href} href={i.href} aria-current={pathname.startsWith(i.href) ? 'page' : undefined}>
            {i.icone}
            {i.rot}
          </Link>
        ))}
      </nav>
      <div className="side-user">
        <span className="nome">{usuario.nome}</span>
        <span className="papel">{usuario.papel === 'ADMIN' ? 'Gerência' : 'Vendedor'}</span>
        <button type="button" onClick={sair}>Sair</button>
      </div>
      <div className="side-foot">
        Projeto de Intervenção · Grupo 10
        <br />
        UNINASSAU Graças · v1
      </div>
    </aside>
  );
}
