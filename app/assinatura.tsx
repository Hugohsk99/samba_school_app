/**
 * Tela 06 - Gestão de Assinatura/Plano
 * Mostra status do plano, trial, e opção de renovação
 */

import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ASSINATURA_KEY = "@samba_assinatura";

interface Assinatura {
  tipo: "trial" | "anual";
  dataInicio: string;
  dataExpiracao: string;
  ativa: boolean;
  valorPago?: number;
}

export default function AssinaturaScreen() {
  const router = useRouter();
  const colors = useColors();
  const { escola } = useEscola();
  const { nivelAcesso } = useAuth();

  const corPrimaria = escola?.corPrimaria || colors.primary;

  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarAssinatura();
  }, []);

  const carregarAssinatura = async () => {
    try {
      const dados = await AsyncStorage.getItem(ASSINATURA_KEY);
      if (dados) {
        setAssinatura(JSON.parse(dados));
      } else {
        // Criar trial padrão (1 ano)
        const agora = new Date();
        const expiracao = new Date(agora);
        expiracao.setFullYear(expiracao.getFullYear() + 1);

        const novaAssinatura: Assinatura = {
          tipo: "trial",
          dataInicio: agora.toISOString(),
          dataExpiracao: expiracao.toISOString(),
          ativa: true,
        };

        await AsyncStorage.setItem(
          ASSINATURA_KEY,
          JSON.stringify(novaAssinatura)
        );
        setAssinatura(novaAssinatura);
      }
    } catch (error) {
      console.error("Erro ao carregar assinatura:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const diasRestantes = assinatura
    ? Math.max(
        0,
        Math.ceil(
          (new Date(assinatura.dataExpiracao).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const percentualRestante = assinatura
    ? Math.min(
        100,
        Math.max(
          0,
          (diasRestantes /
            (assinatura.tipo === "trial" ? 365 : 365)) *
            100
        )
      )
    : 0;

  const expirado = diasRestantes <= 0;
  const quaseExpirando = diasRestantes > 0 && diasRestantes <= 30;

  const handleRenovar = () => {
    const mensagem = encodeURIComponent(
      `Olá! Gostaria de renovar minha assinatura do app 100 Anos - Gestão do Samba.\nEscola: ${escola?.nome || "Não informada"}\nPlano: Anual (R$10,00)`
    );
    Linking.openURL(`https://wa.me/5521975841304?text=${mensagem}`);
  };

  const handleContato = () => {
    Linking.openURL("mailto:100anosgestaodosamba@gmail.com?subject=Assinatura%20-%20100%20Anos%20Gest%C3%A3o%20do%20Samba");
  };

  const funcionalidadesGratuitas = [
    { nome: "Visualizar eventos e calendário", icone: "📅" },
    { nome: "Receber notificações", icone: "🔔" },
    { nome: "Consultar informações da escola", icone: "🏫" },
    { nome: "Visualizar carteirinha digital", icone: "🪪" },
  ];

  const funcionalidadesPremium = [
    { nome: "Gestão completa de integrantes", icone: "👥" },
    { nome: "Controle de presença e check-in", icone: "✅" },
    { nome: "Gestão de almoxarifado/fantasias", icone: "👗" },
    { nome: "Dashboard financeiro", icone: "💰" },
    { nome: "Relatórios e estatísticas", icone: "📊" },
    { nome: "Gestão de alas e segmentos", icone: "🎭" },
    { nome: "Fila de aprovação de cadastros", icone: "📋" },
    { nome: "Painel do presidente", icone: "👑" },
    { nome: "Convites e gestão de usuários", icone: "📨" },
    { nome: "Galeria de fotos de eventos", icone: "📸" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="mr-3 p-2"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold flex-1">
          Assinatura
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Card */}
        <View className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
          {/* Banner */}
          <View
            className="px-5 py-6 items-center"
            style={{
              backgroundColor: expirado
                ? colors.error
                : quaseExpirando
                ? colors.warning
                : corPrimaria,
            }}
          >
            <Text className="text-white text-3xl mb-2">
              {expirado ? "⚠️" : assinatura?.tipo === "trial" ? "🎁" : "⭐"}
            </Text>
            <Text className="text-white text-xl font-bold">
              {expirado
                ? "Plano Expirado"
                : assinatura?.tipo === "trial"
                ? "Período de Avaliação"
                : "Plano Anual Ativo"}
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              {expirado
                ? "Renove para continuar usando"
                : `${diasRestantes} dias restantes`}
            </Text>
          </View>

          {/* Barra de progresso */}
          <View className="px-5 py-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted text-xs">
                Início: {assinatura ? new Date(assinatura.dataInicio).toLocaleDateString("pt-BR") : "—"}
              </Text>
              <Text className="text-muted text-xs">
                Expira: {assinatura ? new Date(assinatura.dataExpiracao).toLocaleDateString("pt-BR") : "—"}
              </Text>
            </View>
            <View className="h-2 rounded-full bg-border overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percentualRestante}%`,
                  backgroundColor: expirado
                    ? colors.error
                    : quaseExpirando
                    ? colors.warning
                    : colors.success,
                }}
              />
            </View>
          </View>
        </View>

        {/* Plano Anual */}
        <View className="mx-4 mt-4 rounded-2xl p-5 border-2" style={{ borderColor: corPrimaria, backgroundColor: colors.surface }}>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-foreground text-lg font-bold">Plano Anual</Text>
              <Text className="text-muted text-sm">Acesso completo por 1 ano</Text>
            </View>
            <View className="items-end">
              <Text className="text-foreground text-2xl font-bold" style={{ color: corPrimaria }}>
                R$ 10
              </Text>
              <Text className="text-muted text-xs">/ano</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRenovar}
            activeOpacity={0.8}
            className="rounded-xl py-3.5 items-center mt-2"
            style={{ backgroundColor: corPrimaria }}
          >
            <Text className="text-white text-base font-bold">
              {expirado ? "Renovar Agora" : "Assinar Plano Anual"}
            </Text>
          </TouchableOpacity>

          <Text className="text-muted text-xs text-center mt-3">
            Pagamento via PIX. Entre em contato para ativar.
          </Text>
        </View>

        {/* Funcionalidades Premium */}
        <View className="mx-4 mt-4 rounded-2xl p-5 border border-border" style={{ backgroundColor: colors.surface }}>
          <Text className="text-foreground text-base font-semibold mb-3">
            ⭐ Funcionalidades do Plano
          </Text>
          {funcionalidadesPremium.map((func, index) => (
            <View key={index} className="flex-row items-center py-2">
              <Text className="text-base mr-3">{func.icone}</Text>
              <Text className="text-foreground text-sm flex-1">{func.nome}</Text>
              <Text style={{ color: colors.success }}>✓</Text>
            </View>
          ))}
        </View>

        {/* Funcionalidades Gratuitas */}
        <View className="mx-4 mt-4 rounded-2xl p-5 border border-border" style={{ backgroundColor: colors.surface }}>
          <Text className="text-foreground text-base font-semibold mb-3">
            🆓 Sempre Disponível (mesmo expirado)
          </Text>
          {funcionalidadesGratuitas.map((func, index) => (
            <View key={index} className="flex-row items-center py-2">
              <Text className="text-base mr-3">{func.icone}</Text>
              <Text className="text-foreground text-sm flex-1">{func.nome}</Text>
              <Text style={{ color: colors.success }}>✓</Text>
            </View>
          ))}
        </View>

        {/* Contato */}
        <View className="mx-4 mt-4 rounded-2xl p-5 border border-border" style={{ backgroundColor: colors.surface }}>
          <Text className="text-foreground text-base font-semibold mb-3">
            📞 Precisa de Ajuda?
          </Text>

          <TouchableOpacity
            onPress={handleRenovar}
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-4 rounded-xl mb-2"
            style={{ backgroundColor: "#25D366" + "15" }}
          >
            <Text className="text-base mr-3">📱</Text>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">WhatsApp</Text>
              <Text className="text-muted text-xs">(21) 97584-1304</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContato}
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-4 rounded-xl"
            style={{ backgroundColor: corPrimaria + "15" }}
          >
            <Text className="text-base mr-3">📧</Text>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">E-mail</Text>
              <Text className="text-muted text-xs">100anosgestaodosamba@gmail.com</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
