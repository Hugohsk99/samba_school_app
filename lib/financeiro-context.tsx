/**
 * Contexto de dados financeiros do aplicativo
 * Gerencia transações, receitas e despesas
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { TransacaoFinanceira, FotoEvento, Lembrete } from './types';
import { transacoesStorage, fotosEventosStorage, lembretesStorage } from './storage';

// Tipos do contexto
interface FinanceiroContextType {
  // Estado
  transacoes: TransacaoFinanceira[];
  fotos: FotoEvento[];
  lembretes: Lembrete[];
  isLoading: boolean;
  
  // Resumo financeiro
  resumo: {
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
    receitasPendentes: number;
    despesasPendentes: number;
  };

  // Funções de Transações
  addTransacao: (data: Omit<TransacaoFinanceira, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<TransacaoFinanceira>;
  updateTransacao: (id: string, data: Partial<Omit<TransacaoFinanceira, 'id' | 'criadoEm'>>) => Promise<TransacaoFinanceira | null>;
  deleteTransacao: (id: string) => Promise<boolean>;
  getTransacoesByTipo: (tipo: 'receita' | 'despesa') => TransacaoFinanceira[];
  getTransacoesByPeriodo: (dataInicio: string, dataFim: string) => TransacaoFinanceira[];

  // Funções de Fotos
  addFoto: (data: Omit<FotoEvento, 'id' | 'criadoEm'>) => Promise<FotoEvento>;
  deleteFoto: (id: string) => Promise<boolean>;
  getFotosByEvento: (eventoId: string) => FotoEvento[];

  // Funções de Lembretes
  addLembrete: (data: Omit<Lembrete, 'id' | 'criadoEm'>) => Promise<Lembrete>;
  updateLembrete: (id: string, data: Partial<Omit<Lembrete, 'id' | 'criadoEm'>>) => Promise<Lembrete | null>;
  deleteLembrete: (id: string) => Promise<boolean>;
  toggleLembrete: (id: string) => Promise<Lembrete | null>;
  getLembretesAtivos: () => Lembrete[];

  // Utilitários
  refreshData: () => Promise<void>;
}

// Criar contexto
const FinanceiroContext = createContext<FinanceiroContextType | undefined>(undefined);

// Provider
export function FinanceiroProvider({ children }: { children: ReactNode }) {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [fotos, setFotos] = useState<FotoEvento[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    receitasPendentes: 0,
    despesasPendentes: 0,
  });

  // Calcular resumo
  const calcularResumo = useCallback((transacoesList: TransacaoFinanceira[]) => {
    const receitas = transacoesList.filter(t => t.tipo === 'receita');
    const despesas = transacoesList.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas
      .filter(t => t.status === 'pago')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const totalDespesas = despesas
      .filter(t => t.status === 'pago')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const receitasPendentes = receitas
      .filter(t => t.status === 'pendente' || t.status === 'atrasado')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const despesasPendentes = despesas
      .filter(t => t.status === 'pendente' || t.status === 'atrasado')
      .reduce((acc, t) => acc + t.valor, 0);
    
    setResumo({
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      receitasPendentes,
      despesasPendentes,
    });
  }, []);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        loadedTransacoes,
        loadedFotos,
        loadedLembretes,
      ] = await Promise.all([
        transacoesStorage.getAll(),
        fotosEventosStorage.getAll(),
        lembretesStorage.getAll(),
      ]);

      setTransacoes(loadedTransacoes);
      setFotos(loadedFotos);
      setLembretes(loadedLembretes);
      calcularResumo(loadedTransacoes);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setIsLoading(false);
    }
  }, [calcularResumo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // FUNÇÕES DE TRANSAÇÕES
  // ============================================

  const addTransacao = useCallback(async (data: Omit<TransacaoFinanceira, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novaTransacao = await transacoesStorage.create(data);
    setTransacoes(prev => {
      const updated = [...prev, novaTransacao];
      calcularResumo(updated);
      return updated;
    });
    return novaTransacao;
  }, [calcularResumo]);

  const updateTransacao = useCallback(async (id: string, data: Partial<Omit<TransacaoFinanceira, 'id' | 'criadoEm'>>) => {
    const transacaoAtualizada = await transacoesStorage.update(id, data);
    if (transacaoAtualizada) {
      setTransacoes(prev => {
        const updated = prev.map(t => t.id === id ? transacaoAtualizada : t);
        calcularResumo(updated);
        return updated;
      });
    }
    return transacaoAtualizada;
  }, [calcularResumo]);

  const deleteTransacao = useCallback(async (id: string) => {
    const sucesso = await transacoesStorage.delete(id);
    if (sucesso) {
      setTransacoes(prev => {
        const updated = prev.filter(t => t.id !== id);
        calcularResumo(updated);
        return updated;
      });
    }
    return sucesso;
  }, [calcularResumo]);

  const getTransacoesByTipo = useCallback((tipo: 'receita' | 'despesa') => {
    return transacoes.filter(t => t.tipo === tipo);
  }, [transacoes]);

  const getTransacoesByPeriodo = useCallback((dataInicio: string, dataFim: string) => {
    return transacoes.filter(t => t.data >= dataInicio && t.data <= dataFim);
  }, [transacoes]);

  // ============================================
  // FUNÇÕES DE FOTOS
  // ============================================

  const addFoto = useCallback(async (data: Omit<FotoEvento, 'id' | 'criadoEm'>) => {
    const novaFoto = await fotosEventosStorage.create(data);
    setFotos(prev => [...prev, novaFoto]);
    return novaFoto;
  }, []);

  const deleteFoto = useCallback(async (id: string) => {
    const sucesso = await fotosEventosStorage.delete(id);
    if (sucesso) {
      setFotos(prev => prev.filter(f => f.id !== id));
    }
    return sucesso;
  }, []);

  const getFotosByEvento = useCallback((eventoId: string) => {
    return fotos.filter(f => f.eventoId === eventoId);
  }, [fotos]);

  // ============================================
  // FUNÇÕES DE LEMBRETES
  // ============================================

  const addLembrete = useCallback(async (data: Omit<Lembrete, 'id' | 'criadoEm'>) => {
    const novoLembrete = await lembretesStorage.create(data);
    setLembretes(prev => [...prev, novoLembrete]);
    return novoLembrete;
  }, []);

  const updateLembrete = useCallback(async (id: string, data: Partial<Omit<Lembrete, 'id' | 'criadoEm'>>) => {
    const lembreteAtualizado = await lembretesStorage.update(id, data);
    if (lembreteAtualizado) {
      setLembretes(prev => prev.map(l => l.id === id ? lembreteAtualizado : l));
    }
    return lembreteAtualizado;
  }, []);

  const deleteLembrete = useCallback(async (id: string) => {
    const sucesso = await lembretesStorage.delete(id);
    if (sucesso) {
      setLembretes(prev => prev.filter(l => l.id !== id));
    }
    return sucesso;
  }, []);

  const toggleLembrete = useCallback(async (id: string) => {
    const lembrete = lembretes.find(l => l.id === id);
    if (!lembrete) return null;
    
    const lembreteAtualizado = await lembretesStorage.update(id, { ativo: !lembrete.ativo });
    if (lembreteAtualizado) {
      setLembretes(prev => prev.map(l => l.id === id ? lembreteAtualizado : l));
    }
    return lembreteAtualizado;
  }, [lembretes]);

  const getLembretesAtivos = useCallback(() => {
    return lembretes.filter(l => l.ativo);
  }, [lembretes]);

  // Valor do contexto
  const value: FinanceiroContextType = {
    // Estado
    transacoes,
    fotos,
    lembretes,
    isLoading,
    resumo,

    // Funções de Transações
    addTransacao,
    updateTransacao,
    deleteTransacao,
    getTransacoesByTipo,
    getTransacoesByPeriodo,

    // Funções de Fotos
    addFoto,
    deleteFoto,
    getFotosByEvento,

    // Funções de Lembretes
    addLembrete,
    updateLembrete,
    deleteLembrete,
    toggleLembrete,
    getLembretesAtivos,

    // Utilitários
    refreshData: loadData,
  };

  return (
    <FinanceiroContext.Provider value={value}>
      {children}
    </FinanceiroContext.Provider>
  );
}

// Hook para usar o contexto
export function useFinanceiro(): FinanceiroContextType {
  const context = useContext(FinanceiroContext);
  if (context === undefined) {
    throw new Error('useFinanceiro deve ser usado dentro de um FinanceiroProvider');
  }
  return context;
}
