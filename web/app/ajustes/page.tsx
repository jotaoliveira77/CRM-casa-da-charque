'use client';

import { useRef, useState } from 'react';
import { useCrm } from '@/components/crm-provider';
import { ConfirmButton } from '@/components/modal';
import { lerCopia } from '@/lib/armazenamento';
import { gerarExemplo } from '@/lib/exemplo';
import { uid } from '@/lib/formato';
import type { Config } from '@/lib/tipos';

export default function AjustesPage() {
  const { db } = useCrm();
  // Remonta os formulários quando a configuração muda (salvar, restaurar cópia, recarregar exemplo).
  return <Ajustes key={JSON.stringify(db.config)} config={db.config} />;
}

function Ajustes({ config }: { config: Config }) {
  const { db, alterar, substituir, toast } = useCrm();
  const [meta, setMeta] = useState(String(config.metaMensal));
  const [resps, setResps] = useState(config.responsaveis.join('\n'));
  const [prods, setProds] = useState(() => config.produtos.map(p => ({ ...p, precoKg: String(p.precoKg) })));
  const [backup, setBackup] = useState('');
  const backupRef = useRef<HTMLTextAreaElement>(null);
  const ultimoNome = useRef<HTMLInputElement>(null);

  function salvarCfg() {
    const rs = resps.split('\n').map(s => s.trim()).filter(Boolean);
    alterar(d => {
      d.config.metaMensal = Math.max(0, +meta || 0);
      if (rs.length) d.config.responsaveis = rs;
    });
    toast('Meta e vendedores salvos.');
  }

  function salvarProds() {
    alterar(d => {
      d.config.produtos = prods.map(p => ({ id: p.id, nome: p.nome.trim(), precoKg: +p.precoKg || 0 })).filter(p => p.nome);
    });
    toast('Produtos salvos.');
  }

  function addProd() {
    setProds(l => [...l, { id: 'p' + uid(), nome: '', precoKg: '' }]);
    setTimeout(() => ultimoNome.current?.focus());
  }

  function exportar() {
    setBackup(JSON.stringify(db));
    setTimeout(() => backupRef.current?.select());
    toast('Cópia gerada. Copie o texto e guarde num arquivo.');
  }

  function importar() {
    const novo = lerCopia(backup);
    if (!novo) {
      toast('Esse texto não é uma cópia válida do CRM. Gere uma nova cópia e cole o texto inteiro.');
      return;
    }
    substituir(novo);
    toast('Dados restaurados da cópia.');
  }

  return (
    <>
      <div className="view-head">
        <div>
          <div className="eyebrow">Ajustes</div>
          <h1>Configurações do CRM</h1>
        </div>
      </div>
      <div className="settings">
        <section className="panel">
          <h2>Meta comercial</h2>
          <label className="fld">
            <span>Meta de vendas por mês (R$)</span>
            <input type="number" min="0" step="500" value={meta} onChange={e => setMeta(e.target.value)} />
          </label>
          <h2 style={{ marginTop: 6 }}>Vendedores</h2>
          <label className="fld">
            <span>Um nome por linha</span>
            <textarea value={resps} onChange={e => setResps(e.target.value)} />
          </label>
          <div><button className="btn primary" onClick={salvarCfg}>Salvar meta e vendedores</button></div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Produtos e preço por quilo</h2>
            <button className="btn sm" onClick={addProd}>+ Produto</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prods.map((p, i) => (
              <div className="prod-row" key={p.id}>
                <input
                  ref={i === prods.length - 1 ? ultimoNome : undefined}
                  value={p.nome}
                  aria-label="Nome do produto"
                  onChange={e => setProds(l => l.map(x => (x.id === p.id ? { ...x, nome: e.target.value } : x)))}
                />
                <input
                  className="num"
                  type="number"
                  step="0.01"
                  min="0"
                  value={p.precoKg}
                  aria-label="Preço por kg"
                  onChange={e => setProds(l => l.map(x => (x.id === p.id ? { ...x, precoKg: e.target.value } : x)))}
                />
                <button className="icon-btn" aria-label="Remover produto" onClick={() => setProds(l => l.filter(x => x.id !== p.id))}>×</button>
              </div>
            ))}
          </div>
          <div><button className="btn primary" onClick={salvarProds}>Salvar produtos</button></div>
        </section>

        <section className="panel">
          <h2>Cópia de segurança</h2>
          <p className="muted" style={{ margin: 0 }}>
            Os dados ficam guardados neste navegador. Gere uma cópia e guarde o texto num arquivo para não perder nada, ou cole uma cópia anterior para restaurar.
          </p>
          <textarea
            ref={backupRef}
            className="code"
            spellCheck={false}
            placeholder="Clique em “Gerar cópia” ou cole aqui uma cópia salva"
            value={backup}
            onChange={e => setBackup(e.target.value)}
          />
          <div className="toolbar">
            <button className="btn" onClick={exportar}>Gerar cópia</button>
            <button className="btn" onClick={importar}>Restaurar desta cópia</button>
          </div>
        </section>

        <section className="panel">
          <h2>Dados</h2>
          <p className="muted" style={{ margin: 0 }}>
            Apague os clientes e vendas de exemplo para começar a usar com dados reais. Produtos, meta e vendedores são mantidos.
          </p>
          <div className="toolbar">
            <ConfirmButton
              label="Apagar dados e começar do zero"
              confirmLabel="Confirmar: apagar tudo"
              onConfirm={() => {
                substituir({ versao: 1, exemplo: false, clientes: [], oportunidades: [], interacoes: [], config: db.config });
                toast('Dados apagados. Cadastre o primeiro cliente.');
              }}
            />
            <ConfirmButton
              className="btn"
              label="Recarregar exemplo"
              confirmLabel="Confirmar: substituir pelos exemplos"
              onConfirm={() => {
                substituir(gerarExemplo());
                toast('Dados de exemplo recarregados.');
              }}
            />
          </div>
        </section>
      </div>
    </>
  );
}
