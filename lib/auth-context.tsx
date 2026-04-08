/**
 * Contexto de Autenticação integrado ao banco de dados
 * 
 * Hierarquia de 7 níveis (conforme documento "100 Anos"):
 * 1. master - Acesso total global
 * 2. diretor_escola - Máximo dentro da escola
 * 3. diretor_carnaval - Operacional avançado
 * 4. diretor_ala - Restrito à ala
 * 5. diretor_segmento - Restrito ao segmento
 * 6. integrante - Membro aprovado (leitura)
 * 7. pendente - Aguardando aprovação
 * 
 * Fluxo:
 * Landing → Login CPF → (cadastro se novo) → Home
 * Dados persistidos em AsyncStorage + banco de dados via tRPC
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "./trpc";

// Roles do sistema (espelha o schema do banco)
export type RoleSistema =
  | "master"
  | "diretor_escola"
  | "diretor_carnaval"
  | "diretor_ala"
  | "diretor_segmento"
  | "integrante"
  | "pendente";

export type StatusUsuario = "pendente" | "aprovado" | "rejeitado" | "suspenso";

// Mapeamento de nível de acesso legado para compatibilidade
export type NivelAcesso = "diretoria" | "coordenador" | "integrante" | "visitante";

// Dados do usuário logado
export interface UsuarioLogado {
  id: number;
  cpf: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  role: RoleSistema;
  statusUsuario: StatusUsuario;
  escolaId?: number | null;
  alaId?: string | null;
  segmentoId?: string | null;
  fotoUrl?: string | null;
  escola?: {
    id: number;
    nome: string;
    slug: string;
    logoUrl?: string | null;
    corPrimaria?: string | null;
    corSecundaria?: string | null;
    plano: string;
  } | null;
}

// Permissões do sistema
export interface Permissoes {
  verTodosIntegrantes: boolean;
  cadastrarIntegrante: boolean;
  editarIntegrante: boolean;
  excluirIntegrante: boolean;
  verTodosBlocos: boolean;
  cadastrarBloco: boolean;
  editarBloco: boolean;
  excluirBloco: boolean;
  verTodosEventos: boolean;
  cadastrarEvento: boolean;
  editarEvento: boolean;
  excluirEvento: boolean;
  fazerCheckIn: boolean;
  verRelatoriosPresenca: boolean;
  verAlmoxarifado: boolean;
  cadastrarMaterial: boolean;
  editarMaterial: boolean;
  excluirMaterial: boolean;
  acessarConfiguracoes: boolean;
  gestaoDados: boolean;
  verProprioPerfilApenas: boolean;
  verPropriaCarteirinha: boolean;
  gerenciarUsuarios: boolean;
  aprovarUsuarios: boolean;
  gerenciarFinanceiro: boolean;
  verPainelPresidente: boolean;
}

// Permissões por role
const PERMISSOES_POR_ROLE: Record<RoleSistema, Permissoes> = {
  master: {
    verTodosIntegrantes: true, cadastrarIntegrante: true, editarIntegrante: true, excluirIntegrante: true,
    verTodosBlocos: true, cadastrarBloco: true, editarBloco: true, excluirBloco: true,
    verTodosEventos: true, cadastrarEvento: true, editarEvento: true, excluirEvento: true,
    fazerCheckIn: true, verRelatoriosPresenca: true,
    verAlmoxarifado: true, cadastrarMaterial: true, editarMaterial: true, excluirMaterial: true,
    acessarConfiguracoes: true, gestaoDados: true,
    verProprioPerfilApenas: false, verPropriaCarteirinha: true,
    gerenciarUsuarios: true, aprovarUsuarios: true, gerenciarFinanceiro: true, verPainelPresidente: true,
  },
  diretor_escola: {
    verTodosIntegrantes: true, cadastrarIntegrante: true, editarIntegrante: true, excluirIntegrante: true,
    verTodosBlocos: true, cadastrarBloco: true, editarBloco: true, excluirBloco: true,
    verTodosEventos: true, cadastrarEvento: true, editarEvento: true, excluirEvento: true,
    fazerCheckIn: true, verRelatoriosPresenca: true,
    verAlmoxarifado: true, cadastrarMaterial: true, editarMaterial: true, excluirMaterial: true,
    acessarConfiguracoes: true, gestaoDados: true,
    verProprioPerfilApenas: false, verPropriaCarteirinha: true,
    gerenciarUsuarios: true, aprovarUsuarios: true, gerenciarFinanceiro: true, verPainelPresidente: true,
  },
  diretor_carnaval: {
    verTodosIntegrantes: true, cadastrarIntegrante: true, editarIntegrante: true, excluirIntegrante: true,
    verTodosBlocos: true, cadastrarBloco: true, editarBloco: true, excluirBloco: true,
    verTodosEventos: true, cadastrarEvento: true, editarEvento: true, excluirEvento: true,
    fazerCheckIn: true, verRelatoriosPresenca: true,
    verAlmoxarifado: true, cadastrarMaterial: true, editarMaterial: true, excluirMaterial: true,
    acessarConfiguracoes: true, gestaoDados: true,
    verProprioPerfilApenas: false, verPropriaCarteirinha: true,
    gerenciarUsuarios: true, aprovarUsuarios: true, gerenciarFinanceiro: true, verPainelPresidente: true,
  },
  diretor_ala: {
    verTodosIntegrantes: true, cadastrarIntegrante: true, editarIntegrante: true, excluirIntegrante: false,
    verTodosBlocos: true, cadastrarBloco: false, editarBloco: false, excluirBloco: false,
    verTodosEventos: true, cadastrarEvento: true, editarEvento: true, excluirEvento: false,
    fazerCheckIn: true, verRelatoriosPresenca: true,
    verAlmoxarifado: true, cadastrarMaterial: true, editarMaterial: true, excluirMaterial: false,
    acessarConfiguracoes: false, gestaoDados: false,
    verProprioPerfilApenas: false, verPropriaCarteirinha: true,
    gerenciarUsuarios: false, aprovarUsuarios: true, gerenciarFinanceiro: false, verPainelPresidente: false,
  },
  diretor_segmento: {
    verTodosIntegrantes: true, cadastrarIntegrante: true, editarIntegrante: true, excluirIntegrante: false,
    verTodosBlocos: true, cadastrarBloco: false, editarBloco: false, excluirBloco: false,
    verTodosEventos: true, cadastrarEvento: false, editarEvento: false, excluirEvento: false,
    fazerCheckIn: true, verRelatoriosPresenca: true,
    verAlmoxarifado: true, cadastrarMaterial: false, editarMaterial: false, excluirMaterial: false,
    acessarConfiguracoes: false, gestaoDados: false,
    verProprioPerfilApenas: false, verPropriaCarteirinha: true,
    gerenciarUsuarios: false, aprovarUsuarios: false, gerenciarFinanceiro: false, verPainelPresidente: false,
  },
  integrante: {
    verTodosIntegrantes: false, cadastrarIntegrante: false, editarIntegrante: false, excluirIntegrante: false,
    verTodosBlocos: false, cadastrarBloco: false, editarBloco: false, excluirBloco: false,
    verTodosEventos: true, cadastrarEvento: false, editarEvento: false, excluirEvento: false,
    fazerCheckIn: false, verRelatoriosPresenca: false,
    verAlmoxarifado: false, cadastrarMaterial: false, editarMaterial: false, excluirMaterial: false,
    acessarConfiguracoes: false, gestaoDados: false,
    verProprioPerfilApenas: true, verPropriaCarteirinha: true,
    gerenciarUsuarios: false, aprovarUsuarios: false, gerenciarFinanceiro: false, verPainelPresidente: false,
  },
  pendente: {
    verTodosIntegrantes: false, cadastrarIntegrante: false, editarIntegrante: false, excluirIntegrante: false,
    verTodosBlocos: false, cadastrarBloco: false, editarBloco: false, excluirBloco: false,
    verTodosEventos: false, cadastrarEvento: false, editarEvento: false, excluirEvento: false,
    fazerCheckIn: false, verRelatoriosPresenca: false,
    verAlmoxarifado: false, cadastrarMaterial: false, editarMaterial: false, excluirMaterial: false,
    acessarConfiguracoes: false, gestaoDados: false,
    verProprioPerfilApenas: true, verPropriaCarteirinha: false,
    gerenciarUsuarios: false, aprovarUsuarios: false, gerenciarFinanceiro: false, verPainelPresidente: false,
  },
};

// Mapear role do banco para NivelAcesso legado (compatibilidade)
function roleParaNivelAcesso(role: RoleSistema): NivelAcesso {
  switch (role) {
    case "master":
    case "diretor_escola":
    case "diretor_carnaval":
      return "diretoria";
    case "diretor_ala":
    case "diretor_segmento":
      return "coordenador";
    case "integrante":
      return "integrante";
    case "pendente":
    default:
      return "visitante";
  }
}

// Sessão legada para compatibilidade com telas existentes
export interface SessaoUsuario {
  integranteId: string;
  nome: string;
  foto?: string;
  categoria: string;
  cargoDiretoria?: string;
  nivelAcesso: NivelAcesso;
  blocosIds: string[];
  loginEm: string;
  // Novos campos do banco
  userId?: number;
  role?: RoleSistema;
  statusUsuario?: StatusUsuario;
  escolaId?: number;
  cpf?: string;
}

// Contexto
interface AuthContextType {
  // Dados do usuário
  sessao: SessaoUsuario | null;
  usuario: UsuarioLogado | null;
  permissoes: Permissoes;
  nivelAcesso: NivelAcesso;
  role: RoleSistema;
  isLoading: boolean;
  isLoggedIn: boolean;
  
  // Ações de login
  loginCpf: (cpf: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  loginComoAdmin: () => Promise<void>;
  login: (integrante: any) => Promise<void>;
  logout: () => Promise<void>;
  
  // Registro
  registrarCpf: (dados: {
    cpf: string;
    senha: string;
    nome: string;
    email?: string;
    telefone?: string;
    escolaId: number;
    comprovantePix?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  
  registrarDiretorCarnaval: (dados: {
    cpf: string;
    senha: string;
    nome: string;
    email?: string;
    telefone?: string;
    escolaId: number;
  }) => Promise<{ success: boolean; error?: string }>;
  
  // Helpers
  temPermissao: (permissao: keyof Permissoes) => boolean;
  podeAcessarIntegrante: (integranteId: string) => boolean;
  podeAcessarBloco: (blocoId: string) => boolean;
  isGestor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSAO_KEY = "@samba_sessao_v2";
const USUARIO_KEY = "@samba_usuario_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<SessaoUsuario | null>(null);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // tRPC mutations
  const loginCpfMutation = trpc.auth.loginCpf.useMutation();
  const registrarCpfMutation = trpc.auth.registrarCpf.useMutation();
  const registrarDiretorMutation = trpc.auth.registrarDiretorCarnaval.useMutation();

  // Carregar sessão salva do AsyncStorage
  useEffect(() => {
    const carregarSessao = async () => {
      try {
        const [sessaoSalva, usuarioSalvo] = await Promise.all([
          AsyncStorage.getItem(SESSAO_KEY),
          AsyncStorage.getItem(USUARIO_KEY),
        ]);
        
        if (sessaoSalva) {
          setSessao(JSON.parse(sessaoSalva));
        }
        if (usuarioSalvo) {
          setUsuario(JSON.parse(usuarioSalvo));
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
  const salvarSessao = useCallback(async (
    novaSessao: SessaoUsuario | null,
    novoUsuario: UsuarioLogado | null
  ) => {
    try {
      if (novaSessao) {
        await AsyncStorage.setItem(SESSAO_KEY, JSON.stringify(novaSessao));
      } else {
        await AsyncStorage.removeItem(SESSAO_KEY);
      }
      if (novoUsuario) {
        await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(novoUsuario));
      } else {
        await AsyncStorage.removeItem(USUARIO_KEY);
      }
      setSessao(novaSessao);
      setUsuario(novoUsuario);
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
    }
  }, []);

  // Login por CPF + Senha (via banco de dados)
  const loginCpf = useCallback(async (cpf: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginCpfMutation.mutateAsync({ cpf, senha });
      
      if (!result.success || !result.user) {
        return { success: false, error: result.error || "Erro desconhecido" };
      }

      const user = result.user;
      const role = (user.role as RoleSistema) || "pendente";
      const nivelAcesso = roleParaNivelAcesso(role);

      const novoUsuario: UsuarioLogado = {
        id: user.id,
        cpf: user.cpf || cpf,
        nome: user.nome || "",
        email: user.email,
        telefone: user.telefone,
        role,
        statusUsuario: (user.statusUsuario as StatusUsuario) || "pendente",
        escolaId: user.escolaId,
        alaId: user.alaId,
        segmentoId: user.segmentoId,
        fotoUrl: user.fotoUrl,
        escola: user.escola ? {
          id: user.escola.id,
          nome: user.escola.nome,
          slug: user.escola.slug,
          logoUrl: user.escola.logoUrl,
          corPrimaria: user.escola.corPrimaria,
          corSecundaria: user.escola.corSecundaria,
          plano: user.escola.plano,
        } : null,
      };

      // Criar sessão legada para compatibilidade
      const novaSessao: SessaoUsuario = {
        integranteId: String(user.id),
        nome: user.nome || "",
        foto: user.fotoUrl || undefined,
        categoria: nivelAcesso === "diretoria" ? "diretoria" : "integrante",
        cargoDiretoria: role === "diretor_carnaval" ? "diretor_carnaval" : undefined,
        nivelAcesso,
        blocosIds: [],
        loginEm: new Date().toISOString(),
        userId: user.id,
        role,
        statusUsuario: (user.statusUsuario as StatusUsuario) || "pendente",
        escolaId: user.escolaId || undefined,
        cpf: user.cpf || cpf,
      };

      await salvarSessao(novaSessao, novoUsuario);
      return { success: true };
    } catch (error: any) {
      console.error("Erro no login CPF:", error);
      // Se o banco não estiver disponível, tentar login local
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  }, [loginCpfMutation, salvarSessao]);

  // Registrar novo usuário por CPF
  const registrarCpf = useCallback(async (dados: {
    cpf: string;
    senha: string;
    nome: string;
    email?: string;
    telefone?: string;
    escolaId: number;
    comprovantePix?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registrarCpfMutation.mutateAsync(dados);
      
      if (!result.success) {
        return { success: false, error: result.error || "Erro no cadastro" };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Erro no registro:", error);
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  }, [registrarCpfMutation]);

  // Registrar primeiro diretor de carnaval
  const registrarDiretorCarnaval = useCallback(async (dados: {
    cpf: string;
    senha: string;
    nome: string;
    email?: string;
    telefone?: string;
    escolaId: number;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registrarDiretorMutation.mutateAsync(dados);
      
      if (!result.success) {
        const errorMsg = result.error === "escola_ja_tem_diretor_carnaval"
          ? "Esta escola já possui um Diretor de Carnaval."
          : result.error === "cpf_ja_cadastrado"
          ? "Este CPF já está cadastrado."
          : "Erro no cadastro";
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Erro no registro diretor:", error);
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  }, [registrarDiretorMutation]);

  // Login legado (compatibilidade com telas que usam Integrante local)
  const login = useCallback(async (integrante: any) => {
    const novaSessao: SessaoUsuario = {
      integranteId: integrante.id || "local",
      nome: integrante.nome || "Usuário",
      foto: integrante.foto,
      categoria: integrante.categoria || "integrante",
      cargoDiretoria: integrante.cargoDiretoria,
      nivelAcesso: "diretoria", // Local = acesso total
      blocosIds: integrante.blocosIds || [],
      loginEm: new Date().toISOString(),
    };
    await salvarSessao(novaSessao, null);
  }, [salvarSessao]);

  // Login como Master (para testes)
  const loginComoAdmin = useCallback(async () => {
    const adminUsuario: UsuarioLogado = {
      id: 0,
      cpf: "00000000000",
      nome: "Administrador Master",
      role: "master",
      statusUsuario: "aprovado",
    };

    const novaSessao: SessaoUsuario = {
      integranteId: "admin",
      nome: "Administrador Master",
      categoria: "diretoria",
      cargoDiretoria: "presidente",
      nivelAcesso: "diretoria",
      blocosIds: [],
      loginEm: new Date().toISOString(),
      userId: 0,
      role: "master",
      statusUsuario: "aprovado",
    };
    
    await salvarSessao(novaSessao, adminUsuario);
  }, [salvarSessao]);

  // Logout
  const logout = useCallback(async () => {
    await salvarSessao(null, null);
    // Limpar escola selecionada também
    await AsyncStorage.removeItem("@samba_escola_selecionada");
  }, [salvarSessao]);

  // Calcular role e permissões
  const role: RoleSistema = usuario?.role || sessao?.role || "pendente";
  const nivelAcesso: NivelAcesso = sessao?.nivelAcesso || roleParaNivelAcesso(role);
  const permissoes = PERMISSOES_POR_ROLE[role] || PERMISSOES_POR_ROLE.pendente;
  const isGestor = ["master", "diretor_escola", "diretor_carnaval", "diretor_ala"].includes(role);

  // Verificar permissão
  const temPermissao = useCallback((permissao: keyof Permissoes): boolean => {
    return permissoes[permissao];
  }, [permissoes]);

  // Verificar acesso a integrante
  const podeAcessarIntegrante = useCallback((integranteId: string): boolean => {
    if (permissoes.verTodosIntegrantes) return true;
    if (permissoes.verProprioPerfilApenas && sessao?.integranteId === integranteId) return true;
    return false;
  }, [permissoes, sessao]);

  // Verificar acesso a bloco
  const podeAcessarBloco = useCallback((blocoId: string): boolean => {
    if (permissoes.verTodosBlocos) return true;
    if (sessao?.blocosIds?.includes(blocoId)) return true;
    return false;
  }, [permissoes, sessao]);

  const value: AuthContextType = {
    sessao,
    usuario,
    permissoes,
    nivelAcesso,
    role,
    isLoading,
    isLoggedIn: sessao !== null,
    loginCpf,
    loginComoAdmin,
    login,
    logout,
    registrarCpf,
    registrarDiretorCarnaval,
    temPermissao,
    podeAcessarIntegrante,
    podeAcessarBloco,
    isGestor,
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

// Hook para verificar permissão
export function usePermissao(permissao: keyof Permissoes) {
  const { temPermissao, nivelAcesso, role } = useAuth();
  const permitido = temPermissao(permissao);
  
  return {
    permitido,
    nivelAcesso,
    role,
    mensagemBloqueio: permitido 
      ? null 
      : "Você não tem permissão para acessar esta funcionalidade.",
  };
}
