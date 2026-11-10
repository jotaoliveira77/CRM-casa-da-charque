import type { Etapa, EtapaId } from './tipos';

export const ETAPAS: Etapa[] = [
  { id: 'novo', nome: 'Novo contato', cor: '#b9aeb0' },
  { id: 'qualificacao', nome: 'Qualificação', cor: '#a8949a' },
  { id: 'necessidade', nome: 'Necessidade identificada', cor: '#9c7a83' },
  { id: 'proposta', nome: 'Proposta enviada', cor: '#a35565' },
  { id: 'negociacao', nome: 'Negociação', cor: '#962f43' },
  { id: 'aguardando', nome: 'Aguardando decisão', cor: '#8b1e2d' },
  { id: 'ganha', nome: 'Venda fechada', cor: '#2b7449' },
  { id: 'perdida', nome: 'Venda perdida', cor: '#6d6465' },
];
export const ABERTAS: EtapaId[] = ['novo', 'qualificacao', 'necessidade', 'proposta', 'negociacao', 'aguardando'];
export const TIPOS = ['Varejo', 'Atacado', 'Restaurante', 'Distribuidor', 'Mercadinho', 'Feirante'];
export const ORIGENS = ['Balcão CEASA', 'Indicação', 'WhatsApp', 'Instagram', 'Telefone', 'Visita do vendedor'];
export const CANAIS = ['Ligação', 'WhatsApp', 'Visita', 'E-mail', 'Balcão'];
export const SITUACOES = ['Recorrente', 'Novo', 'Inativo', 'Prospecto'] as const;
export const DAY = 864e5;

export const etapa = (id: EtapaId) => ETAPAS.find(e => e.id === id)!;
export const isAberta = (id: EtapaId) => ABERTAS.includes(id);
