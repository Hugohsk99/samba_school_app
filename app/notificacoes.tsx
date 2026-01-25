/**
 * Tela de Notificações
 * 
 * Lista todas as notificações do usuário com opções de marcar como lida e excluir
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useNotificacoes, ICONES_NOTIFICACAO, CORES_NOTIFICACAO, TipoNotificacao } from "@/lib/notificacoes-context";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function NotificacoesScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    notificacoes,
    naoLidas,
    isLoading,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    recarregar,
  } = useNotificacoes();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await recarregar();
    setRefreshing(false);
  }, [recarregar]);

  const handleNotificacaoPress = async (notificacao: any) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Marcar como lida
    if (!notificacao.lida) {
      await marcarComoLida(notificacao.id);
    }

    // Navegar para ação se houver
    if (notificacao.acaoUrl) {
      router.push(notificacao.acaoUrl as any);
    }
  };

  const handleExcluir = (id: number) => {
    Alert.alert(
      "Excluir notificação",
      "Deseja excluir esta notificação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await excluirNotificacao(id);
          },
        },
      ]
    );
  };

  const handleMarcarTodasLidas = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await marcarTodasComoLidas();
  };

  const formatarData = (data: Date) => {
    const agora = new Date();
    const diff = agora.getTime() - new Date(data).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return "Agora";
    if (minutos < 60) return `${minutos}min`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return new Date(data).toLocaleDateString("pt-BR");
  };

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
        <Text className="text-xl font-bold text-foreground">Notificações</Text>
        {naoLidas > 0 ? (
          <TouchableOpacity
            onPress={handleMarcarTodasLidas}
            className="p-2 -mr-2"
          >
            <Text className="text-primary text-sm font-medium">Marcar todas</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-20" />
        )}
      </View>

      {/* Contador */}
      {naoLidas > 0 && (
        <View className="px-4 py-2 bg-primary/10">
          <Text className="text-primary text-sm font-medium">
            {naoLidas} notificação(ões) não lida(s)
          </Text>
        </View>
      )}

      {/* Lista */}
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
        ) : notificacoes.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">🔔</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Nenhuma notificação
            </Text>
            <Text className="text-muted text-center px-8">
              Você receberá notificações sobre solicitações de acesso, eventos e alertas importantes.
            </Text>
          </View>
        ) : (
          <View className="py-2">
            {notificacoes.map((notificacao) => (
              <TouchableOpacity
                key={notificacao.id}
                onPress={() => handleNotificacaoPress(notificacao)}
                onLongPress={() => handleExcluir(notificacao.id)}
                activeOpacity={0.8}
                className={`mx-4 my-1 p-4 rounded-xl border ${
                  notificacao.lida
                    ? "bg-surface border-border"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <View className="flex-row">
                  {/* Ícone */}
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: `${CORES_NOTIFICACAO[notificacao.tipo as TipoNotificacao]}20`,
                    }}
                  >
                    <Text className="text-2xl">
                      {ICONES_NOTIFICACAO[notificacao.tipo as TipoNotificacao]}
                    </Text>
                  </View>

                  {/* Conteúdo */}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className={`font-semibold ${
                          notificacao.lida ? "text-foreground" : "text-primary"
                        }`}
                        numberOfLines={1}
                      >
                        {notificacao.titulo}
                      </Text>
                      <Text className="text-xs text-muted ml-2">
                        {formatarData(notificacao.criadoEm)}
                      </Text>
                    </View>
                    <Text
                      className="text-sm text-muted"
                      numberOfLines={2}
                    >
                      {notificacao.mensagem}
                    </Text>

                    {/* Botão de ação */}
                    {notificacao.acaoTexto && (
                      <View className="mt-2">
                        <Text
                          className="text-sm font-medium"
                          style={{ color: CORES_NOTIFICACAO[notificacao.tipo as TipoNotificacao] }}
                        >
                          {notificacao.acaoTexto} →
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Indicador de não lida */}
                  {!notificacao.lida && (
                    <View
                      className="w-3 h-3 rounded-full ml-2"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
