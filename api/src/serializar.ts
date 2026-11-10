import type { Cliente, Configuracao, Interacao, ItemOportunidade, Oportunidade, Produto, Usuario } from '@prisma/client';
import { deData } from './dominio.js';

/** Formatos JSON devolvidos pela API. Valores decimais saem como número; datas, em ISO. */

export const usuarioDTO = (u: Usuario) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel, ativo: u.ativo });
export type UsuarioDTO = ReturnType<typeof usuarioDTO>;

export const clienteDTO = (c: Cliente) => ({
  id: c.id,
  nome: c.nome,
  doc: c.doc,
  tel: c.tel,
  whatsapp: c.whatsapp,
  email: c.email,
  cidade: c.cidade,
  uf: c.uf,
  tipo: c.tipo,
  obs: c.obs,
  responsavelId: c.responsavelId,
  criadoEm: c.criadoEm.toISOString(),
});

export const oportunidadeDTO = (o: Oportunidade & { itens: ItemOportunidade[] }) => ({
  id: o.id,
  clienteId: o.clienteId,
  titulo: o.titulo,
  etapa: o.etapa,
  responsavelId: o.responsavelId,
  origem: o.origem,
  prazo: deData(o.prazo),
  proximaAcao: o.proximaAcao,
  motivoPerda: o.motivoPerda,
  obs: o.obs,
  criadoEm: o.criadoEm.toISOString(),
  fechadoEm: o.fechadoEm?.toISOString() ?? null,
  itens: o.itens.map(i => ({ produtoId: i.produtoId, kg: Number(i.kg), precoKg: Number(i.precoKg) })),
});

export const interacaoDTO = (i: Interacao) => ({
  id: i.id,
  clienteId: i.clienteId,
  usuarioId: i.usuarioId,
  canal: i.canal,
  nota: i.nota,
  data: i.data.toISOString(),
});

export const produtoDTO = (p: Produto) => ({ id: p.id, nome: p.nome, precoKg: Number(p.precoKg), ativo: p.ativo });

export const configuracaoDTO = (c: Configuracao) => ({ metaMensal: Number(c.metaMensal), exemplo: c.exemplo });
