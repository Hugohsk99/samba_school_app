/**
 * Tela 01 - Landing / Seleção de Escola
 * Primeira tela do app - exibe escolas disponíveis
 * 
 * Fluxo:
 * 1. Usuário vê escolas cadastradas
 * 2. Seleciona uma escola
 * 3. Se escola NÃO tem Diretor de Carnaval → registro-diretor-carnaval
 * 4. Se escola TEM Diretor de Carnaval → login-cpf
 * 5. Botão "+" → contato-associacao
 */

import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useEscola } from "@/lib/escola-context";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ESCOLA_SELECIONADA_KEY = "@samba_escola_selecionada";

// Escola padrão: Estácio S.A.
const ESCOLAS_INICIAIS = [
  {
    id: 1,
    dbId: 1,
    nome: "Estácio de Sá",
    sigla: "Estácio S.A.",
    fundacao: "1928",
    cores: ["#CC0000", "#FFFFFF"],
    corPrimaria: "#CC0000",
    bairro: "Estácio, Rio de Janeiro",
    logo: null as string | null,
  },
];

// Contatos para associação
const CONTATOS = {
  email: "100anosgestaodosamba@gmail.com",
  whatsapp1: "5521975841304",
  whatsapp2: "5521999304505",
  telefone1: "(21) 97584-1304",
  telefone2: "(21) 99930-4505",
};

export default function LandingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { escola, updateEscola } = useEscola();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingEscola, setCheckingEscola] = useState<number | null>(null);

  // tRPC query to check if escola has director
  const utils = trpc.useUtils();

  // Sempre mostrar a Landing - o usuário deve selecionar a escola explicitamente
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Selecionar escola - verifica se tem Diretor de Carnaval
  const handleSelecionarEscola = async (esc: typeof ESCOLAS_INICIAIS[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCheckingEscola(esc.id);

    try {
      // Salvar escola selecionada
      await AsyncStorage.setItem(ESCOLA_SELECIONADA_KEY, String(esc.id));
      await updateEscola({
        nome: esc.nome,
        corPrimaria: esc.corPrimaria,
        corSecundaria: "#1A1A1A",
      });

      // Verificar se a escola tem Diretor de Carnaval no banco
      let temDiretor = false;
      try {
        const result = await utils.auth.escolaTemDiretor.fetch({ escolaId: esc.dbId });
        temDiretor = result.temDiretor;
      } catch (error) {
        // Se falhar a consulta ao banco, assumir que não tem (primeiro acesso)
        console.log("Não foi possível verificar no banco, assumindo primeiro acesso");
        temDiretor = false;
      }

      if (!temDiretor) {
        // Escola sem Diretor de Carnaval → primeiro acesso
        router.push({
          pathname: "/registro-diretor-carnaval" as any,
          params: {
            escolaId: String(esc.dbId),
            escolaNome: esc.nome,
          },
        });
      } else {
        // Escola com Diretor → login normal
        router.push("/login-cpf" as any);
      }
    } catch (error) {
      console.error("Erro ao selecionar escola:", error);
      // Fallback: ir para login
      router.push("/login-cpf" as any);
    } finally {
      setCheckingEscola(null);
    }
  };

  // Abrir WhatsApp
  const handleWhatsApp = (numero: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const mensagem = encodeURIComponent(
      "Olá! Gostaria de saber mais sobre como associar minha escola de samba ao app 100 Anos - Gestão do Samba."
    );
    Linking.openURL(`https://wa.me/${numero}?text=${mensagem}`);
  };

  // Abrir email
  const handleEmail = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(
      `mailto:${CONTATOS.email}?subject=Associação de Escola de Samba&body=Olá! Gostaria de associar minha escola de samba ao app 100 Anos - Gestão do Samba.`
    );
  };

  // Ir para tela de contato
  const handleQueroAssociar = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/contato-associacao");
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4 text-base">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="items-center pt-8 pb-6 px-6">
          <Text className="text-5xl mb-4">🎭</Text>
          <Text className="text-foreground text-2xl font-bold text-center">
            100 Anos
          </Text>
          <Text className="text-foreground text-lg font-semibold text-center">
            Gestão do Samba
          </Text>
          <Text className="text-muted text-sm text-center mt-2 px-8">
            Selecione sua escola de samba para continuar
          </Text>
        </View>

        {/* Escolas Disponíveis */}
        <View className="px-6 mb-6">
          <Text className="text-foreground text-base font-semibold mb-4">
            Escolas Cadastradas
          </Text>

          {ESCOLAS_INICIAIS.map((esc) => (
            <TouchableOpacity
              key={esc.id}
              onPress={() => handleSelecionarEscola(esc)}
              disabled={checkingEscola !== null}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
                borderWidth: 2,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                opacity: checkingEscola !== null && checkingEscola !== esc.id ? 0.5 : 1,
              }}
            >
              <View className="flex-row items-center">
                {/* Logo ou Ícone */}
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mr-4"
                  style={{
                    backgroundColor: esc.corPrimaria + "20",
                    borderWidth: 2,
                    borderColor: esc.corPrimaria,
                  }}
                >
                  {esc.logo ? (
                    <Image
                      source={{ uri: esc.logo }}
                      className="w-14 h-14 rounded-full"
                    />
                  ) : (
                    <Text className="text-3xl">🏟️</Text>
                  )}
                </View>

                {/* Informações */}
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    {esc.nome}
                  </Text>
                  <Text className="text-muted text-sm mt-1">
                    {esc.sigla} • Fundada em {esc.fundacao}
                  </Text>
                  <Text className="text-muted text-xs mt-1">
                    📍 {esc.bairro}
                  </Text>
                </View>

                {/* Loading ou Seta */}
                {checkingEscola === esc.id ? (
                  <ActivityIndicator size="small" color={esc.corPrimaria} />
                ) : (
                  <Text className="text-muted text-xl ml-2">›</Text>
                )}
              </View>

              {/* Cores da escola */}
              <View className="flex-row mt-3 gap-2">
                {esc.cores.map((cor, idx) => (
                  <View
                    key={idx}
                    className="w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: cor,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted text-sm mx-4">ou</Text>
            <View className="flex-1 h-px bg-border" />
          </View>
        </View>

        {/* Botão Quero Associar Minha Escola */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={handleQueroAssociar}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: "dashed",
            }}
          >
            <View className="items-center">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.primary + "15" }}
              >
                <Text className="text-3xl">+</Text>
              </View>
              <Text className="text-foreground text-base font-semibold text-center">
                Quero Associar Minha Escola
              </Text>
              <Text className="text-muted text-sm text-center mt-2 px-4">
                Entre em contato conosco para cadastrar sua escola de samba no app
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Contatos Rápidos */}
        <View className="px-6 mb-8">
          <Text className="text-foreground text-base font-semibold mb-3">
            Fale Conosco
          </Text>

          {/* WhatsApp 1 */}
          <TouchableOpacity
            onPress={() => handleWhatsApp(CONTATOS.whatsapp1)}
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-4 rounded-xl mb-2"
            style={{ backgroundColor: "#25D366" + "15" }}
          >
            <Text className="text-xl mr-3">📱</Text>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">
                WhatsApp
              </Text>
              <Text className="text-muted text-xs">{CONTATOS.telefone1}</Text>
            </View>
            <Text style={{ color: "#25D366" }} className="text-sm font-medium">
              Abrir
            </Text>
          </TouchableOpacity>

          {/* WhatsApp 2 */}
          <TouchableOpacity
            onPress={() => handleWhatsApp(CONTATOS.whatsapp2)}
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-4 rounded-xl mb-2"
            style={{ backgroundColor: "#25D366" + "15" }}
          >
            <Text className="text-xl mr-3">📱</Text>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">
                WhatsApp
              </Text>
              <Text className="text-muted text-xs">{CONTATOS.telefone2}</Text>
            </View>
            <Text style={{ color: "#25D366" }} className="text-sm font-medium">
              Abrir
            </Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            onPress={handleEmail}
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-4 rounded-xl"
            style={{ backgroundColor: colors.primary + "10" }}
          >
            <Text className="text-xl mr-3">📧</Text>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">
                E-mail
              </Text>
              <Text className="text-muted text-xs">{CONTATOS.email}</Text>
            </View>
            <Text style={{ color: colors.primary }} className="text-sm font-medium">
              Enviar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center pb-8 px-6">
          <Text className="text-muted text-xs text-center">
            100 Anos - Gestão do Samba
          </Text>
          <Text className="text-muted text-xs text-center mt-1">
            Versão 1.0 • 2026
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
