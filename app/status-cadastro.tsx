/**
 * Tela 04 - Status do Cadastro
 * Mostra o status da solicitação de cadastro (pendente/aprovado/rejeitado)
 * Integrado com banco de dados via tRPC
 */

import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

// Contatos para suporte
const CONTATOS = {
  whatsapp: "5521975841304",
  email: "100anosgestaodosamba@gmail.com",
};

export default function StatusCadastroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cpf?: string }>();
  const colors = useColors();
  const { usuario, loginCpf, logout } = useAuth();
  const { escola } = useEscola();

  const corPrimaria = escola?.corPrimaria || colors.primary;
  const [refreshing, setRefreshing] = useState(false);

  // Buscar perfil do usuário logado via tRPC
  const perfilQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!usuario,
    refetchInterval: 10000, // Verificar a cada 10s se foi aprovado
  });

  const statusUsuario = usuario?.statusUsuario || "pendente";
  const nomeUsuario = usuario?.nome || "Usuário";

  // Se foi aprovado, redirecionar para home
  useEffect(() => {
    if (perfilQuery.data && perfilQuery.data.role !== "pendente") {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/(tabs)" as any);
    }
  }, [perfilQuery.data]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    perfilQuery.refetch().finally(() => setRefreshing(false));
  }, []);

  const handleWhatsApp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const msg = encodeURIComponent(
      `Olá! Fiz meu cadastro no app 100 Anos - Gestão do Samba e gostaria de saber o status da minha aprovação. CPF: ${params.cpf || "N/A"}`
    );
    Linking.openURL(`https://wa.me/${CONTATOS.whatsapp}?text=${msg}`);
  };

  const handleVoltar = async () => {
    await logout();
    router.replace("/landing" as any);
  };

  const handleTentarNovamente = async () => {
    if (!params.cpf) return;
    // Re-tentar login para verificar status atualizado
    try {
      // Simplesmente recarregar
      perfilQuery.refetch();
    } catch (error) {
      // Ignorar
    }
  };

  const getStatusConfig = () => {
    switch (statusUsuario) {
      case "aprovado":
        return {
          icon: "✅",
          titulo: "Cadastro Aprovado!",
          subtitulo: `Parabéns, ${nomeUsuario}! Seu acesso foi liberado.`,
          cor: colors.success,
          corBg: colors.success + "15",
        };
      case "rejeitado":
        return {
          icon: "❌",
          titulo: "Cadastro Não Aprovado",
          subtitulo: "Infelizmente sua solicitação não foi aprovada.",
          cor: colors.error,
          corBg: colors.error + "15",
        };
      default:
        return {
          icon: "⏳",
          titulo: "Aguardando Aprovação",
          subtitulo: `${nomeUsuario}, seu cadastro está sendo analisado pela diretoria.`,
          cor: "#F59E0B",
          corBg: "#F59E0B" + "15",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-1 items-center justify-center px-6 py-8">
          {/* Status Icon */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: config.corBg }}
          >
            <Text className="text-5xl">{config.icon}</Text>
          </View>

          {/* Título */}
          <Text className="text-foreground text-2xl font-bold text-center mb-2">
            {config.titulo}
          </Text>
          <Text className="text-muted text-base text-center mb-8 px-4">
            {config.subtitulo}
          </Text>

          {/* Card de Informações */}
          <View
            className="w-full max-w-sm rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-muted text-sm">Status:</Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: config.corBg }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: config.cor }}
                  >
                    {statusUsuario === "pendente"
                      ? "Pendente"
                      : statusUsuario === "aprovado"
                      ? "Aprovado"
                      : "Rejeitado"}
                  </Text>
                </View>
              </View>

              {params.cpf && (
                <View className="flex-row justify-between">
                  <Text className="text-muted text-sm">CPF:</Text>
                  <Text className="text-foreground text-sm">
                    ***.***{params.cpf.slice(-5)}
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between">
                <Text className="text-muted text-sm">Escola:</Text>
                <Text className="text-foreground text-sm">
                  {escola?.nome || "Estácio de Sá"}
                </Text>
              </View>
            </View>
          </View>

          {/* Mensagem de Puxe para Atualizar */}
          {statusUsuario === "pendente" && (
            <View className="mb-6 items-center">
              <Text className="text-muted text-xs text-center">
                ↕ Puxe para baixo para verificar se foi aprovado
              </Text>
              <Text className="text-muted text-xs text-center mt-1">
                Verificação automática a cada 10 segundos
              </Text>
            </View>
          )}

          {/* Ações */}
          {statusUsuario === "pendente" && (
            <View className="w-full max-w-sm gap-3">
              {/* WhatsApp */}
              <TouchableOpacity
                onPress={handleWhatsApp}
                activeOpacity={0.7}
                className="flex-row items-center justify-center py-4 rounded-xl"
                style={{ backgroundColor: "#25D366" }}
              >
                <Text className="text-white text-base font-semibold">
                  📱 Falar com a Diretoria
                </Text>
              </TouchableOpacity>

              {/* Verificar Novamente */}
              <TouchableOpacity
                onPress={handleTentarNovamente}
                activeOpacity={0.7}
                className="flex-row items-center justify-center py-4 rounded-xl"
                style={{
                  backgroundColor: corPrimaria + "15",
                  borderWidth: 1,
                  borderColor: corPrimaria,
                }}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: corPrimaria }}
                >
                  🔄 Verificar Status
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {statusUsuario === "rejeitado" && (
            <View className="w-full max-w-sm gap-3">
              {/* Contatar */}
              <TouchableOpacity
                onPress={handleWhatsApp}
                activeOpacity={0.7}
                className="flex-row items-center justify-center py-4 rounded-xl"
                style={{ backgroundColor: "#25D366" }}
              >
                <Text className="text-white text-base font-semibold">
                  📱 Entrar em Contato
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {statusUsuario === "aprovado" && (
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)" as any)}
              activeOpacity={0.7}
              className="w-full max-w-sm py-4 rounded-xl items-center"
              style={{ backgroundColor: corPrimaria }}
            >
              <Text className="text-white text-base font-bold">
                Acessar o App
              </Text>
            </TouchableOpacity>
          )}

          {/* Voltar */}
          <TouchableOpacity
            onPress={handleVoltar}
            className="mt-6"
            activeOpacity={0.7}
          >
            <Text className="text-muted text-sm underline">
              Voltar para a tela inicial
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
