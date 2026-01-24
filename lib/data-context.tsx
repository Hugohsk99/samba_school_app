/**
 * Contexto global de dados do aplicativo
 * Gerencia o estado de todas as entidades e fornece funções de CRUD
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Bloco, Integrante, Ensaio, RegistroPresenca, Material } from './types';
import { 
  blocosStorage, 
  integrantesStorage, 
  ensaiosStorage, 
  presencaStorage,
  materiaisStorage 
} from './storage';

// Tipos do contexto
interface DataContextType {
  // Estado
  blocos: Bloco[];
  integrantes: Integrante[];
  ensaios: Ensaio[];
  registrosPresenca: RegistroPresenca[];
  materiais: Material[];
  isLoading: boolean;

  // Funções de Blocos
  addBloco: (data: Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Bloco>;
  updateBloco: (id: string, data: Partial<Omit<Bloco, 'id' | 'criadoEm'>>) => Promise<Bloco | null>;
  deleteBloco: (id: string) => Promise<boolean>;

  // Funções de Integrantes
  addIntegrante: (data: Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Integrante>;
  updateIntegrante: (id: string, data: Partial<Omit<Integrante, 'id' | 'criadoEm'>>) => Promise<Integrante | null>;
  deleteIntegrante: (id: string) => Promise<boolean>;
  getIntegrantesByBloco: (blocoId: string) => Integrante[];

  // Funções de Ensaios
  addEnsaio: (data: Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Ensaio>;
  updateEnsaio: (id: string, data: Partial<Omit<Ensaio, 'id' | 'criadoEm'>>) => Promise<Ensaio | null>;
  deleteEnsaio: (id: string) => Promise<boolean>;

  // Funções de Presença
  registrarPresenca: (
    ensaioId: string, 
    integranteId: string, 
    status: RegistroPresenca['status'],
    justificativa?: string
  ) => Promise<RegistroPresenca>;
  getPresencaByEnsaio: (ensaioId: string) => RegistroPresenca[];

  // Funções de Materiais
  addMaterial: (data: Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Material>;
  updateMaterial: (id: string, data: Partial<Omit<Material, 'id' | 'criadoEm'>>) => Promise<Material | null>;
  deleteMaterial: (id: string) => Promise<boolean>;

  // Funções utilitárias
  refreshData: () => Promise<void>;
}

// Criar contexto
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider
export function DataProvider({ children }: { children: ReactNode }) {
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [ensaios, setEnsaios] = useState<Ensaio[]>([]);
  const [registrosPresenca, setRegistrosPresenca] = useState<RegistroPresenca[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        loadedBlocos,
        loadedIntegrantes,
        loadedEnsaios,
        loadedPresenca,
        loadedMateriais,
      ] = await Promise.all([
        blocosStorage.getAll(),
        integrantesStorage.getAll(),
        ensaiosStorage.getAll(),
        presencaStorage.getAll(),
        materiaisStorage.getAll(),
      ]);

      setBlocos(loadedBlocos);
      setIntegrantes(loadedIntegrantes);
      setEnsaios(loadedEnsaios);
      setRegistrosPresenca(loadedPresenca);
      setMateriais(loadedMateriais);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // FUNÇÕES DE BLOCOS
  // ============================================

  const addBloco = useCallback(async (data: Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novoBloco = await blocosStorage.create(data);
    setBlocos(prev => [...prev, novoBloco]);
    return novoBloco;
  }, []);

  const updateBloco = useCallback(async (id: string, data: Partial<Omit<Bloco, 'id' | 'criadoEm'>>) => {
    const blocoAtualizado = await blocosStorage.update(id, data);
    if (blocoAtualizado) {
      setBlocos(prev => prev.map(b => b.id === id ? blocoAtualizado : b));
    }
    return blocoAtualizado;
  }, []);

  const deleteBloco = useCallback(async (id: string) => {
    const sucesso = await blocosStorage.delete(id);
    if (sucesso) {
      setBlocos(prev => prev.filter(b => b.id !== id));
    }
    return sucesso;
  }, []);

  // ============================================
  // FUNÇÕES DE INTEGRANTES
  // ============================================

  const addIntegrante = useCallback(async (data: Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novoIntegrante = await integrantesStorage.create(data);
    setIntegrantes(prev => [...prev, novoIntegrante]);
    return novoIntegrante;
  }, []);

  const updateIntegrante = useCallback(async (id: string, data: Partial<Omit<Integrante, 'id' | 'criadoEm'>>) => {
    const integranteAtualizado = await integrantesStorage.update(id, data);
    if (integranteAtualizado) {
      setIntegrantes(prev => prev.map(i => i.id === id ? integranteAtualizado : i));
    }
    return integranteAtualizado;
  }, []);

  const deleteIntegrante = useCallback(async (id: string) => {
    const sucesso = await integrantesStorage.delete(id);
    if (sucesso) {
      setIntegrantes(prev => prev.filter(i => i.id !== id));
    }
    return sucesso;
  }, []);

  const getIntegrantesByBloco = useCallback((blocoId: string) => {
    return integrantes.filter(i => i.blocosIds.includes(blocoId));
  }, [integrantes]);

  // ============================================
  // FUNÇÕES DE ENSAIOS
  // ============================================

  const addEnsaio = useCallback(async (data: Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novoEnsaio = await ensaiosStorage.create(data);
    setEnsaios(prev => [...prev, novoEnsaio]);
    return novoEnsaio;
  }, []);

  const updateEnsaio = useCallback(async (id: string, data: Partial<Omit<Ensaio, 'id' | 'criadoEm'>>) => {
    const ensaioAtualizado = await ensaiosStorage.update(id, data);
    if (ensaioAtualizado) {
      setEnsaios(prev => prev.map(e => e.id === id ? ensaioAtualizado : e));
    }
    return ensaioAtualizado;
  }, []);

  const deleteEnsaio = useCallback(async (id: string) => {
    const sucesso = await ensaiosStorage.delete(id);
    if (sucesso) {
      setEnsaios(prev => prev.filter(e => e.id !== id));
    }
    return sucesso;
  }, []);

  // ============================================
  // FUNÇÕES DE PRESENÇA
  // ============================================

  const registrarPresenca = useCallback(async (
    ensaioId: string,
    integranteId: string,
    status: RegistroPresenca['status'],
    justificativa?: string
  ) => {
    const registro = await presencaStorage.upsertByEnsaioAndIntegrante(
      ensaioId,
      integranteId,
      status,
      justificativa
    );
    
    setRegistrosPresenca(prev => {
      const existente = prev.findIndex(
        r => r.ensaioId === ensaioId && r.integranteId === integranteId
      );
      
      if (existente >= 0) {
        const novos = [...prev];
        novos[existente] = registro;
        return novos;
      }
      
      return [...prev, registro];
    });
    
    return registro;
  }, []);

  const getPresencaByEnsaio = useCallback((ensaioId: string) => {
    return registrosPresenca.filter(r => r.ensaioId === ensaioId);
  }, [registrosPresenca]);

  // ============================================
  // FUNÇÕES DE MATERIAIS
  // ============================================

  const addMaterial = useCallback(async (data: Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novoMaterial = await materiaisStorage.create(data);
    setMateriais(prev => [...prev, novoMaterial]);
    return novoMaterial;
  }, []);

  const updateMaterial = useCallback(async (id: string, data: Partial<Omit<Material, 'id' | 'criadoEm'>>) => {
    const materialAtualizado = await materiaisStorage.update(id, data);
    if (materialAtualizado) {
      setMateriais(prev => prev.map(m => m.id === id ? materialAtualizado : m));
    }
    return materialAtualizado;
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    const sucesso = await materiaisStorage.delete(id);
    if (sucesso) {
      setMateriais(prev => prev.filter(m => m.id !== id));
    }
    return sucesso;
  }, []);

  // Valor do contexto
  const value: DataContextType = {
    // Estado
    blocos,
    integrantes,
    ensaios,
    registrosPresenca,
    materiais,
    isLoading,

    // Funções de Blocos
    addBloco,
    updateBloco,
    deleteBloco,

    // Funções de Integrantes
    addIntegrante,
    updateIntegrante,
    deleteIntegrante,
    getIntegrantesByBloco,

    // Funções de Ensaios
    addEnsaio,
    updateEnsaio,
    deleteEnsaio,

    // Funções de Presença
    registrarPresenca,
    getPresencaByEnsaio,

    // Funções de Materiais
    addMaterial,
    updateMaterial,
    deleteMaterial,

    // Utilitários
    refreshData: loadData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook para usar o contexto
export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}
