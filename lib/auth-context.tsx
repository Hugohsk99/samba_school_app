/**
 * Contexto de Autenticação e Hierarquia de Permissões
 * 
 * Níveis de acesso:
 * - Diretoria: Acesso total a todas as funcionalidades
 * - Coordenador: Pode fazer check-in, ver relatórios da sua ala
 * - Integrante: Acesso apenas ao próprio perfil e QR Code
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Integrante, CategoriaIntegrante, CargoDiretoria } from "./types";

// Níveis de acesso
export type NivelAcesso = "diretoria" | "coordenador" | "integrante" | "visitante";

// Permissões disponíveis
export interface Permissoes {
  // Gestão de Integrantes
  verTodosIntegrantes: boolean;
  cadastrarIntegrante: boolean;
  editarIntegrante: boolean;
  excluirIntegrante: boolean;
  
  // Gestão de Blocos
  verTodosBlocos: boolean;
  cadastrarBloco: boolean;
  editarBloco: boolean;
  excluirBloco: boolean;
  
  // Gestão de Eventos
  verTodosEventos: boolean;
  cadastrarEvento: boolean;
  editarEvento: boolean;
  excluirEvento: boolean;
  
  // Check-in
  fazerCheckIn: boolean;
  verRelatoriosPresenca: boolean;
  
  // Almoxarifado
  verAlmoxarifado: boolean;
  cadastrarMaterial: boolean;
  editarMaterial: boolean;
  excluirMaterial: boolean;
  
  // Configurações
  acessarConfiguracoes: boolean;
  gestaoDados: boolean;
  
  // Próprio perfil
  verProprioPerfilApenas: boolean;
  verPropriaCarteirinha: boolean;
}

// Permissões por nível
const PERMISSOES_POR_NIVEL: Record<NivelAcesso, Permissoes> = {
  diretoria: {
    verTodosIntegrantes: true,
    cadastrarIntegrante: true,
    editarIntegrante: true,
    excluirIntegrante: true,
    verTodosBlocos: true,
    cadastrarBloco: true,
    editarBloco: true,
    excluirBloco: true,
    verTodosEventos: true,
    cadastrarEvento: true,
    editarEvento: true,
    excluirEvento: true,
    fazerCheckIn: true,
    verRelatoriosPresenca: true,
    verAlmoxarifado: true,
    cadastrarMaterial: true,
    editarMaterial: true,
    excluirMaterial: true,
    acessarConfiguracoes: true,
    gestaoDados: true,
    verProprioPerfilApenas: false,
    verPropriaCarteirinha: true,
  },
  coordenador: {
    verTodosIntegrantes: true,
    cadastrarIntegrante: true,
    editarIntegrante: true,
    excluirIntegrante: false,
    verTodosBlocos: true,
    cadastrarBloco: false,
    editarBloco: false,
    excluirBloco: false,
    verTodosEventos: true,
    cadastrarEvento: true,
    editarEvento: true,
    excluirEvento: false,
    fazerCheckIn: true,
    verRelatoriosPresenca: true,
    verAlmoxarifado: true,
    cadastrarMaterial: true,
    editarMaterial: true,
    excluirMaterial: false,
    acessarConfiguracoes: false,
    gestaoDados: false,
    verProprioPerfilApenas: false,
    verPropriaCarteirinha: true,
  },
  integrante: {
    verTodosIntegrantes: false,
    cadastrarIntegrante: false,
    editarIntegrante: false,
    excluirIntegrante: false,
    verTodosBlocos: false,
    cadastrarBloco: false,
    editarBloco: false,
    excluirBloco: false,
    verTodosEventos: true,
    cadastrarEvento: false,
    editarEvento: false,
    excluirEvento: false,
    fazerCheckIn: false,
    verRelatoriosPresenca: false,
    verAlmoxarifado: false,
    cadastrarMaterial: false,
    editarMaterial: false,
    excluirMaterial: false,
    acessarConfiguracoes: false,
    gestaoDados: false,
    verProprioPerfilApenas: true,
    verPropriaCarteirinha: true,
  },
  visitante: {
    verTodosIntegrantes: true,
    cadastrarIntegrante: true,
    editarIntegrante: true,
    excluirIntegrante: true,
    verTodosBlocos: true,
    cadastrarBloco: true,
    editarBloco: true,
    excluirBloco: true,
    verTodosEventos: true,
    cadastrarEvento: true,
    editarEvento: true,
    excluirEvento: true,
    fazerCheckIn: true,
    verRelatoriosPresenca: true,
    verAlmoxarifado: true,
    cadastrarMaterial: true,
    editarMaterial: true,
    excluirMaterial: true,
    acessarConfiguracoes: true,
    gestaoDados: true,
    verProprioPerfilApenas: false,
    verPropriaCarteirinha: true,
  },
};

// Sessão do usuário
export interface SessaoUsuario {
  integranteId: string;
  nome: string;
  foto?: string;
  categoria: CategoriaIntegrante;
  cargoDiretoria?: CargoDiretoria;
  nivelAcesso: NivelAcesso;
  blocosIds: string[];
  loginEm: string;
}

// Contexto
interface AuthContextType {
  sessao: SessaoUsuario | null;
  permissoes: Permissoes;
  nivelAcesso: NivelAcesso;
  isLoading: boolean;
  isLoggedIn: boolean;
  
  // Ações
  login: (integrante: Integrante) => Promise<void>;
  logout: () => Promise<void>;
  loginComoAdmin: () => Promise<void>;
  
  // Helpers
  temPermissao: (permissao: keyof Permissoes) => boolean;
  podeAcessarIntegrante: (integranteId: string) => boolean;
  podeAcessarBloco: (blocoId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@samba_school_sessao";

// Determinar nível de acesso baseado na categoria e cargo
function determinarNivelAcesso(integrante: Integrante): NivelAcesso {
  if (integrante.categoria === "diretoria") {
    // Cargos de diretoria com acesso total
    const cargosAltos: CargoDiretoria[] = [
      "presidente",
      "vice_presidente",
      "diretor_carnaval",
      "diretor_harmonia",
      "diretor_bateria",
      "diretor_comunicacao",
    ];
    
    if (integrante.cargoDiretoria && cargosAltos.includes(integrante.cargoDiretoria)) {
      return "diretoria";
    }
    
    // Coordenadores e staff
    if (integrante.cargoDiretoria === "coordenador") {
      return "coordenador";
    }
    
    // Staff tem acesso de coordenador
    return "coordenador";
  }
  
  // Segmentos e desfilantes são integrantes comuns
  return "integrante";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<SessaoUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar sessão salva
  useEffect(() => {
    const carregarSessao = async () => {
      try {
        const sessaoSalva = await AsyncStorage.getItem(STORAGE_KEY);
        if (sessaoSalva) {
          setSessao(JSON.parse(sessaoSalva));
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarSessao();
  }, []);

  // Salvar sessão
  const salvarSessao = useCallback(async (novaSessao: SessaoUsuario | null) => {
    try {
      if (novaSessao) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaSessao));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      setSessao(novaSessao);
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
    }
  }, []);

  // Login com integrante
  const login = useCallback(async (integrante: Integrante) => {
    const nivelAcesso = determinarNivelAcesso(integrante);
    
    const novaSessao: SessaoUsuario = {
      integranteId: integrante.id,
      nome: integrante.nome,
      foto: integrante.foto,
      categoria: integrante.categoria,
      cargoDiretoria: integrante.cargoDiretoria,
      nivelAcesso,
      blocosIds: integrante.blocosIds,
      loginEm: new Date().toISOString(),
    };
    
    await salvarSessao(novaSessao);
  }, [salvarSessao]);

  // Login como administrador (para desenvolvimento/testes)
  const loginComoAdmin = useCallback(async () => {
    const novaSessao: SessaoUsuario = {
      integranteId: "admin",
      nome: "Administrador",
      categoria: "diretoria",
      cargoDiretoria: "presidente",
      nivelAcesso: "diretoria",
      blocosIds: [],
      loginEm: new Date().toISOString(),
    };
    
    await salvarSessao(novaSessao);
  }, [salvarSessao]);

  // Logout
  const logout = useCallback(async () => {
    await salvarSessao(null);
  }, [salvarSessao]);

  // Obter nível de acesso atual
  const nivelAcesso: NivelAcesso = sessao?.nivelAcesso || "visitante";
  
  // Obter permissões do nível atual
  const permissoes = PERMISSOES_POR_NIVEL[nivelAcesso];

  // Verificar permissão específica
  const temPermissao = useCallback((permissao: keyof Permissoes): boolean => {
    return permissoes[permissao];
  }, [permissoes]);

  // Verificar se pode acessar um integrante específico
  const podeAcessarIntegrante = useCallback((integranteId: string): boolean => {
    if (permissoes.verTodosIntegrantes) return true;
    if (permissoes.verProprioPerfilApenas && sessao?.integranteId === integranteId) return true;
    return false;
  }, [permissoes, sessao]);

  // Verificar se pode acessar um bloco específico
  const podeAcessarBloco = useCallback((blocoId: string): boolean => {
    if (permissoes.verTodosBlocos) return true;
    if (sessao?.blocosIds.includes(blocoId)) return true;
    return false;
  }, [permissoes, sessao]);

  const value: AuthContextType = {
    sessao,
    permissoes,
    nivelAcesso,
    isLoading,
    isLoggedIn: sessao !== null,
    login,
    logout,
    loginComoAdmin,
    temPermissao,
    podeAcessarIntegrante,
    podeAcessarBloco,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Hook para verificar permissão e mostrar mensagem se não tiver
export function usePermissao(permissao: keyof Permissoes) {
  const { temPermissao, nivelAcesso } = useAuth();
  const permitido = temPermissao(permissao);
  
  return {
    permitido,
    nivelAcesso,
    mensagemBloqueio: permitido 
      ? null 
      : "Você não tem permissão para acessar esta funcionalidade.",
  };
}
