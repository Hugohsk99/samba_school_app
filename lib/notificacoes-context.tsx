/**
 * Contexto de Notificações Internas
 * 
 * Gerencia notificações do sistema para o usuário logado
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { trpc } from "./trpc";
import { useAuth } from "@/hooks/use-auth";

// Tipos
export type TipoNotificacao = 
  | "solicitacao_acesso"
  | "usuario_aprovado"
  | "usuario_rejeitado"
  | "convite_enviado"
  | "convite_aceito"
  | "convite_expirando"
  | "material_pendente"
  | "evento_proximo"
  | "evento_criado"
  | "alerta_sistema"
  | "limite_usuarios"
  | "plano_expirando";

export interface NotificacaoInterna {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dados?: string | null;
  acaoUrl?: string | null;
  acaoTexto?: string | null;
  lida: boolean;
  criadoEm: Date;
  expiraEm?: Date | null;
}

interface NotificacoesContextType {
  notificacoes: NotificacaoInterna[];
  naoLidas: number;
  isLoading: boolean;
  marcarComoLida: (id: number) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  excluirNotificacao: (id: number) => Promise<void>;
  recarregar: () => Promise<void>;
}

const NotificacoesContext = createContext<NotificacoesContextType | undefined>(undefined);

// Ícones por tipo de notificação
export const ICONES_NOTIFICACAO: Record<TipoNotificacao, string> = {
  solicitacao_acesso: "👤",
  usuario_aprovado: "✅",
  usuario_rejeitado: "❌",
  convite_enviado: "📨",
  convite_aceito: "🎉",
  convite_expirando: "⏰",
  material_pendente: "📦",
  evento_proximo: "📅",
  evento_criado: "🎭",
  alerta_sistema: "⚠️",
  limite_usuarios: "👥",
  plano_expirando: "💳",
};

// Cores por tipo de notificação
export const CORES_NOTIFICACAO: Record<TipoNotificacao, string> = {
  solicitacao_acesso: "#3B82F6", // Azul
  usuario_aprovado: "#22C55E",   // Verde
  usuario_rejeitado: "#EF4444", // Vermelho
  convite_enviado: "#8B5CF6",   // Roxo
  convite_aceito: "#22C55E",    // Verde
  convite_expirando: "#F59E0B", // Amarelo
  material_pendente: "#F59E0B", // Amarelo
  evento_proximo: "#3B82F6",    // Azul
  evento_criado: "#8B5CF6",     // Roxo
  alerta_sistema: "#EF4444",    // Vermelho
  limite_usuarios: "#F59E0B",   // Amarelo
  plano_expirando: "#EF4444",   // Vermelho
};

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notificacoes, setNotificacoes] = useState<NotificacaoInterna[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Query para buscar notificações
  const notificacoesQuery = trpc.notificacoes.listar.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Mutations
  const marcarLidaMutation = trpc.notificacoes.marcarLida.useMutation();
  const marcarTodasLidasMutation = trpc.notificacoes.marcarTodasLidas.useMutation();
  const excluirMutation = trpc.notificacoes.excluir.useMutation();

  // Atualizar estado quando query retornar
  useEffect(() => {
    if (notificacoesQuery.data) {
      setNotificacoes(notificacoesQuery.data as NotificacaoInterna[]);
    }
    setIsLoading(notificacoesQuery.isLoading);
  }, [notificacoesQuery.data, notificacoesQuery.isLoading]);

  // Marcar como lida
  const marcarComoLida = useCallback(async (id: number) => {
    try {
      await marcarLidaMutation.mutateAsync({ id });
      setNotificacoes(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }, [marcarLidaMutation]);

  // Marcar todas como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await marcarTodasLidasMutation.mutateAsync();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    }
  }, [marcarTodasLidasMutation]);

  // Excluir notificação
  const excluirNotificacao = useCallback(async (id: number) => {
    try {
      await excluirMutation.mutateAsync({ id });
      setNotificacoes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  }, [excluirMutation]);

  // Recarregar
  const recarregar = useCallback(async () => {
    await notificacoesQuery.refetch();
  }, [notificacoesQuery]);

  // Calcular não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        naoLidas,
        isLoading,
        marcarComoLida,
        marcarTodasComoLidas,
        excluirNotificacao,
        recarregar,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (!context) {
    // Retornar valores padrão se não estiver dentro do provider
    return {
      notificacoes: [],
      naoLidas: 0,
      isLoading: false,
      marcarComoLida: async () => {},
      marcarTodasComoLidas: async () => {},
      excluirNotificacao: async () => {},
      recarregar: async () => {},
    };
  }
  return context;
}
