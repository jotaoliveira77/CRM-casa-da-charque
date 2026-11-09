export type EtapaId =
  | 'novo'
  | 'qualificacao'
  | 'necessidade'
  | 'proposta'
  | 'negociacao'
  | 'aguardando'
  | 'ganha'
  | 'perdida';

export interface Etapa {
  id: EtapaId;
  nome: string;
  cor: string;
}

export interface Cliente {
  id: string;
  nome: string;
  doc: string;
  tel: string;
  whatsapp: string;
  email: string;
  cidade: string;
  uf: string;
  tipo: string;
  responsavel: string;
  obs: string;
  criadoEm: number;
}

export interface Item {
  produtoId: string;
  kg: number;
  precoKg: number;
}

export interface Oportunidade {
  id: string;
  clienteId: string;
  titulo: string;
  etapa: EtapaId;
  responsavel: string;
  origem: string;
  /** Data no formato AAAA-MM-DD */
  prazo: string;
  proximaAcao: string;
  itens: Item[];
  criadoEm: number;
  fechadoEm: number | null;
  motivoPerda: string;
  obs: string;
}

export interface Interacao {
  id: string;
  clienteId: string;
  data: number;
  canal: string;
  nota: string;
  responsavel: string;
}

export interface Produto {
  id: string;
  nome: string;
  precoKg: number;
}

export interface Config {
  metaMensal: number;
  responsaveis: string[];
  produtos: Produto[];
}

export interface Db {
  versao: number;
  exemplo: boolean;
  clientes: Cliente[];
  oportunidades: Oportunidade[];
  interacoes: Interacao[];
  config: Config;
}

export interface Situacao {
  rot: 'Prospecto' | 'Novo' | 'Recorrente' | 'Inativo';
  cls: '' | 'good' | 'warn' | 'accent';
}
