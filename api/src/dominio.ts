import type { Etapa } from '@prisma/client';

export const ETAPAS = ['novo', 'qualificacao', 'necessidade', 'proposta', 'negociacao', 'aguardando', 'ganha', 'perdida'] as const;
export const TIPOS = ['Varejo', 'Atacado', 'Restaurante', 'Distribuidor', 'Mercadinho', 'Feirante'] as const;
export const ORIGENS = ['Balcão CEASA', 'Indicação', 'WhatsApp', 'Instagram', 'Telefone', 'Visita do vendedor', 'Recompra'] as const;
export const CANAIS = ['Ligação', 'WhatsApp', 'Visita', 'E-mail', 'Balcão'] as const;

export const DIA = 864e5;

/**
 * Regra do funil: ao entrar em "ganha" ou "perdida" a oportunidade ganha data de fechamento;
 * ao voltar para uma etapa aberta, perde a data.
 */
export function dataFechamento(etapaNova: Etapa, etapaAntes: Etapa | null, fechadoAntes: Date | null): Date | null {
  const fechada = etapaNova === 'ganha' || etapaNova === 'perdida';
  if (!fechada) return null;
  if (!fechadoAntes || etapaAntes !== etapaNova) return new Date();
  return fechadoAntes;
}

/** "AAAA-MM-DD" → Date (coluna DATE, meia-noite UTC). */
export const paraData = (s: string | null | undefined) => (s ? new Date(`${s}T00:00:00Z`) : null);
/** Date → "AAAA-MM-DD" */
export const deData = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');
