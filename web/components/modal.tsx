'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** <dialog> nativo controlado pelo React: abre com showModal(), fecha com Esc ou clique fora. */
export function Modal({
  open,
  onClose,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      onClose={() => open && onClose()}
      onClick={e => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}

export function DlgHead({ eyebrow, titulo, onClose, children }: { eyebrow: ReactNode; titulo: ReactNode; onClose: () => void; children?: ReactNode }) {
  return (
    <header className="dlg-head">
      <div style={{ minWidth: 0 }}>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{titulo}</h2>
        {children}
      </div>
      <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
        ×
      </button>
    </header>
  );
}

/** Botão de ação destrutiva: o primeiro clique arma, o segundo (em até 4 s) confirma. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = 'btn danger',
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armado, setArmado] = useState(false);
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);
  return (
    <button
      type="button"
      className={className}
      data-armed={armado ? '' : undefined}
      onClick={() => (armado ? (setArmado(false), onConfirm()) : setArmado(true))}
    >
      {armado ? confirmLabel : label}
    </button>
  );
}
