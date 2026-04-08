import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import { NotificationBadge } from "@/components/notification-badge";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  diretor_escola: "Diretor de Escola",
  diretor_carnaval: "Diretor de Carnaval",
  diretor_ala: "Diretor de Ala",
  diretor_segmento: "Diretor de Segmento",
  integrante: "Integrante",
  pendente: "Pendente",
};

const CATEGORIA_LABELS: Record<string, string> = {
  carnavalescos: "Carnavalescos",
  instrumentos: "Instrumentos",
  fantasias: "Fantasias",
  alegorias: "Alegorias",
  aderecos: "Adereços",
  equipamentos: "Equipamentos",
  moveis: "Móveis",
  outros: "Outros",
};

const STATUS_COLORS: Record<string, string> = {
  bom: "#22C55E",
  regular: "#F59E0B",
  ruim: "#EF4444",
  manutencao: "#3B82F6",
  baixado: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  manutencao: "Manutenção",
  baixado: "Baixado",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function PainelPresidenteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { usuario, role, isGestor: isGestorAuth } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Queries - Dashboard e Painel
  const dashMetricas = trpc.dashboard.metricas.useQuery(undefined, { retry: 1 });
  const painelMetricas = trpc.painel.metricasCompletas.useQuery(undefined, { retry: 1 });
  const pendentes = trpc.painel.pendentes.useQuery(undefined, { retry: 1 });
  const alertas = trpc.dashboard.alertas.useQuery(undefined, { retry: 1 });
  const atividade = trpc.dashboard.atividadeRecente.useQuery(undefined, { retry: 1 });

  // Mutations
  const aprovarMutation = trpc.usuarios.aprovar.useMutation();
  const rejeitarMutation = trpc.usuarios.rejeitar.useMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dashMetricas.refetch(),
      painelMetricas.refetch(),
      pendentes.refetch(),
      alertas.refetch(),
      atividade.refetch(),
    ]);
    setRefreshing(false);
  }, [dashMetricas, painelMetricas, pendentes, alertas, atividade]);

  const handleAprovar = (usuarioId: number, nome: string) => {
    Alert.alert("Aprovar usuário", `Deseja aprovar o acesso de ${nome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar",
        onPress: async () => {
          try {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await aprovarMutation.mutateAsync({ usuarioId, role: "integrante" });
            await pendentes.refetch();
            await dashMetricas.refetch();
            Alert.alert("Sucesso", "Usuário aprovado!");
          } catch { Alert.alert("Erro", "Não foi possível aprovar"); }
        },
      },
    ]);
  };

  const handleRejeitar = (usuarioId: number, nome: string) => {
    Alert.alert("Rejeitar usuário", `Deseja rejeitar o acesso de ${nome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rejeitar", style: "destructive",
        onPress: async () => {
          try {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await rejeitarMutation.mutateAsync({ usuarioId });
            await pendentes.refetch();
            Alert.alert("Sucesso", "Usuário rejeitado");
          } catch { Alert.alert("Erro", "Não foi possível rejeitar"); }
        },
      },
    ]);
  };

  const isGestor = isGestorAuth;
  const loading = dashMetricas.isLoading || painelMetricas.isLoading;
  const dm = dashMetricas.data as any;
  const pm = painelMetricas.data as any;
  const alertasList = (alertas.data || []) as any[];
  const atividadeList = (atividade.data || []) as any[];
  const pendentesList = (pendentes.data || []) as any[];

  if (!isGestor) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <MaterialIcons name="lock" size={64} color={colors.muted} />
        <Text className="text-xl font-bold text-foreground mt-4 mb-2">Acesso Restrito</Text>
        <Text className="text-muted text-center mb-6">Este painel é exclusivo para a diretoria.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-full">
          <Text className="text-background font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Painel da Diretoria</Text>
              <Text className="text-sm text-muted">
                Olá, {usuario?.nome?.split(" ")[0] || "Diretor"}
              </Text>
            </View>
          </View>
          <NotificationBadge size="medium" />
        </View>

        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Carregando métricas...</Text>
          </View>
        ) : (
          <>
            {/* Cards de Métricas Principais */}
            <View className="px-4 pt-2">
              <Text className="text-base font-semibold text-foreground mb-3">Visão Geral</Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {[
                  { title: "Integrantes", value: pm?.totalIntegrantes ?? dm?.usuarios?.aprovados ?? 0, icon: "people" as const, color: "#3B82F6" },
                  { title: "Pendentes", value: pm?.pendentesAprovacao ?? dm?.usuarios?.pendentes ?? 0, icon: "hourglass-empty" as const, color: "#F59E0B", route: "/fila-aprovacao" },
                  { title: "Patrimônio", value: pm?.totalAtivos ?? 0, icon: "inventory" as const, color: "#8B5CF6", route: "/ativos-fixos" },
                  { title: "Valor Total", value: formatCurrency(pm?.valorPatrimonio ?? 0), icon: "attach-money" as const, color: "#10B981" },
                  { title: "Convites", value: pm?.convitesAtivos ?? dm?.convites?.ativos ?? 0, icon: "mail" as const, color: "#06B6D4", route: "/convites" },
                  { title: "Notificações", value: pm?.notificacoesNaoLidas ?? 0, icon: "notifications" as const, color: "#EF4444", route: "/notificacoes" },
                ].map((card, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={card.route ? () => router.push(card.route as never) : undefined}
                    disabled={!card.route}
                    activeOpacity={card.route ? 0.7 : 1}
                    className="bg-surface rounded-2xl p-4 border border-border"
                    style={{ width: "48%", minWidth: 150 }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View style={{ backgroundColor: card.color + "20", borderRadius: 10, padding: 8 }}>
                        <MaterialIcons name={card.icon} size={22} color={card.color} />
                      </View>
                      {card.route && <MaterialIcons name="chevron-right" size={18} color={colors.muted} />}
                    </View>
                    <Text className="text-2xl font-bold text-foreground">{card.value}</Text>
                    <Text className="text-xs text-muted mt-1">{card.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Plano da Escola */}
            {pm?.escola && (
              <View className="mx-4 mt-6 bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <MaterialIcons name="verified" size={20} color="#8B5CF6" />
                  <Text className="text-base font-semibold text-foreground">Plano da Escola</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-muted">Plano Atual</Text>
                    <Text className="text-lg font-bold text-foreground capitalize">{pm.escola.plano || "Gratuito"}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-muted">Status</Text>
                    <View className="flex-row items-center gap-1">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pm.escola.planoAtivo ? "#22C55E" : "#EF4444" }} />
                      <Text className="text-sm font-medium text-foreground">{pm.escola.planoAtivo ? "Ativo" : "Inativo"}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/assinatura" as never)} className="mt-3 bg-primary/10 rounded-xl py-2 items-center">
                  <Text style={{ color: colors.primary }} className="font-semibold text-sm">Gerenciar Assinatura</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Alertas */}
            {alertasList.length > 0 && (
              <View className="mx-4 mt-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <MaterialIcons name="warning" size={20} color="#F59E0B" />
                  <Text className="text-base font-semibold text-foreground">Alertas ({alertasList.length})</Text>
                </View>
                {alertasList.slice(0, 5).map((alerta: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    onPress={alerta.acaoUrl ? () => router.push(alerta.acaoUrl as never) : undefined}
                    activeOpacity={0.7}
                    className="flex-row items-center p-3 rounded-xl mb-2"
                    style={{ backgroundColor: (alerta.cor || "#F59E0B") + "15" }}
                  >
                    <View style={{ backgroundColor: (alerta.cor || "#F59E0B") + "25" }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                      <MaterialIcons
                        name={alerta.tipo === "solicitacoes_pendentes" ? "person-add" : alerta.tipo === "plano_expirando" ? "credit-card" : "warning"}
                        size={20}
                        color={alerta.cor || "#F59E0B"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground text-sm">{alerta.titulo}</Text>
                      <Text className="text-xs text-muted">{alerta.mensagem}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Integrantes por Cargo */}
            {pm?.integrantesPorRole?.length > 0 && (
              <View className="mx-4 mt-6 bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <MaterialIcons name="badge" size={20} color="#3B82F6" />
                  <Text className="text-base font-semibold text-foreground">Integrantes por Cargo</Text>
                </View>
                {pm.integrantesPorRole.map((item: any, i: number) => (
                  <View key={i} className="flex-row items-center justify-between py-2 border-b border-border/50">
                    <Text className="text-sm text-foreground">{ROLE_LABELS[item.role] || item.role}</Text>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text style={{ color: colors.primary }} className="text-sm font-bold">{item.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Patrimônio por Categoria */}
            {pm?.ativosPorCategoria?.length > 0 && (
              <View className="mx-4 mt-6 bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="inventory" size={20} color="#8B5CF6" />
                    <Text className="text-base font-semibold text-foreground">Patrimônio por Categoria</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/ativos-fixos" as never)}>
                    <Text style={{ color: colors.primary }} className="text-sm font-medium">Ver Tudo</Text>
                  </TouchableOpacity>
                </View>
                {pm.ativosPorCategoria.map((item: any, i: number) => (
                  <View key={i} className="flex-row items-center justify-between py-2 border-b border-border/50">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm text-foreground">{CATEGORIA_LABELS[item.categoria] || item.categoria}</Text>
                      <View className="bg-muted/20 px-2 py-0.5 rounded-full">
                        <Text className="text-xs text-muted">{item.count}</Text>
                      </View>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">{formatCurrency(item.valorTotal)}</Text>
                  </View>
                ))}
                <View className="flex-row items-center justify-between pt-3 mt-1">
                  <Text className="text-sm font-bold text-foreground">Total</Text>
                  <Text className="text-base font-bold" style={{ color: colors.primary }}>{formatCurrency(pm.valorPatrimonio)}</Text>
                </View>
              </View>
            )}

            {/* Condição dos Ativos */}
            {pm?.ativosPorStatus?.length > 0 && (
              <View className="mx-4 mt-6 bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <MaterialIcons name="assessment" size={20} color="#10B981" />
                  <Text className="text-base font-semibold text-foreground">Condição dos Ativos</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {pm.ativosPorStatus.map((item: any, i: number) => {
                    const sc = STATUS_COLORS[item.status] || "#6B7280";
                    return (
                      <View key={i} style={{ backgroundColor: sc + "15", borderColor: sc + "40" }} className="rounded-xl px-4 py-2 border">
                        <Text style={{ color: sc }} className="text-lg font-bold text-center">{item.count}</Text>
                        <Text style={{ color: sc }} className="text-xs text-center">{STATUS_LABELS[item.status] || item.status}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Pendentes de Aprovação */}
            {pendentesList.length > 0 && (
              <View className="mx-4 mt-6">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="person-add" size={20} color="#F59E0B" />
                    <Text className="text-base font-semibold text-foreground">Pendentes ({pendentesList.length})</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/fila-aprovacao" as never)}>
                    <Text style={{ color: colors.primary }} className="text-sm font-medium">Ver Todos</Text>
                  </TouchableOpacity>
                </View>
                {pendentesList.slice(0, 5).map((u: any, i: number) => (
                  <View key={i} className="bg-surface rounded-xl p-4 border border-border mb-2">
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                        <MaterialIcons name="person" size={20} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{u.name || "Sem nome"}</Text>
                        <Text className="text-xs text-muted">{u.cpf || u.email || "—"}</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleAprovar(u.id, u.name || "Usuário")}
                        activeOpacity={0.8}
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: "#22C55E" }}
                      >
                        <Text className="text-white font-semibold text-sm">Aprovar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRejeitar(u.id, u.name || "Usuário")}
                        activeOpacity={0.8}
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: "#EF4444" }}
                      >
                        <Text className="text-white font-semibold text-sm">Rejeitar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Atividade Recente */}
            {atividadeList.length > 0 && (
              <View className="mx-4 mt-6 bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <MaterialIcons name="history" size={20} color="#6B7280" />
                  <Text className="text-base font-semibold text-foreground">Atividade Recente</Text>
                </View>
                {atividadeList.slice(0, 10).map((a: any, i: number) => (
                  <View key={i} className="flex-row items-start gap-3 py-2 border-b border-border/30">
                    <View style={{ backgroundColor: "#6B728020" }} className="w-8 h-8 rounded-full items-center justify-center mt-0.5">
                      <MaterialIcons name="event-note" size={16} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-foreground">{a.descricao || a.tipo}</Text>
                      <Text className="text-xs text-muted">{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : ""}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Ações Rápidas */}
            <View className="mx-4 mt-6 mb-6">
              <Text className="text-base font-semibold text-foreground mb-3">Ações Rápidas</Text>
              <View className="gap-2">
                {[
                  { icon: "inventory" as const, label: "Patrimônio (Ativos Fixos)", route: "/ativos-fixos", color: "#8B5CF6" },
                  { icon: "people" as const, label: "Gestão de Usuários", route: "/gestao-usuarios", color: "#3B82F6" },
                  { icon: "how-to-reg" as const, label: "Fila de Aprovação", route: "/fila-aprovacao", color: "#F59E0B" },
                  { icon: "mail" as const, label: "Convites", route: "/convites", color: "#06B6D4" },
                  { icon: "attach-money" as const, label: "Financeiro", route: "/financeiro", color: "#10B981" },
                  { icon: "event" as const, label: "Eventos", route: "/(tabs)/eventos", color: "#EF4444" },
                  { icon: "notifications" as const, label: "Notificações", route: "/notificacoes", color: "#F59E0B" },
                  { icon: "settings" as const, label: "Assinatura", route: "/assinatura", color: "#6B7280" },
                ].map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => router.push(action.route as never)}
                    activeOpacity={0.7}
                    className="flex-row items-center bg-surface rounded-xl p-3 border border-border gap-3"
                  >
                    <View style={{ backgroundColor: action.color + "15" }} className="rounded-lg p-2">
                      <MaterialIcons name={action.icon} size={20} color={action.color} />
                    </View>
                    <Text className="text-sm font-medium text-foreground flex-1">{action.label}</Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
