import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EscolaConfig, ESCOLA_CONFIG_PADRAO } from './types';

const STORAGE_KEY = '@gestao_samba:escola_config';

interface EscolaContextType {
  escola: EscolaConfig | null;
  isLoading: boolean;
  isFirstAccess: boolean;
  updateEscola: (data: Partial<EscolaConfig>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetConfig: () => Promise<void>;
  // Cores dinâmicas
  cores: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const EscolaContext = createContext<EscolaContextType | undefined>(undefined);

// Gerar ID único
const generateId = () => `escola_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function EscolaProvider({ children }: { children: ReactNode }) {
  const [escola, setEscola] = useState<EscolaConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configuração ao iniciar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as EscolaConfig;
        setEscola(parsed);
      } else {
        // Criar configuração padrão
        const novaConfig: EscolaConfig = {
          ...ESCOLA_CONFIG_PADRAO,
          id: generateId(),
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaConfig));
        setEscola(novaConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da escola:', error);
      // Criar configuração padrão em caso de erro
      const novaConfig: EscolaConfig = {
        ...ESCOLA_CONFIG_PADRAO,
        id: generateId(),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      setEscola(novaConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEscola = useCallback(async (data: Partial<EscolaConfig>) => {
    if (!escola) return;

    const updated: EscolaConfig = {
      ...escola,
      ...data,
      atualizadoEm: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setEscola(updated);
    } catch (error) {
      console.error('Erro ao atualizar configuração da escola:', error);
      throw error;
    }
  }, [escola]);

  const completeOnboarding = useCallback(async () => {
    await updateEscola({
      onboardingConcluido: true,
      primeiroAcesso: false,
    });
  }, [updateEscola]);

  const resetConfig = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const novaConfig: EscolaConfig = {
        ...ESCOLA_CONFIG_PADRAO,
        id: generateId(),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaConfig));
      setEscola(novaConfig);
    } catch (error) {
      console.error('Erro ao resetar configuração:', error);
      throw error;
    }
  }, []);

  // Cores dinâmicas baseadas na configuração
  const cores = {
    primary: escola?.corPrimaria || ESCOLA_CONFIG_PADRAO.corPrimaria,
    secondary: escola?.corSecundaria || ESCOLA_CONFIG_PADRAO.corSecundaria,
    accent: escola?.corAcento || escola?.corPrimaria || ESCOLA_CONFIG_PADRAO.corPrimaria,
  };

  const isFirstAccess = escola?.primeiroAcesso ?? true;

  return (
    <EscolaContext.Provider
      value={{
        escola,
        isLoading,
        isFirstAccess,
        updateEscola,
        completeOnboarding,
        resetConfig,
        cores,
      }}
    >
      {children}
    </EscolaContext.Provider>
  );
}

export function useEscola() {
  const context = useContext(EscolaContext);
  if (context === undefined) {
    throw new Error('useEscola deve ser usado dentro de um EscolaProvider');
  }
  return context;
}
