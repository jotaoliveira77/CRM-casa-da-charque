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

export type Papel = 'ADMIN' | 'VENDEDOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
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
  responsavelId: string | null;
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
  responsavelId: string | null;
  origem: string;
  /** Data no formato AAAA-MM-DD, ou vazio */
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
  usuarioId: string | null;
  data: number;
  canal: string;
  nota: string;
}

export interface Produto {
  id: string;
  nome: string;
  precoKg: number;
  /** Produtos removidos do catálogo ficam inativos para manter o histórico. */
  ativo: boolean;
}

export interface Config {
  metaMensal: number;
  exemplo: boolean;
}

/** Tudo que o front carrega da API depois do login. */
export interface Db {
  usuarios: Usuario[];
  clientes: Cliente[];
  oportunidades: Oportunidade[];
  interacoes: Interacao[];
  produtos: Produto[];
  config: Config;
}

export interface Situacao {
  rot: 'Prospecto' | 'Novo' | 'Recorrente' | 'Inativo';
  cls: '' | 'good' | 'warn' | 'accent';
}

/** Dados enviados ao salvar (sem id e campos calculados pelo servidor). */
export type DadosCliente = Omit<Cliente, 'id' | 'criadoEm'>;
export type DadosOportunidade = Omit<Oportunidade, 'id' | 'criadoEm' | 'fechadoEm'>;
