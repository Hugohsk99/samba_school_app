/**
 * Tela de Convites
 * 
 * Permite criar e gerenciar convites para novos usuários
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { usePermissions, Role } from "@/lib/permissions-context";
import { useToast } from "@/lib/toast-context";

const ROLES_CONVITE: { value: "diretor" | "coordenador" | "integrante" | "contribuinte"; label: string; icon: string }[] = [
  { value: "diretor", label: "Diretor", icon: "🎯" },
  { value: "coordenador", label: "Coordenador", icon: "📋" },
  { value: "integrante", label: "Integrante", icon: "🎭" },
  { value: "contribuinte", label: "Contribuinte", icon: "💚" },
];

export default function ConvitesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const { temPermissao, isGestor } = usePermissions();

  const [email, setEmail] = useState("");
  const [roleSelecionado, setRoleSelecionado] = useState<"diretor" | "coordenador" | "integrante" | "contribuinte">("integrante");
  const [diasValidade, setDiasValidade] = useState(7);
  const [conviteCriado, setConviteCriado] = useState<{ codigo: string; expiraEm: string } | null>(null);

  // Query de convites existentes
  const convitesQuery = trpc.convites.listar.useQuery();

  // Mutation para criar convite
  const criarConviteMutation = trpc.convites.criar.useMutation({
    onSuccess: (data) => {
      setConviteCriado({ codigo: data.codigo, expiraEm: data.expiraEm.toISOString() });
      setEmail("");
      convitesQuery.refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      showError("Erro", error.message);
    },
  });

  // Criar convite
  const handleCriarConvite = () => {
    if (!email.trim()) {
      showError("Atenção", "Digite o email do convidado");
      return;
    }

    if (!email.includes("@")) {
      showError("Atenção", "Digite um email válido");
      return;
    }

    criarConviteMutation.mutate({
      email: email.trim(),
      role: roleSelecionado,
      diasValidade,
    });
  };

  // Copiar código
  const handleCopiarCodigo = async (codigo: string) => {
    await Clipboard.setStringAsync(codigo);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    showSuccess("Copiado!", "Código copiado para a área de transferência");
  };

  // Compartilhar convite
  const handleCompartilhar = async (codigo: string, email: string) => {
    const mensagem = `Olá! Você foi convidado(a) para participar da nossa escola de samba!\n\nUse este código para acessar o aplicativo:\n\n${codigo}\n\nBaixe o app e use o código na tela de login.`;

    try {
      await Share.share({
        message: mensagem,
        title: "Convite - Escola de Samba",
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  // Verificar permissão
  if (!temPermissao("usuarios.cadastrar")) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Acesso Restrito
          </Text>
          <Text className="text-muted text-center">
            Você não tem permissão para criar convites.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-primary px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-foreground text-xl font-bold">Convites</Text>
          <Text className="text-muted text-sm">Convide novos membros</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Formulário de novo convite */}
        <View className="p-4">
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-foreground font-bold text-lg mb-4">🎟️ Criar Novo Convite</Text>

            {/* Email */}
            <Text className="text-foreground font-medium mb-2">Email do convidado:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg px-4 py-3 text-foreground mb-4 border border-border"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Role */}
            <Text className="text-foreground font-medium mb-2">Nível de acesso:</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ROLES_CONVITE.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setRoleSelecionado(role.value)}
                  className={`px-4 py-2 rounded-lg flex-row items-center ${
                    roleSelecionado === role.value ? "bg-primary" : "bg-background border border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="mr-1">{role.icon}</Text>
                  <Text className={roleSelecionado === role.value ? "text-white font-medium" : "text-foreground"}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Validade */}
            <Text className="text-foreground font-medium mb-2">Validade do convite:</Text>
            <View className="flex-row gap-2 mb-4">
              {[3, 7, 14, 30].map((dias) => (
                <TouchableOpacity
                  key={dias}
                  onPress={() => setDiasValidade(dias)}
                  className={`px-4 py-2 rounded-lg ${
                    diasValidade === dias ? "bg-primary" : "bg-background border border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={diasValidade === dias ? "text-white font-medium" : "text-foreground"}>
                    {dias} dias
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botão criar */}
            <TouchableOpacity
              onPress={handleCriarConvite}
              disabled={criarConviteMutation.isPending}
              className="bg-primary py-4 rounded-xl items-center"
              style={{ opacity: criarConviteMutation.isPending ? 0.7 : 1 }}
              activeOpacity={0.8}
            >
              {criarConviteMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">Criar Convite</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Convite criado */}
        {conviteCriado && (
          <View className="px-4 mb-4">
            <View className="bg-success/10 rounded-xl p-4 border-2 border-success">
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl mr-2">✅</Text>
                <Text className="text-success font-bold text-lg">Convite Criado!</Text>
              </View>

              <Text className="text-foreground mb-2">Código do convite:</Text>
              <View className="bg-background rounded-lg p-3 mb-3">
                <Text className="text-foreground text-xs font-mono" numberOfLines={2}>
                  {conviteCriado.codigo}
                </Text>
              </View>

              <Text className="text-muted text-sm mb-4">
                Válido até: {new Date(conviteCriado.expiraEm).toLocaleDateString("pt-BR")}
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleCopiarCodigo(conviteCriado.codigo)}
                  className="flex-1 bg-primary py-3 rounded-xl items-center flex-row justify-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-lg mr-2">📋</Text>
                  <Text className="text-white font-semibold">Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCompartilhar(conviteCriado.codigo, email)}
                  className="flex-1 bg-surface py-3 rounded-xl items-center flex-row justify-center border border-border"
                  activeOpacity={0.8}
                >
                  <Text className="text-lg mr-2">📤</Text>
                  <Text className="text-foreground font-semibold">Compartilhar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setConviteCriado(null)}
                className="mt-3 py-2"
                activeOpacity={0.7}
              >
                <Text className="text-muted text-center">Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de convites existentes */}
        <View className="p-4">
          <Text className="text-foreground font-bold text-lg mb-4">📜 Convites Enviados</Text>

          {convitesQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} className="my-8" />
          ) : (convitesQuery.data?.length || 0) > 0 ? (
            <View className="gap-3">
              {convitesQuery.data?.map((convite) => {
                const expirado = new Date() > new Date(convite.expiraEm);
                const usado = !!convite.usadoPor;
                const roleInfo = ROLES_CONVITE.find((r) => r.value === convite.role);

                return (
                  <View
                    key={convite.id}
                    className={`bg-surface rounded-xl p-4 border ${
                      expirado || usado ? "border-border opacity-60" : "border-border"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-foreground font-medium">{convite.email}</Text>
                      {usado ? (
                        <View className="px-2 py-1 rounded bg-success/20">
                          <Text className="text-xs text-success font-medium">Usado</Text>
                        </View>
                      ) : expirado ? (
                        <View className="px-2 py-1 rounded bg-error/20">
                          <Text className="text-xs text-error font-medium">Expirado</Text>
                        </View>
                      ) : (
                        <View className="px-2 py-1 rounded bg-primary/20">
                          <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                            Ativo
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <Text className="mr-1">{roleInfo?.icon}</Text>
                        <Text className="text-muted text-sm">{roleInfo?.label}</Text>
                      </View>
                      <Text className="text-muted text-sm">•</Text>
                      <Text className="text-muted text-sm">
                        Expira: {new Date(convite.expiraEm).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>

                    {!usado && !expirado && (
                      <View className="flex-row gap-2 mt-3">
                        <TouchableOpacity
                          onPress={() => handleCopiarCodigo(convite.codigo)}
                          className="flex-1 bg-background py-2 rounded-lg items-center border border-border"
                          activeOpacity={0.8}
                        >
                          <Text className="text-foreground text-sm">📋 Copiar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCompartilhar(convite.codigo, convite.email)}
                          className="flex-1 bg-background py-2 rounded-lg items-center border border-border"
                          activeOpacity={0.8}
                        >
                          <Text className="text-foreground text-sm">📤 Compartilhar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="items-center py-8">
              <Text className="text-4xl mb-4">📭</Text>
              <Text className="text-foreground text-lg font-bold text-center">
                Nenhum convite enviado
              </Text>
              <Text className="text-muted text-center mt-2">
                Crie um convite acima para convidar novos membros
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
