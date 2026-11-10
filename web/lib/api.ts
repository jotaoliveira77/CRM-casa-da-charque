import type {
  Cliente, Config, DadosCliente, DadosOportunidade, Db, EtapaId, Interacao, Oportunidade, Papel, Produto, Usuario,
} from './tipos';

/** Erro da API com a mensagem em português que o servidor devolve. */
export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

async function req<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api${caminho}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor. Verifique a internet e tente de novo.');
  }
  if (r.status === 204) return undefined as T;
  const json = await r.json().catch(() => null);
  if (!r.ok) throw new ErroApi(r.status, json?.erro ?? `Erro ${r.status} no servidor.`);
  return json as T;
}

// A API devolve datas em ISO; o front trabalha com milissegundos.
const ms = (iso: string) => new Date(iso).getTime();
type Iso<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] extends number ? string : string | null };

const deCliente = (c: Iso<Cliente, 'criadoEm'>): Cliente => ({ ...c, criadoEm: ms(c.criadoEm as string) });
const deOportunidade = (o: Iso<Oportunidade, 'criadoEm' | 'fechadoEm'>): Oportunidade => ({
  ...o,
  criadoEm: ms(o.criadoEm as string),
  fechadoEm: o.fechadoEm ? ms(o.fechadoEm) : null,
});
const deInteracao = (i: Iso<Interacao, 'data'>): Interacao => ({ ...i, data: ms(i.data as string) });

export const api = {
  // Sessão
  login: (email: string, senha: string) => req<Usuario>('POST', '/auth/login', { email, senha }),
  logout: () => req<void>('POST', '/auth/logout'),
  eu: () => req<Usuario>('GET', '/auth/me'),

  /** Carrega todos os dados de uma vez: o volume de uma distribuidora cabe tranquilo na memória. */
  async tudo(): Promise<Db> {
    const [usuarios, clientes, oportunidades, interacoes, produtos, config] = await Promise.all([
      req<Usuario[]>('GET', '/usuarios'),
      req<Iso<Cliente, 'criadoEm'>[]>('GET', '/clientes'),
      req<Iso<Oportunidade, 'criadoEm' | 'fechadoEm'>[]>('GET', '/oportunidades'),
      req<Iso<Interacao, 'data'>[]>('GET', '/interacoes'),
      req<Produto[]>('GET', '/produtos'),
      req<Config>('GET', '/configuracao'),
    ]);
    return {
      usuarios,
      clientes: clientes.map(deCliente),
      oportunidades: oportunidades.map(deOportunidade),
      interacoes: interacoes.map(deInteracao),
      produtos,
      config,
    };
  },

  // Clientes
  criarCliente: (d: DadosCliente) => req<Iso<Cliente, 'criadoEm'>>('POST', '/clientes', d).then(deCliente),
  salvarCliente: (id: string, d: DadosCliente) => req<Iso<Cliente, 'criadoEm'>>('PUT', `/clientes/${id}`, d).then(deCliente),
  excluirCliente: (id: string) => req<void>('DELETE', `/clientes/${id}`),

  // Oportunidades
  criarOportunidade: (d: DadosOportunidade) => req<unknown>('POST', '/oportunidades', d),
  salvarOportunidade: (id: string, d: DadosOportunidade) => req<unknown>('PUT', `/oportunidades/${id}`, d),
  moverOportunidade: (id: string, etapa: EtapaId) => req<unknown>('PATCH', `/oportunidades/${id}/etapa`, { etapa }),
  excluirOportunidade: (id: string) => req<void>('DELETE', `/oportunidades/${id}`),

  // Contatos
  registrarInteracao: (clienteId: string, canal: string, nota: string) => req<unknown>('POST', '/interacoes', { clienteId, canal, nota }),

  // Ajustes (gerência)
  salvarMeta: (metaMensal: number) => req<Config>('PUT', '/configuracao', { metaMensal }),
  salvarProdutos: (lista: { id?: string; nome: string; precoKg: number }[]) => req<Produto[]>('PUT', '/produtos', lista),
  criarUsuario: (d: { nome: string; email: string; senha: string; papel: Papel }) => req<Usuario>('POST', '/usuarios', d),
  alterarUsuario: (id: string, d: Partial<{ nome: string; papel: Papel; ativo: boolean; senha: string }>) =>
    req<Usuario>('PATCH', `/usuarios/${id}`, d),
  resetar: (modo: 'zerar' | 'exemplo') => req<unknown>('POST', '/admin/reset', { modo }),
};
