/**
 * Módulo de persistência de dados com AsyncStorage
 * Fornece funções CRUD genéricas para todas as entidades do aplicativo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  Bloco, 
  Integrante, 
  Ensaio,
  Evento,
  RegistroPresenca,
  CheckIn,
  Material,
  EntregaFantasia,
  MovimentacaoMaterial,
  AppState,
  CategoriaIntegrante,
} from './types';

// Chaves de armazenamento
const STORAGE_KEYS = {
  BLOCOS: '@samba_school:blocos',
  INTEGRANTES: '@samba_school:integrantes',
  ENSAIOS: '@samba_school:ensaios',
  EVENTOS: '@samba_school:eventos',
  REGISTROS_PRESENCA: '@samba_school:registros_presenca',
  CHECK_INS: '@samba_school:check_ins',
  MATERIAIS: '@samba_school:materiais',
  ENTREGAS_FANTASIAS: '@samba_school:entregas_fantasias',
  MOVIMENTACOES: '@samba_school:movimentacoes',
} as const;

// Função auxiliar para gerar IDs únicos
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Função para gerar QR Code ID único
export function generateQRCodeId(): string {
  return `QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// Função auxiliar para obter timestamp atual
export function getTimestamp(): string {
  return new Date().toISOString();
}

// ============================================
// FUNÇÕES GENÉRICAS DE CRUD
// ============================================

async function getItems<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao carregar ${key}:`, error);
    return [];
  }
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Erro ao salvar ${key}:`, error);
    throw error;
  }
}

async function addItem<T extends { id: string }>(key: string, item: T): Promise<T> {
  const items = await getItems<T>(key);
  items.push(item);
  await setItems(key, items);
  return item;
}

async function updateItem<T extends { id: string }>(
  key: string, 
  id: string, 
  updates: Partial<T>
): Promise<T | null> {
  const items = await getItems<T>(key);
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  items[index] = { ...items[index], ...updates };
  await setItems(key, items);
  return items[index];
}

async function deleteItem<T extends { id: string }>(key: string, id: string): Promise<boolean> {
  const items = await getItems<T>(key);
  const filteredItems = items.filter(item => item.id !== id);
  
  if (filteredItems.length === items.length) return false;
  
  await setItems(key, filteredItems);
  return true;
}

async function getItemById<T extends { id: string }>(key: string, id: string): Promise<T | null> {
  const items = await getItems<T>(key);
  return items.find(item => item.id === id) || null;
}

// ============================================
// FUNÇÕES ESPECÍFICAS PARA BLOCOS
// ============================================

export const blocosStorage = {
  async getAll(): Promise<Bloco[]> {
    return getItems<Bloco>(STORAGE_KEYS.BLOCOS);
  },

  async getById(id: string): Promise<Bloco | null> {
    return getItemById<Bloco>(STORAGE_KEYS.BLOCOS, id);
  },

  async create(data: Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Bloco> {
    const now = getTimestamp();
    const bloco: Bloco = {
      ...data,
      id: generateId(),
      criadoEm: now,
      atualizadoEm: now,
    };
    return addItem(STORAGE_KEYS.BLOCOS, bloco);
  },

  async update(id: string, data: Partial<Omit<Bloco, 'id' | 'criadoEm'>>): Promise<Bloco | null> {
    return updateItem<Bloco>(STORAGE_KEYS.BLOCOS, id, {
      ...data,
      atualizadoEm: getTimestamp(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Bloco>(STORAGE_KEYS.BLOCOS, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA INTEGRANTES
// ============================================

export const integrantesStorage = {
  async getAll(): Promise<Integrante[]> {
    return getItems<Integrante>(STORAGE_KEYS.INTEGRANTES);
  },

  async getById(id: string): Promise<Integrante | null> {
    return getItemById<Integrante>(STORAGE_KEYS.INTEGRANTES, id);
  },

  async getByBloco(blocoId: string): Promise<Integrante[]> {
    const integrantes = await this.getAll();
    return integrantes.filter(i => i.blocosIds.includes(blocoId));
  },

  async getByCategoria(categoria: CategoriaIntegrante): Promise<Integrante[]> {
    const integrantes = await this.getAll();
    return integrantes.filter(i => i.categoria === categoria);
  },

  async getByQRCode(qrCodeId: string): Promise<Integrante | null> {
    const integrantes = await this.getAll();
    return integrantes.find(i => i.qrCodeId === qrCodeId) || null;
  },

  async getAtivos(): Promise<Integrante[]> {
    const integrantes = await this.getAll();
    return integrantes.filter(i => i.ativo);
  },

  async create(data: Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm' | 'qrCodeId'>): Promise<Integrante> {
    const now = getTimestamp();
    const integrante: Integrante = {
      ...data,
      id: generateId(),
      qrCodeId: generateQRCodeId(),
      criadoEm: now,
      atualizadoEm: now,
    };
    return addItem(STORAGE_KEYS.INTEGRANTES, integrante);
  },

  async update(id: string, data: Partial<Omit<Integrante, 'id' | 'criadoEm' | 'qrCodeId'>>): Promise<Integrante | null> {
    return updateItem<Integrante>(STORAGE_KEYS.INTEGRANTES, id, {
      ...data,
      atualizadoEm: getTimestamp(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Integrante>(STORAGE_KEYS.INTEGRANTES, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA ENSAIOS
// ============================================

export const ensaiosStorage = {
  async getAll(): Promise<Ensaio[]> {
    return getItems<Ensaio>(STORAGE_KEYS.ENSAIOS);
  },

  async getById(id: string): Promise<Ensaio | null> {
    return getItemById<Ensaio>(STORAGE_KEYS.ENSAIOS, id);
  },

  async getByStatus(status: Ensaio['status']): Promise<Ensaio[]> {
    const ensaios = await this.getAll();
    return ensaios.filter(e => e.status === status);
  },

  async create(data: Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Ensaio> {
    const now = getTimestamp();
    const ensaio: Ensaio = {
      ...data,
      id: generateId(),
      criadoEm: now,
      atualizadoEm: now,
    };
    return addItem(STORAGE_KEYS.ENSAIOS, ensaio);
  },

  async update(id: string, data: Partial<Omit<Ensaio, 'id' | 'criadoEm'>>): Promise<Ensaio | null> {
    return updateItem<Ensaio>(STORAGE_KEYS.ENSAIOS, id, {
      ...data,
      atualizadoEm: getTimestamp(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Ensaio>(STORAGE_KEYS.ENSAIOS, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA EVENTOS
// ============================================

export const eventosStorage = {
  async getAll(): Promise<Evento[]> {
    return getItems<Evento>(STORAGE_KEYS.EVENTOS);
  },

  async getById(id: string): Promise<Evento | null> {
    return getItemById<Evento>(STORAGE_KEYS.EVENTOS, id);
  },

  async getByStatus(status: Evento['status']): Promise<Evento[]> {
    const eventos = await this.getAll();
    return eventos.filter(e => e.status === status);
  },

  async create(data: Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Evento> {
    const now = getTimestamp();
    const evento: Evento = {
      ...data,
      id: generateId(),
      criadoEm: now,
      atualizadoEm: now,
    };
    return addItem(STORAGE_KEYS.EVENTOS, evento);
  },

  async update(id: string, data: Partial<Omit<Evento, 'id' | 'criadoEm'>>): Promise<Evento | null> {
    return updateItem<Evento>(STORAGE_KEYS.EVENTOS, id, {
      ...data,
      atualizadoEm: getTimestamp(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Evento>(STORAGE_KEYS.EVENTOS, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA REGISTROS DE PRESENÇA
// ============================================

export const presencaStorage = {
  async getAll(): Promise<RegistroPresenca[]> {
    return getItems<RegistroPresenca>(STORAGE_KEYS.REGISTROS_PRESENCA);
  },

  async getByEnsaio(ensaioId: string): Promise<RegistroPresenca[]> {
    const registros = await this.getAll();
    return registros.filter(r => r.ensaioId === ensaioId);
  },

  async getByIntegrante(integranteId: string): Promise<RegistroPresenca[]> {
    const registros = await this.getAll();
    return registros.filter(r => r.integranteId === integranteId);
  },

  async create(data: Omit<RegistroPresenca, 'id' | 'registradoEm'>): Promise<RegistroPresenca> {
    const registro: RegistroPresenca = {
      ...data,
      id: generateId(),
      registradoEm: getTimestamp(),
    };
    return addItem(STORAGE_KEYS.REGISTROS_PRESENCA, registro);
  },

  async update(id: string, data: Partial<Omit<RegistroPresenca, 'id'>>): Promise<RegistroPresenca | null> {
    return updateItem<RegistroPresenca>(STORAGE_KEYS.REGISTROS_PRESENCA, id, {
      ...data,
      registradoEm: getTimestamp(),
    });
  },

  async upsertByEnsaioAndIntegrante(
    ensaioId: string, 
    integranteId: string, 
    status: RegistroPresenca['status'],
    justificativa?: string
  ): Promise<RegistroPresenca> {
    const registros = await this.getAll();
    const existente = registros.find(
      r => r.ensaioId === ensaioId && r.integranteId === integranteId
    );

    if (existente) {
      const updated = await this.update(existente.id, { status, justificativa });
      return updated!;
    }

    return this.create({ ensaioId, integranteId, status, justificativa });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<RegistroPresenca>(STORAGE_KEYS.REGISTROS_PRESENCA, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA CHECK-INS
// ============================================

export const checkInsStorage = {
  async getAll(): Promise<CheckIn[]> {
    return getItems<CheckIn>(STORAGE_KEYS.CHECK_INS);
  },

  async getByEvento(eventoId: string): Promise<CheckIn[]> {
    const checkIns = await this.getAll();
    return checkIns.filter(c => c.eventoId === eventoId);
  },

  async getByIntegrante(integranteId: string): Promise<CheckIn[]> {
    const checkIns = await this.getAll();
    return checkIns.filter(c => c.integranteId === integranteId);
  },

  async create(data: Omit<CheckIn, 'id' | 'horarioCheckIn'>): Promise<CheckIn> {
    const checkIn: CheckIn = {
      ...data,
      id: generateId(),
      horarioCheckIn: getTimestamp(),
    };
    return addItem(STORAGE_KEYS.CHECK_INS, checkIn);
  },

  async existsForEventoAndIntegrante(eventoId: string, integranteId: string): Promise<boolean> {
    const checkIns = await this.getAll();
    return checkIns.some(c => c.eventoId === eventoId && c.integranteId === integranteId);
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<CheckIn>(STORAGE_KEYS.CHECK_INS, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA MATERIAIS
// ============================================

export const materiaisStorage = {
  async getAll(): Promise<Material[]> {
    return getItems<Material>(STORAGE_KEYS.MATERIAIS);
  },

  async getById(id: string): Promise<Material | null> {
    return getItemById<Material>(STORAGE_KEYS.MATERIAIS, id);
  },

  async getByCategoria(categoria: Material['categoria']): Promise<Material[]> {
    const materiais = await this.getAll();
    return materiais.filter(m => m.categoria === categoria);
  },

  async getEmFalta(): Promise<Material[]> {
    const materiais = await this.getAll();
    return materiais.filter(m => 
      (m.quantidadeDisponivel + m.quantidadeEmUso) < m.quantidadeNecessaria
    );
  },

  async create(data: Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Material> {
    const now = getTimestamp();
    const material: Material = {
      ...data,
      id: generateId(),
      criadoEm: now,
      atualizadoEm: now,
    };
    return addItem(STORAGE_KEYS.MATERIAIS, material);
  },

  async update(id: string, data: Partial<Omit<Material, 'id' | 'criadoEm'>>): Promise<Material | null> {
    return updateItem<Material>(STORAGE_KEYS.MATERIAIS, id, {
      ...data,
      atualizadoEm: getTimestamp(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Material>(STORAGE_KEYS.MATERIAIS, id);
  },
};

// ============================================
// FUNÇÕES ESPECÍFICAS PARA ENTREGAS DE FANTASIAS
// ============================================

export const entregasFantasiasStorage = {
  async getAll(): Promise<EntregaFantasia[]> {
    return getItems<EntregaFantasia>(STORAGE_KEYS.ENTREGAS_FANTASIAS);
  },

  async getById(id: string): Promise<EntregaFantasia | null> {
    return getItemById<EntregaFantasia>(STORAGE_KEYS.ENTREGAS_FANTASIAS, id);
  },

  async getByMaterial(materialId: string): Promise<EntregaFantasia[]> {
    const entregas = await this.getAll();
    return entregas.filter(e => e.materialId === materialId);
  },

  async getByIntegrante(integranteId: string): Promise<EntregaFantasia[]> {
    const entregas = await this.getAll();
    return entregas.filter(e => e.integranteId === integranteId);
  },

  async getPendentes(): Promise<EntregaFantasia[]> {
    const entregas = await this.getAll();
    return entregas.filter(e => e.status === 'entregue');
  },

  async create(data: Omit<EntregaFantasia, 'id'>): Promise<EntregaFantasia> {
    const entrega: EntregaFantasia = {
      ...data,
      id: generateId(),
    };
    return addItem(STORAGE_KEYS.ENTREGAS_FANTASIAS, entrega);
  },

  async update(id: string, data: Partial<Omit<EntregaFantasia, 'id'>>): Promise<EntregaFantasia | null> {
    return updateItem<EntregaFantasia>(STORAGE_KEYS.ENTREGAS_FANTASIAS, id, data);
  },

  async registrarDevolucao(
    id: string, 
    responsavel: string, 
    estadoConservacao: EntregaFantasia['estadoConservacao'],
    observacao?: string
  ): Promise<EntregaFantasia | null> {
    return this.update(id, {
      dataDevolucao: getTimestamp(),
      responsavelDevolucao: responsavel,
      estadoConservacao,
      observacaoDevolucao: observacao,
      status: 'devolvido',
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<EntregaFantasia>(STORAGE_KEYS.ENTREGAS_FANTASIAS, id);
  },
};

// ============================================
// FUNÇÕES DE UTILIDADE
// ============================================

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    throw error;
  }
}

export async function exportAllData(): Promise<AppState> {
  const [
    blocos, 
    integrantes, 
    ensaios, 
    eventos,
    registrosPresenca, 
    checkIns,
    materiais, 
    entregasFantasias,
    movimentacoes
  ] = await Promise.all([
    blocosStorage.getAll(),
    integrantesStorage.getAll(),
    ensaiosStorage.getAll(),
    eventosStorage.getAll(),
    presencaStorage.getAll(),
    checkInsStorage.getAll(),
    materiaisStorage.getAll(),
    entregasFantasiasStorage.getAll(),
    getItems<MovimentacaoMaterial>(STORAGE_KEYS.MOVIMENTACOES),
  ]);

  return {
    blocos,
    integrantes,
    ensaios,
    eventos,
    registrosPresenca,
    checkIns,
    materiais,
    entregasFantasias,
    movimentacoes,
  };
}

export async function importAllData(data: Partial<AppState>): Promise<void> {
  const promises: Promise<void>[] = [];

  if (data.blocos) {
    promises.push(setItems(STORAGE_KEYS.BLOCOS, data.blocos));
  }
  if (data.integrantes) {
    promises.push(setItems(STORAGE_KEYS.INTEGRANTES, data.integrantes));
  }
  if (data.ensaios) {
    promises.push(setItems(STORAGE_KEYS.ENSAIOS, data.ensaios));
  }
  if (data.eventos) {
    promises.push(setItems(STORAGE_KEYS.EVENTOS, data.eventos));
  }
  if (data.registrosPresenca) {
    promises.push(setItems(STORAGE_KEYS.REGISTROS_PRESENCA, data.registrosPresenca));
  }
  if (data.checkIns) {
    promises.push(setItems(STORAGE_KEYS.CHECK_INS, data.checkIns));
  }
  if (data.materiais) {
    promises.push(setItems(STORAGE_KEYS.MATERIAIS, data.materiais));
  }
  if (data.entregasFantasias) {
    promises.push(setItems(STORAGE_KEYS.ENTREGAS_FANTASIAS, data.entregasFantasias));
  }
  if (data.movimentacoes) {
    promises.push(setItems(STORAGE_KEYS.MOVIMENTACOES, data.movimentacoes));
  }

  await Promise.all(promises);
}
