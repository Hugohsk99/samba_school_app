/**
 * Tela de Login / Seleção de Perfil
 * Permite que o usuário selecione seu perfil para acessar o app
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import {
  CATEGORIAS_INTEGRANTE,
  TIPOS_SEGMENTO,
  CARGOS_DIRETORIA,
} from "@/lib/types";

export default function LoginScreen() {
  const router = useRouter();
  const { integrantes } = useData();
  const { login, loginComoAdmin, isLoading } = useAuth();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Filtrar integrantes
  const integrantesFiltrados = integrantes.filter((integrante) => {
    // Filtro por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      const matchNome = integrante.nome.toLowerCase().includes(termoBusca);
      const matchCpf = integrante.cpf?.includes(busca.replace(/\D/g, ""));
      if (!matchNome && !matchCpf) return false;
    }

    // Filtro por categoria
    if (filtroCategoria && integrante.categoria !== filtroCategoria) {
      return false;
    }

    // Apenas integrantes ativos
    return integrante.ativo;
  });

  // Ordenar: diretoria primeiro, depois segmento, depois desfilante
  const integrantesOrdenados = [...integrantesFiltrados].sort((a, b) => {
    const ordem = { diretoria: 0, segmento: 1, desfilante: 2 };
    return ordem[a.categoria] - ordem[b.categoria];
  });

  // Login com integrante
  const handleLogin = async (integrante: typeof integrantes[0]) => {
    setIsLoggingIn(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await login(integrante);
      showSuccess("Bem-vindo(a)!", `Olá, ${integrante.nome.split(" ")[0]}!`);
      router.replace("/(tabs)");
    } catch (error) {
      showError("Erro", "Não foi possível fazer login. Tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Login como admin (para testes)
  const handleLoginAdmin = async () => {
    setIsLoggingIn(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await loginComoAdmin();
      showSuccess("Modo Administrador", "Acesso total liberado.");
      router.replace("/(tabs)");
    } catch (error) {
      showError("Erro", "Não foi possível fazer login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Continuar sem login (modo visitante)
  const handleContinuarSemLogin = () => {
    showWarning("Modo Visitante", "Algumas funcionalidades estarão limitadas.");
    router.replace("/(tabs)");
  };

  // Obter label da categoria
  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS_INTEGRANTE.find((c) => c.value === categoria);
    return cat?.label || categoria;
  };

  // Obter label do cargo/tipo
  const getSubcategoriaLabel = (integrante: typeof integrantes[0]) => {
    if (integrante.categoria === "diretoria" && integrante.cargoDiretoria) {
      const cargo = CARGOS_DIRETORIA.find((c) => c.value === integrante.cargoDiretoria);
      return cargo?.label;
    }
    if (integrante.categoria === "segmento" && integrante.tipoSegmento) {
      const tipo = TIPOS_SEGMENTO.find((t) => t.value === integrante.tipoSegmento);
      return tipo?.label;
    }
    return null;
  };

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={corPrimaria} />
          <Text className="text-muted mt-4">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View
          className="items-center py-8 border-b border-border"
          style={{ backgroundColor: corPrimaria + "10" }}
        >
          {/* Logo da Escola */}
          {escola?.logo ? (
            <Image
              source={{ uri: escola.logo }}
              className="w-24 h-24 rounded-full mb-4"
              style={{ borderWidth: 3, borderColor: corPrimaria }}
            />
          ) : (
            <View
              className="w-24 h-24 rounded-full bg-muted/30 items-center justify-center mb-4"
              style={{ borderWidth: 3, borderColor: corPrimaria }}
            >
              <Text className="text-5xl">🎭</Text>
            </View>
          )}

          <Text className="text-foreground text-2xl font-bold text-center px-4">
            {escola?.nome || "Escola de Samba"}
          </Text>
          <Text className="text-muted text-base mt-1">
            Selecione seu perfil para entrar
          </Text>
        </View>

        {/* Busca */}
        <View className="p-4 border-b border-border bg-surface">
          <View className="flex-row items-center bg-background rounded-xl px-4 py-3 border border-border">
            <Text className="text-xl mr-3">🔍</Text>
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou CPF..."
              placeholderTextColor="#9BA1A6"
              className="flex-1 text-foreground text-lg"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {busca && (
              <TouchableOpacity onPress={() => setBusca("")}>
                <Text className="text-muted text-xl">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros de categoria */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
          >
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setFiltroCategoria(null)}
                className={`px-4 py-2 rounded-full ${
                  filtroCategoria === null ? "bg-primary" : "bg-background border border-border"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-medium ${
                    filtroCategoria === null ? "text-white" : "text-foreground"
                  }`}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              {CATEGORIAS_INTEGRANTE.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setFiltroCategoria(cat.value)}
                  className={`px-4 py-2 rounded-full ${
                    filtroCategoria === cat.value
                      ? "bg-primary"
                      : "bg-background border border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`font-medium ${
                      filtroCategoria === cat.value ? "text-white" : "text-foreground"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de Integrantes */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4 gap-3">
            {integrantesOrdenados.length > 0 ? (
              integrantesOrdenados.map((integrante) => (
                <TouchableOpacity
                  key={integrante.id}
                  onPress={() => handleLogin(integrante)}
                  className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-4"
                  activeOpacity={0.8}
                  disabled={isLoggingIn}
                >
                  {/* Foto */}
                  {integrante.foto ? (
                    <Image
                      source={{ uri: integrante.foto }}
                      className="w-16 h-16 rounded-full"
                      style={{ borderWidth: 2, borderColor: corPrimaria }}
                    />
                  ) : (
                    <View
                      className="w-16 h-16 rounded-full bg-muted/30 items-center justify-center"
                      style={{ borderWidth: 2, borderColor: corPrimaria }}
                    >
                      <Text className="text-2xl">👤</Text>
                    </View>
                  )}

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-foreground text-lg font-bold">
                      {integrante.nome}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: corPrimaria + "20" }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: corPrimaria }}
                        >
                          {getCategoriaLabel(integrante.categoria)}
                        </Text>
                      </View>
                      {getSubcategoriaLabel(integrante) && (
                        <Text className="text-muted text-sm">
                          {getSubcategoriaLabel(integrante)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Seta */}
                  <Text className="text-muted text-2xl">→</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center py-12">
                <Text className="text-5xl mb-4">🔍</Text>
                <Text className="text-foreground text-xl font-bold text-center mb-2">
                  Nenhum integrante encontrado
                </Text>
                <Text className="text-muted text-base text-center">
                  {busca
                    ? "Tente buscar com outro termo"
                    : "Cadastre integrantes para fazer login"}
                </Text>
              </View>
            )}
          </View>

          {/* Opções adicionais */}
          <View className="p-4 gap-3 pb-8">
            <View className="h-px bg-border my-2" />

            {/* Login como Admin */}
            <TouchableOpacity
              onPress={handleLoginAdmin}
              className="bg-primary/10 rounded-2xl p-4 flex-row items-center justify-center gap-3 border-2 border-primary"
              activeOpacity={0.8}
              disabled={isLoggingIn}
            >
              <Text className="text-2xl">👑</Text>
              <View>
                <Text className="text-primary text-lg font-bold">
                  Entrar como Administrador
                </Text>
                <Text className="text-muted text-sm">
                  Acesso total para gestão
                </Text>
              </View>
            </TouchableOpacity>

            {/* Continuar sem login */}
            <TouchableOpacity
              onPress={handleContinuarSemLogin}
              className="bg-background rounded-2xl p-4 flex-row items-center justify-center gap-3 border border-border"
              activeOpacity={0.8}
              disabled={isLoggingIn}
            >
              <Text className="text-2xl">👁️</Text>
              <Text className="text-muted text-lg">
                Continuar como visitante
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Loading overlay */}
        {isLoggingIn && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <View className="bg-surface rounded-2xl p-6 items-center">
              <ActivityIndicator size="large" color={corPrimaria} />
              <Text className="text-foreground mt-4 font-medium">
                Entrando...
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
