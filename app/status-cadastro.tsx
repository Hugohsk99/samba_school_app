/**
 * Tela 04 - Status do Cadastro
 * Mostra o status da solicitação de cadastro (pendente/aprovado/rejeitado)
 */

import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const STATUS_CADASTRO_KEY = "@samba_status_cadastro";

interface CadastroPendente {
  nome: string;
  cpf: string;
  status: "pendente" | "aprovado" | "rejeitado";
  dataCadastro: string;
  motivoRejeicao?: string;
}

export default function StatusCadastroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cpf?: string }>();
  const colors = useColors();
  const { integrantes } = useData();
  const { login: loginLocal } = useAuth();
  const { escola } = useEscola();

  const [cadastro, setCadastro] = useState<CadastroPendente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const corPrimaria = escola?.corPrimaria || colors.primary;

  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    try {
      if (!params.cpf) return;

      const dados = await AsyncStorage.getItem(
        `${STATUS_CADASTRO_KEY}_${params.cpf}`
      );

      if (dados) {
        const parsed = JSON.parse(dados);
        setCadastro(parsed);

        // Verificar se o integrante já foi aprovado (existe e está ativo)
        const integrante = integrantes.find(
          (i) => i.cpf?.replace(/\D/g, "") === params.cpf && i.ativo
        );

        if (integrante) {
          // Atualizar status para aprovado
          parsed.status = "aprovado";
          await AsyncStorage.setItem(
            `${STATUS_CADASTRO_KEY}_${params.cpf}`,
            JSON.stringify(parsed)
          );
          setCadastro(parsed);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntrar = async () => {
    if (!params.cpf) return;

    const integrante = integrantes.find(
      (i) => i.cpf?.replace(/\D/g, "") === params.cpf && i.ativo
    );

    if (integrante) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loginLocal(integrante);
      router.replace("/(tabs)");
    }
  };

  const handleWhatsApp = () => {
    const mensagem = encodeURIComponent(
      `Olá! Gostaria de saber o status do meu cadastro.\nCPF: ${params.cpf}\nNome: ${cadastro?.nome || ""}`
    );
    Linking.openURL(`https://wa.me/5521975841304?text=${mensagem}`);
  };

  const handleVoltar = () => {
    router.replace("/login-cpf" as any);
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={corPrimaria} />
        </View>
      </ScreenContainer>
    );
  }

  const statusConfig = {
    pendente: {
      icon: "⏳",
      titulo: "Cadastro em Análise",
      descricao:
        "Seu cadastro foi recebido e está sendo analisado pela diretoria da escola. Você receberá uma notificação quando for aprovado.",
      cor: colors.warning,
      corBg: colors.warning + "15",
    },
    aprovado: {
      icon: "✅",
      titulo: "Cadastro Aprovado!",
      descricao:
        "Parabéns! Seu cadastro foi aprovado. Você já pode acessar o app com todas as funcionalidades.",
      cor: colors.success,
      corBg: colors.success + "15",
    },
    rejeitado: {
      icon: "❌",
      titulo: "Cadastro Não Aprovado",
      descricao:
        cadastro?.motivoRejeicao ||
        "Infelizmente seu cadastro não foi aprovado. Entre em contato com a diretoria para mais informações.",
      cor: colors.error,
      corBg: colors.error + "15",
    },
  };

  const status = statusConfig[cadastro?.status || "pendente"];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="items-center pt-12 pb-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: status.corBg }}
          >
            <Text className="text-5xl">{status.icon}</Text>
          </View>

          <Text className="text-foreground text-2xl font-bold text-center mb-3">
            {status.titulo}
          </Text>

          <Text className="text-muted text-base text-center leading-6 px-4">
            {status.descricao}
          </Text>
        </View>

        {/* Info Card */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row justify-between mb-3">
            <Text className="text-muted text-sm">Nome</Text>
            <Text className="text-foreground text-sm font-medium">
              {cadastro?.nome || "—"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-muted text-sm">CPF</Text>
            <Text className="text-foreground text-sm font-medium">
              {params.cpf || "—"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-muted text-sm">Data do Cadastro</Text>
            <Text className="text-foreground text-sm font-medium">
              {cadastro?.dataCadastro
                ? new Date(cadastro.dataCadastro).toLocaleDateString("pt-BR")
                : "—"}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted text-sm">Status</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: status.corBg }}
            >
              <Text className="text-xs font-semibold" style={{ color: status.cor }}>
                {cadastro?.status === "pendente"
                  ? "Pendente"
                  : cadastro?.status === "aprovado"
                  ? "Aprovado"
                  : "Rejeitado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View className="flex-1 justify-end pb-8">
          {cadastro?.status === "aprovado" && (
            <TouchableOpacity
              onPress={handleEntrar}
              activeOpacity={0.8}
              className="rounded-xl py-4 items-center mb-3"
              style={{ backgroundColor: corPrimaria }}
            >
              <Text className="text-white text-base font-bold">
                Entrar no App
              </Text>
            </TouchableOpacity>
          )}

          {cadastro?.status === "pendente" && (
            <>
              <TouchableOpacity
                onPress={carregarStatus}
                activeOpacity={0.7}
                className="rounded-xl py-4 items-center mb-3 border border-border"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-foreground text-base font-medium">
                  🔄 Verificar Status
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleWhatsApp}
                activeOpacity={0.7}
                className="rounded-xl py-4 items-center mb-3"
                style={{ backgroundColor: "#25D366" + "15" }}
              >
                <Text style={{ color: "#25D366" }} className="text-base font-medium">
                  📱 Falar com a Diretoria
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={handleVoltar}
            activeOpacity={0.7}
            className="items-center py-3"
          >
            <Text className="text-muted text-sm">← Voltar para Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
