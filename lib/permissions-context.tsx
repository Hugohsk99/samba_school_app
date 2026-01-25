/**
 * Contexto de Permissões do Sistema
 * 
 * Gerencia permissões baseadas em roles e permissões customizadas
 * Integrado com o backend via tRPC
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "./trpc";
import { useAuth as useManusAuth } from "@/hooks/use-auth";

// ============================================
// TIPOS
// ============================================

export type Role = "master" | "presidente" | "diretor" | "coordenador" | "integrante" | "contribuinte";
export type StatusUsuario = "pendente" | "aprovado" | "rejeitado" | "suspenso";
export type Plano = "gratuito" | "basico" | "premium" | "enterprise";

export interface Escola {
  id: number;
  nome: string;
  slug: string;
  logoUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  plano: Plano;
  limiteUsuarios: number;
}

export interface UsuarioCompleto {
  id: number;
  openId: string;
  email: string | null;
  name: string | null;
  fotoUrl: string | null;
  role: Role;
  statusUsuario: StatusUsuario;
  escolaId: number | null;
  integranteId: string | null;
}

// Lista de permissões do sistema
export const PERMISSOES_SISTEMA = [
  // Escola
  "escola.editar",
  "escola.gerenciar_plano",
  "escola.aprovar_usuarios",
  
  // Usuários
  "usuarios.ver_todos",
  "usuarios.cadastrar",
  "usuarios.editar",
  "usuarios.excluir",
  "usuarios.alterar_role",
  
  // Blocos
  "blocos.ver_todos",
  "blocos.cadastrar",
  "blocos.editar",
  "blocos.excluir",
  
  // Eventos
  "eventos.ver_todos",
  "eventos.cadastrar",
  "eventos.editar",
  "eventos.excluir",
  "eventos.checkin",
  
  // Almoxarifado
  "almoxarifado.ver",
  "almoxarifado.cadastrar",
  "almoxarifado.editar",
  "almoxarifado.excluir",
  "almoxarifado.entregar_devolver",
  
  // Financeiro
  "financeiro.ver",
  "financeiro.cadastrar",
  "financeiro.editar",
  "financeiro.excluir",
  "financeiro.relatorios",
  
  // Relatórios
  "relatorios.presenca",
  "relatorios.financeiro",
  "relatorios.geral",
  
  // Configurações
  "configuracoes.acessar",
  "configuracoes.gestao_dados",
] as const;

export type PermissaoSistema = typeof PERMISSOES_SISTEMA[number];

// Mapeamento de permissões por role (espelho do backend)
export const PERMISSOES_POR_ROLE: Record<Role, PermissaoSistema[]> = {
  master: [...PERMISSOES_SISTEMA],
  
  presidente: [
    "escola.editar",
    "escola.gerenciar_plano",
    "escola.aprovar_usuarios",
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "usuarios.editar",
    "usuarios.excluir",
    "usuarios.alterar_role",
    "blocos.ver_todos",
    "blocos.cadastrar",
    "blocos.editar",
    "blocos.excluir",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.excluir",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.cadastrar",
    "almoxarifado.editar",
    "almoxarifado.excluir",
    "almoxarifado.entregar_devolver",
    "financeiro.ver",
    "financeiro.cadastrar",
    "financeiro.editar",
    "financeiro.excluir",
    "financeiro.relatorios",
    "relatorios.presenca",
    "relatorios.financeiro",
    "relatorios.geral",
    "configuracoes.acessar",
    "configuracoes.gestao_dados",
  ],
  
  diretor: [
    "escola.aprovar_usuarios",
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "usuarios.editar",
    "blocos.ver_todos",
    "blocos.editar",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.excluir",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.cadastrar",
    "almoxarifado.editar",
    "almoxarifado.excluir",
    "almoxarifado.entregar_devolver",
    "relatorios.presenca",
    "relatorios.geral",
  ],
  
  coordenador: [
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "usuarios.editar",
    "blocos.ver_todos",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.cadastrar",
    "almoxarifado.editar",
    "almoxarifado.entregar_devolver",
    "relatorios.presenca",
  ],
  
  integrante: [
    "blocos.ver_todos",
    "eventos.ver_todos",
  ],
  
  contribuinte: [
    "eventos.ver_todos",
  ],
};

// ============================================
// CONTEXTO
// ============================================

interface PermissionsContextType {
  // Estado
  user: UsuarioCompleto | null;
  escola: Escola | null;
  role: Role;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAprovado: boolean;
  isPendente: boolean;
  
  // Permissões
  permissoes: PermissaoSistema[];
  temPermissao: (permissao: PermissaoSistema) => boolean;
  temAlgumaPermissao: (permissoes: PermissaoSistema[]) => boolean;
  temTodasPermissoes: (permissoes: PermissaoSistema[]) => boolean;
  
  // Helpers
  isGestor: boolean;
  isAdmin: boolean;
  podeGerenciarUsuarios: boolean;
  podeAcessarFinanceiro: boolean;
  podeAcessarAlmoxarifado: boolean;
  podeAcessarRelatorios: boolean;
  
  // Ações
  recarregar: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user: manusUser, isAuthenticated: manusAuth, loading: manusLoading } = useManusAuth();
  
  const [user, setUser] = useState<UsuarioCompleto | null>(null);
  const [escola, setEscola] = useState<Escola | null>(null);
  const [permissoesCustomizadas, setPermissoesCustomizadas] = useState<{ permissao: string; valor: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Query do perfil completo
  const perfilQuery = trpc.auth.perfil.useQuery(undefined, {
    enabled: manusAuth && !manusLoading,
    retry: false,
  });

  // Atualizar estado quando dados mudarem
  useEffect(() => {
    if (perfilQuery.data) {
      setUser(perfilQuery.data.user as UsuarioCompleto);
      setEscola(perfilQuery.data.escola as Escola | null);
      setPermissoesCustomizadas(
        perfilQuery.data.permissoesCustomizadas.map((p: { permissao: string; valor: boolean }) => ({ 
          permissao: p.permissao, 
          valor: p.valor 
        }))
      );
      setIsLoading(false);
    } else if (perfilQuery.error) {
      setUser(null);
      setEscola(null);
      setIsLoading(false);
    }
  }, [perfilQuery.data, perfilQuery.error]);

  // Recarregar dados
  const recarregar = useCallback(async () => {
    setIsLoading(true);
    await perfilQuery.refetch();
  }, [perfilQuery]);

  // Role atual
  const role: Role = user?.role ?? "contribuinte";

  // Permissões do role
  const permissoesRole = useMemo(() => PERMISSOES_POR_ROLE[role], [role]);

  // Todas as permissões (role + customizadas)
  const permissoes = useMemo(() => {
    const todas = new Set<PermissaoSistema>(permissoesRole);
    
    // Adiciona permissões customizadas positivas
    permissoesCustomizadas.forEach(p => {
      if (p.valor && PERMISSOES_SISTEMA.includes(p.permissao as PermissaoSistema)) {
        todas.add(p.permissao as PermissaoSistema);
      }
    });
    
    // Remove permissões customizadas negativas
    permissoesCustomizadas.forEach(p => {
      if (!p.valor) {
        todas.delete(p.permissao as PermissaoSistema);
      }
    });
    
    return Array.from(todas);
  }, [permissoesRole, permissoesCustomizadas]);

  // Verificar permissão
  const temPermissao = useCallback((permissao: PermissaoSistema): boolean => {
    if (role === "master") return true;
    return permissoes.includes(permissao);
  }, [role, permissoes]);

  // Verificar se tem alguma das permissões
  const temAlgumaPermissao = useCallback((lista: PermissaoSistema[]): boolean => {
    return lista.some(p => temPermissao(p));
  }, [temPermissao]);

  // Verificar se tem todas as permissões
  const temTodasPermissoes = useCallback((lista: PermissaoSistema[]): boolean => {
    return lista.every(p => temPermissao(p));
  }, [temPermissao]);

  // Helpers de status
  const isAuthenticated = manusAuth && user !== null;
  const isAprovado = user?.statusUsuario === "aprovado";
  const isPendente = user?.statusUsuario === "pendente";

  // Helpers de role
  const isGestor = role === "master" || role === "presidente" || role === "diretor";
  const isAdmin = role === "master" || role === "presidente";
  
  // Helpers de acesso
  const podeGerenciarUsuarios = temAlgumaPermissao(["usuarios.ver_todos", "usuarios.cadastrar", "usuarios.editar"]);
  const podeAcessarFinanceiro = temAlgumaPermissao(["financeiro.ver", "financeiro.cadastrar"]);
  const podeAcessarAlmoxarifado = temAlgumaPermissao(["almoxarifado.ver", "almoxarifado.cadastrar"]);
  const podeAcessarRelatorios = temAlgumaPermissao(["relatorios.presenca", "relatorios.financeiro", "relatorios.geral"]);

  const value: PermissionsContextType = {
    user,
    escola,
    role,
    isLoading: isLoading || manusLoading,
    isAuthenticated,
    isAprovado,
    isPendente,
    permissoes,
    temPermissao,
    temAlgumaPermissao,
    temTodasPermissoes,
    isGestor,
    isAdmin,
    podeGerenciarUsuarios,
    podeAcessarFinanceiro,
    podeAcessarAlmoxarifado,
    podeAcessarRelatorios,
    recarregar,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions deve ser usado dentro de um PermissionsProvider");
  }
  return context;
}

// Hook para verificar permissão específica
export function useTemPermissao(permissao: PermissaoSistema) {
  const { temPermissao, isLoading } = usePermissions();
  return { permitido: temPermissao(permissao), isLoading };
}

// Hook para proteger componente
export function useProtectedComponent(permissao: PermissaoSistema) {
  const { temPermissao, isLoading, isAuthenticated, isAprovado } = usePermissions();
  
  return {
    isLoading,
    isAuthenticated,
    isAprovado,
    permitido: temPermissao(permissao),
    mensagem: !isAuthenticated 
      ? "Faça login para acessar"
      : !isAprovado 
        ? "Aguardando aprovação"
        : !temPermissao(permissao)
          ? "Você não tem permissão para acessar esta funcionalidade"
          : null,
  };
}

// ============================================
// COMPONENTES DE PROTEÇÃO
// ============================================

interface ProtectedProps {
  children: React.ReactNode;
  permissao?: PermissaoSistema;
  permissoes?: PermissaoSistema[];
  modo?: "todas" | "alguma";
  fallback?: React.ReactNode;
}

export function Protected({ 
  children, 
  permissao, 
  permissoes, 
  modo = "alguma",
  fallback = null 
}: ProtectedProps) {
  const { temPermissao, temAlgumaPermissao, temTodasPermissoes, isLoading } = usePermissions();
  
  if (isLoading) return null;
  
  // Verifica permissão única
  if (permissao && !temPermissao(permissao)) {
    return <>{fallback}</>;
  }
  
  // Verifica lista de permissões
  if (permissoes) {
    const temAcesso = modo === "todas" 
      ? temTodasPermissoes(permissoes)
      : temAlgumaPermissao(permissoes);
    
    if (!temAcesso) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}

// Componente para mostrar apenas para gestores
export function GestorOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isGestor, isLoading } = usePermissions();
  
  if (isLoading) return null;
  if (!isGestor) return <>{fallback}</>;
  
  return <>{children}</>;
}

// Componente para mostrar apenas para admins
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isAdmin, isLoading } = usePermissions();
  
  if (isLoading) return null;
  if (!isAdmin) return <>{fallback}</>;
  
  return <>{children}</>;
}
