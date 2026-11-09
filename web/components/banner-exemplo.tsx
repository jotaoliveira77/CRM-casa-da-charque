'use client';

import Link from 'next/link';
import { useCrm } from './crm-provider';

export function BannerExemplo() {
  const { db } = useCrm();
  if (!db.exemplo) return null;
  return (
    <div className="banner">
      <span>
        <strong>Dados de exemplo.</strong> Clientes e vendas fictícios para demonstrar o sistema. Quando for usar de verdade, apague tudo em Ajustes.
      </span>
      <Link className="btn sm" href="/ajustes">
        Ir para Ajustes
      </Link>
    </div>
  );
}
