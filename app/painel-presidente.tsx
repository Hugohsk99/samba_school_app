/**
 * Painel do Presidente
 * 
 * Dashboard exclusivo para presidente/master com métricas da escola,
 * usuários pendentes, alertas e atividade recente.
 */

import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { NotificationBadge } from "@/components/notification-badge";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Componente de Card de Métrica
function MetricCard({
  titulo,
  valor,
  icone,
  cor,
  subtitulo,
  onPress,
}: {
  titulo: string;
  valor: number | string;
  icone: string;
  cor: string;
  subtitulo?: string;
  onPress?: () => void;
}) {
  const Content = (
    <View
      className="bg-surface rounded-2xl p-4 border border-border"
      style={{ minWidth: "47%" }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-2xl">{icone}</Text>
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: `${cor}20` }}
        >
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cor }}
          />
        </View>
      </View>
      <Text className="text-2xl font-bold text-foreground">{valor}</Text>
      <Text className="text-sm text-muted">{titulo}</Text>
      {subtitulo && (
        <Text className="text-xs text-muted mt-1">{subtitulo}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

// Componente de Alerta
function AlertaCard({
  alerta,
  onPress,
}: {
  alerta: {
    tipo: string;
    titulo: string;
    mensagem: string;
    cor: string;
    acaoUrl?: string;
  };
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{ backgroundColor: `${alerta.cor}15` }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${alerta.cor}25` }}
      >
        <Text className="text-lg">
          {alerta.tipo === "limite_usuarios" ? "👥" :
           alerta.tipo === "plano_expirando" ? "💳" :
           alerta.tipo === "solicitacoes_pendentes" ? "👤" :
           alerta.tipo === "convites_expirando" ? "📨" : "⚠️"}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{alerta.titulo}</Text>
        <Text className="text-sm text-muted">{alerta.mensagem}</Text>
      </View>
      <Text className="text-muted">→</Text>
    </TouchableOpacity>
  );
}

// Componente de Usuário Pendente
function UsuarioPendenteCard({
  usuario,
  onAprovar,
  onRejeitar,
}: {
  usuario: {
    id: number;
    name: string | null;
    email: string | null;
    criadoEm: Date;
  };
  onAprovar: () => void;
  onRejeitar: () => void;
}) {
  const colors = useColors();

  return (
    <View className="bg-surface rounded-xl p-4 border border-border mb-2">
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Text className="text-xl">👤</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-foreground">
            {usuario.name || "Sem nome"}
          </Text>
          <Text className="text-sm text-muted">{usuario.email}</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={onAprovar}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-lg items-center"
          style={{ backgroundColor: colors.success || "#22C55E" }}
        >
          <Text className="text-white font-semibold">✓ Aprovar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRejeitar}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-lg items-center"
          style={{ backgroundColor: colors.error || "#EF4444" }}
        >
          <Text className="text-white font-semibold">✕ Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PainelPresidenteScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const metricasQuery = trpc.dashboard.metricas.useQuery();
  const pendentesQuery = trpc.dashboard.usuariosPendentes.useQuery();
  const alertasQuery = trpc.dashboard.alertas.useQuery();
  const atividadeQuery = trpc.dashboard.atividadeRecente.useQuery();

  // Mutations
  const aprovarMutation = trpc.usuarios.aprovar.useMutation();
  const rejeitarMutation = trpc.usuarios.rejeitar.useMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      metricasQuery.refetch(),
      pendentesQuery.refetch(),
      alertasQuery.refetch(),
      atividadeQuery.refetch(),
    ]);
    setRefreshing(false);
  }, [metricasQuery, pendentesQuery, alertasQuery, atividadeQuery]);

  const handleAprovar = async (usuarioId: number, nome: string) => {
    Alert.alert(
      "Aprovar usuário",
      `Deseja aprovar o acesso de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: async () => {
            try {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              await aprovarMutation.mutateAsync({ usuarioId, role: "integrante" });
              await pendentesQuery.refetch();
              await metricasQuery.refetch();
              Alert.alert("Sucesso", "Usuário aprovado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível aprovar o usuário");
            }
          },
        },
      ]
    );
  };

  const handleRejeitar = async (usuarioId: number, nome: string) => {
    Alert.alert(
      "Rejeitar usuário",
      `Deseja rejeitar o acesso de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            try {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              await rejeitarMutation.mutateAsync({ usuarioId });
              await pendentesQuery.refetch();
              Alert.alert("Sucesso", "Usuário rejeitado");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível rejeitar o usuário");
            }
          },
        },
      ]
    );
  };

  const metricas = metricasQuery.data;
  const pendentes = pendentesQuery.data || [];
  const alertas = alertasQuery.data || [];
  const atividades = atividadeQuery.data || [];

  const isLoading = metricasQuery.isLoading;

  // Verificar permissão
  const isGestor = user && ["master", "presidente", "diretor"].includes((user as any).role || "");

  if (!isGestor) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-6xl mb-4">🔒</Text>
        <Text className="text-xl font-bold text-foreground mb-2">
          Acesso Restrito
        </Text>
        <Text className="text-muted text-center mb-6">
          Este painel é exclusivo para presidentes e diretores.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="p-2 -ml-2"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Painel do Presidente</Text>
        <NotificationBadge size="medium" />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="p-4">
            {/* Saudação */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-foreground">
                Olá, {user?.name?.split(" ")[0] || "Presidente"}! 👋
              </Text>
              <Text className="text-muted">
                Aqui está o resumo da sua escola
              </Text>
            </View>

            {/* Métricas Principais */}
            <Text className="text-lg font-bold text-foreground mb-3">
              📊 Métricas
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              <MetricCard
                titulo="Usuários Aprovados"
                valor={metricas?.usuarios.aprovados ?? 0}
                icone="👥"
                cor="#22C55E"
                subtitulo={`de ${metricas?.limiteUsuarios ?? 50} permitidos`}
                onPress={() => router.push("/gestao-usuarios")}
              />
              <MetricCard
                titulo="Pendentes"
                valor={metricas?.usuarios.pendentes ?? 0}
                icone="⏳"
                cor="#F59E0B"
                onPress={() => router.push("/gestao-usuarios")}
              />
              <MetricCard
                titulo="Convites Ativos"
                valor={metricas?.convitesAtivos ?? 0}
                icone="📨"
                cor="#8B5CF6"
                onPress={() => router.push("/convites")}
              />
              <MetricCard
                titulo="Plano"
                valor={(metricas?.plano ?? "gratuito").charAt(0).toUpperCase() + (metricas?.plano ?? "gratuito").slice(1)}
                icone="💳"
                cor="#3B82F6"
              />
            </View>

            {/* Distribuição por Role */}
            {metricas?.porRole && Object.keys(metricas.porRole).length > 0 && (
              <>
                <Text className="text-lg font-bold text-foreground mb-3">
                  👔 Distribuição por Cargo
                </Text>
                <View className="bg-surface rounded-xl p-4 border border-border mb-6">
                  {Object.entries(metricas.porRole).map(([role, count]) => (
                    <View key={role} className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0">
                      <Text className="text-foreground capitalize">{role}</Text>
                      <Text className="font-bold text-foreground">{count as number}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Alertas */}
            {alertas.length > 0 && (
              <>
                <Text className="text-lg font-bold text-foreground mb-3">
                  ⚠️ Alertas
                </Text>
                <View className="mb-6">
                  {alertas.map((alerta, index) => (
                    <AlertaCard
                      key={index}
                      alerta={alerta}
                      onPress={() => alerta.acaoUrl && router.push(alerta.acaoUrl as any)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Usuários Pendentes */}
            {pendentes.length > 0 && (
              <>
                <Text className="text-lg font-bold text-foreground mb-3">
                  👤 Aguardando Aprovação ({pendentes.length})
                </Text>
                <View className="mb-6">
                  {pendentes.slice(0, 5).map((usuario: any) => (
                    <UsuarioPendenteCard
                      key={usuario.id}
                      usuario={usuario}
                      onAprovar={() => handleAprovar(usuario.id, usuario.name || "usuário")}
                      onRejeitar={() => handleRejeitar(usuario.id, usuario.name || "usuário")}
                    />
                  ))}
                  {pendentes.length > 5 && (
                    <TouchableOpacity
                      onPress={() => router.push("/gestao-usuarios")}
                      className="py-3 items-center"
                    >
                      <Text className="text-primary font-medium">
                        Ver todos ({pendentes.length}) →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Atividade Recente */}
            {atividades.length > 0 && (
              <>
                <Text className="text-lg font-bold text-foreground mb-3">
                  📜 Atividade Recente
                </Text>
                <View className="bg-surface rounded-xl border border-border mb-6">
                  {atividades.slice(0, 10).map((atividade: any, index: number) => (
                    <View
                      key={atividade.id}
                      className={`p-3 ${index < atividades.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-foreground">
                          {atividade.acao} em {atividade.entidade}
                        </Text>
                        <Text className="text-xs text-muted">
                          {new Date(atividade.criadoEm).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Ações Rápidas */}
            <Text className="text-lg font-bold text-foreground mb-3">
              ⚡ Ações Rápidas
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              <TouchableOpacity
                onPress={() => router.push("/gestao-usuarios")}
                activeOpacity={0.8}
                className="bg-primary/10 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Text className="mr-2">👥</Text>
                <Text className="text-primary font-medium">Gerenciar Usuários</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/convites")}
                activeOpacity={0.8}
                className="bg-primary/10 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Text className="mr-2">📨</Text>
                <Text className="text-primary font-medium">Enviar Convites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/financeiro")}
                activeOpacity={0.8}
                className="bg-primary/10 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Text className="mr-2">💰</Text>
                <Text className="text-primary font-medium">Financeiro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
