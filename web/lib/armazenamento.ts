import { STORAGE_KEY } from './constantes';
import type { Db } from './tipos';

export function carregar(): Db | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as Db) : null;
  } catch {
    return null;
  }
}

export function salvar(db: Db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* armazenamento cheio ou bloqueado: segue só em memória */
  }
}

/** Confere se um texto colado é uma cópia de segurança válida. */
export function lerCopia(texto: string): Db | null {
  try {
    const novo = JSON.parse(texto);
    if (!Array.isArray(novo.clientes) || !Array.isArray(novo.oportunidades) || !novo.config) return null;
    novo.interacoes ||= [];
    return novo as Db;
  } catch {
    return null;
  }
}
