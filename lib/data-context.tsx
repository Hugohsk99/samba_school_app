/**
 * Contexto global de dados do aplicativo
 * Gerencia o estado de todas as entidades e fornece funções de CRUD
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { 
  Bloco, 
  Integrante, 
  Ensaio, 
  Evento,
  RegistroPresenca, 
  CheckIn,
  Material,
  EntregaFantasia,
  CategoriaIntegrante,
} from './types';
import { 
  blocosStorage, 
  integrantesStorage, 
  ensaiosStorage,
  eventosStorage,
  presencaStorage,
  checkInsStorage,
  materiaisStorage,
  entregasFantasiasStorage,
} from './storage';

// Tipos do contexto
interface DataContextType {
  // Estado
  blocos: Bloco[];
  integrantes: Integrante[];
  ensaios: Ensaio[];
  eventos: Evento[];
  registrosPresenca: RegistroPresenca[];
  checkIns: CheckIn[];
  materiais: Material[];
  entregasFantasias: EntregaFantasia[];
  isLoading: boolean;

  // Funções de Blocos
  addBloco: (data: Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Bloco>;
  updateBloco: (id: string, data: Partial<Omit<Bloco, 'id' | 'criadoEm'>>) => Promise<Bloco | null>;
  deleteBloco: (id: string) => Promise<boolean>;

  // Funções de Integrantes
  addIntegrante: (data: Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm' | 'qrCodeId'>) => Promise<Integrante>;
  updateIntegrante: (id: string, data: Partial<Omit<Integrante, 'id' | 'criadoEm' | 'qrCodeId'>>) => Promise<Integrante | null>;
  deleteIntegrante: (id: string) => Promise<boolean>;
  getIntegrantesByBloco: (blocoId: string) => Integrante[];
  getIntegrantesByCategoria: (categoria: CategoriaIntegrante) => Integrante[];
  getIntegranteByQRCode: (qrCodeId: string) => Integrante | undefined;

  // Funções de Ensaios
  addEnsaio: (data: Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Ensaio>;
  updateEnsaio: (id: string, data: Partial<Omit<Ensaio, 'id' | 'criadoEm'>>) => Promise<Ensaio | null>;
  deleteEnsaio: (id: string) => Promise<boolean>;

  // Funções de Eventos
  addEvento: (data: Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Evento>;
  updateEvento: (id: string, data: Partial<Omit<Evento, 'id' | 'criadoEm'>>) => Promise<Evento | null>;
  deleteEvento: (id: string) => Promise<boolean>;

  // Funções de Presença
  registrarPresenca: (
    ensaioId: string, 
    integranteId: string, 
    status: RegistroPresenca['status'],
    justificativa?: string
  ) => Promise<RegistroPresenca>;
  getPresencaByEnsaio: (ensaioId: string) => RegistroPresenca[];

  // Funções de Check-In
  realizarCheckIn: (eventoId: string, integranteId: string, qrCodeId: string, metodo?: CheckIn['metodo']) => Promise<CheckIn>;
  getCheckInsByEvento: (eventoId: string) => CheckIn[];
  verificarCheckIn: (eventoId: string, integranteId: string) => boolean;

  // Funções de Materiais
  addMaterial: (data: Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Material>;
  updateMaterial: (id: string, data: Partial<Omit<Material, 'id' | 'criadoEm'>>) => Promise<Material | null>;
  deleteMaterial: (id: string) => Promise<boolean>;

  // Funções de Entregas de Fantasias
  registrarEntrega: (data: Omit<EntregaFantasia, 'id'>) => Promise<EntregaFantasia>;
  registrarDevolucao: (
    id: string, 
    responsavel: string, 
    estadoConservacao: EntregaFantasia['estadoConservacao'],
    observacao?: string
  ) => Promise<EntregaFantasia | null>;
  getEntregasByIntegrante: (integranteId: string) => EntregaFantasia[];
  getEntregasPendentes: () => EntregaFantasia[];

  // Funções utilitárias
  refreshData: () => Promise<void>;
  
  // Funções de gestão de dados
  setBlocos: (blocos: Bloco[]) => Promise<void>;
  setIntegrantes: (integrantes: Integrante[]) => Promise<void>;
  setEventos: (eventos: Evento[]) => Promise<void>;
  setMateriais: (materiais: Material[]) => Promise<void>;
  clearAllData: () => Promise<void>;
}

// Criar contexto
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider
export function DataProvider({ children }: { children: ReactNode }) {
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [ensaios, setEnsaios] = useState<Ensaio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [registrosPresenca, setRegistrosPresenca] = useState<RegistroPresenca[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [entregasFantasias, setEntregasFantasias] = useState<EntregaFantasia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        loadedBlocos,
        loadedIntegrantes,
        loadedEnsaios,
        loadedEventos,
        loadedPresenca,
        loadedCheckIns,
        loadedMateriais,
        loadedEntregas,
      ] = await Promise.all([
        blocosStorage.getAll(),
        integrantesStorage.getAll(),
        ensaiosStorage.getAll(),
        eventosStorage.getAll(),
        presencaStorage.getAll(),
        checkInsStorage.getAll(),
        materiaisStorage.getAll(),
        entregasFantasiasStorage.getAll(),
      ]);

      setBlocos(loadedBlocos);
      setIntegrantes(loadedIntegrantes);
      setEnsaios(loadedEnsaios);
      setEventos(loadedEventos);
      setRegistrosPresenca(loadedPresenca);
      setCheckIns(loadedCheckIns);
      setMateriais(loadedMateriais);
      setEntregasFantasias(loadedEntregas);
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

  const addIntegrante = useCallback(async (data: Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm' | 'qrCodeId'>) => {
    const novoIntegrante = await integrantesStorage.create(data);
    setIntegrantes(prev => [...prev, novoIntegrante]);
    return novoIntegrante;
  }, []);

  const updateIntegrante = useCallback(async (id: string, data: Partial<Omit<Integrante, 'id' | 'criadoEm' | 'qrCodeId'>>) => {
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

  const getIntegrantesByCategoria = useCallback((categoria: CategoriaIntegrante) => {
    return integrantes.filter(i => i.categoria === categoria);
  }, [integrantes]);

  const getIntegranteByQRCode = useCallback((qrCodeId: string) => {
    return integrantes.find(i => i.qrCodeId === qrCodeId);
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
  // FUNÇÕES DE EVENTOS
  // ============================================

  const addEvento = useCallback(async (data: Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novoEvento = await eventosStorage.create(data);
    setEventos(prev => [...prev, novoEvento]);
    return novoEvento;
  }, []);

  const updateEvento = useCallback(async (id: string, data: Partial<Omit<Evento, 'id' | 'criadoEm'>>) => {
    const eventoAtualizado = await eventosStorage.update(id, data);
    if (eventoAtualizado) {
      setEventos(prev => prev.map(e => e.id === id ? eventoAtualizado : e));
    }
    return eventoAtualizado;
  }, []);

  const deleteEvento = useCallback(async (id: string) => {
    const sucesso = await eventosStorage.delete(id);
    if (sucesso) {
      setEventos(prev => prev.filter(e => e.id !== id));
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
  // FUNÇÕES DE CHECK-IN
  // ============================================

  const realizarCheckIn = useCallback(async (
    eventoId: string, 
    integranteId: string, 
    qrCodeId: string,
    metodo: CheckIn['metodo'] = 'qr_code'
  ) => {
    const checkIn = await checkInsStorage.create({
      eventoId,
      integranteId,
      qrCodeId,
      metodo,
    });
    setCheckIns(prev => [...prev, checkIn]);
    return checkIn;
  }, []);

  const getCheckInsByEvento = useCallback((eventoId: string) => {
    return checkIns.filter(c => c.eventoId === eventoId);
  }, [checkIns]);

  const verificarCheckIn = useCallback((eventoId: string, integranteId: string) => {
    return checkIns.some(c => c.eventoId === eventoId && c.integranteId === integranteId);
  }, [checkIns]);

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

  // ============================================
  // FUNÇÕES DE ENTREGAS DE FANTASIAS
  // ============================================

  const registrarEntrega = useCallback(async (data: Omit<EntregaFantasia, 'id'>) => {
    const entrega = await entregasFantasiasStorage.create(data);
    setEntregasFantasias(prev => [...prev, entrega]);
    return entrega;
  }, []);

  const registrarDevolucao = useCallback(async (
    id: string,
    responsavel: string,
    estadoConservacao: EntregaFantasia['estadoConservacao'],
    observacao?: string
  ) => {
    const entregaAtualizada = await entregasFantasiasStorage.registrarDevolucao(
      id,
      responsavel,
      estadoConservacao,
      observacao
    );
    if (entregaAtualizada) {
      setEntregasFantasias(prev => prev.map(e => e.id === id ? entregaAtualizada : e));
    }
    return entregaAtualizada;
  }, []);

  const getEntregasByIntegrante = useCallback((integranteId: string) => {
    return entregasFantasias.filter(e => e.integranteId === integranteId);
  }, [entregasFantasias]);

  const getEntregasPendentes = useCallback(() => {
    return entregasFantasias.filter(e => e.status === 'entregue');
  }, [entregasFantasias]);

  // ============================================
  // FUNÇÕES DE GESTÃO DE DADOS
  // ============================================

  const setBlocosData = useCallback(async (newBlocos: Bloco[]) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('@samba_school:blocos', JSON.stringify(newBlocos));
    setBlocos(newBlocos);
  }, []);

  const setIntegrantesData = useCallback(async (newIntegrantes: Integrante[]) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('@samba_school:integrantes', JSON.stringify(newIntegrantes));
    setIntegrantes(newIntegrantes);
  }, []);

  const setEventosData = useCallback(async (newEventos: Evento[]) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('@samba_school:eventos', JSON.stringify(newEventos));
    setEventos(newEventos);
  }, []);

  const setMateriaisData = useCallback(async (newMateriais: Material[]) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('@samba_school:materiais', JSON.stringify(newMateriais));
    setMateriais(newMateriais);
  }, []);

  const clearAllData = useCallback(async () => {
    // Limpar todos os dados do AsyncStorage
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await Promise.all([
      AsyncStorage.setItem('@samba_school:blocos', '[]'),
      AsyncStorage.setItem('@samba_school:integrantes', '[]'),
      AsyncStorage.setItem('@samba_school:ensaios', '[]'),
      AsyncStorage.setItem('@samba_school:eventos', '[]'),
      AsyncStorage.setItem('@samba_school:registros_presenca', '[]'),
      AsyncStorage.setItem('@samba_school:check_ins', '[]'),
      AsyncStorage.setItem('@samba_school:materiais', '[]'),
      AsyncStorage.setItem('@samba_school:entregas_fantasias', '[]'),
    ]);
    setBlocos([]);
    setIntegrantes([]);
    setEnsaios([]);
    setEventos([]);
    setRegistrosPresenca([]);
    setCheckIns([]);
    setMateriais([]);
    setEntregasFantasias([]);
  }, []);

  // Valor do contexto
  const value: DataContextType = {
    // Estado
    blocos,
    integrantes,
    ensaios,
    eventos,
    registrosPresenca,
    checkIns,
    materiais,
    entregasFantasias,
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
    getIntegrantesByCategoria,
    getIntegranteByQRCode,

    // Funções de Ensaios
    addEnsaio,
    updateEnsaio,
    deleteEnsaio,

    // Funções de Eventos
    addEvento,
    updateEvento,
    deleteEvento,

    // Funções de Presença
    registrarPresenca,
    getPresencaByEnsaio,

    // Funções de Check-In
    realizarCheckIn,
    getCheckInsByEvento,
    verificarCheckIn,

    // Funções de Materiais
    addMaterial,
    updateMaterial,
    deleteMaterial,

    // Funções de Entregas de Fantasias
    registrarEntrega,
    registrarDevolucao,
    getEntregasByIntegrante,
    getEntregasPendentes,

    // Utilitários
    refreshData: loadData,
    
    // Gestão de dados
    setBlocos: setBlocosData,
    setIntegrantes: setIntegrantesData,
    setEventos: setEventosData,
    setMateriais: setMateriaisData,
    clearAllData,
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
