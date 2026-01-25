/**
 * Tela de Login / Seleção de Perfil
 * Permite login via OAuth ou seleção de perfil local
 * Integrado com sistema de permissões hierárquico
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useAuth as useLocalAuth } from "@/lib/auth-context";
import { useAuth as useManusAuth } from "@/hooks/use-auth";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import {
  CATEGORIAS_INTEGRANTE,
  TIPOS_SEGMENTO,
  CARGOS_DIRETORIA,
} from "@/lib/types";

type ModoLogin = "selecao" | "oauth" | "convite";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { integrantes } = useData();
  const { login: loginLocal, loginComoAdmin, isLoading: localLoading } = useLocalAuth();
  const { isAuthenticated: manusAuth, loading: manusLoading, user: manusUser, refresh: refreshAuth } = useManusAuth();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const [modoLogin, setModoLogin] = useState<ModoLogin>("selecao");
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [codigoConvite, setCodigoConvite] = useState("");

  // Mutation para usar convite
  const usarConviteMutation = trpc.convites.usar.useMutation({
    onSuccess: () => {
      showSuccess("Sucesso!", "Convite aceito com sucesso. Bem-vindo à escola!");
      router.replace("/(tabs)");
    },
    onError: (error) => {
      showError("Erro", error.message);
    },
  });

  // Redireciona se já autenticado via Manus
  useEffect(() => {
    if (manusAuth && !manusLoading && manusUser) {
      router.replace("/(tabs)");
    }
  }, [manusAuth, manusLoading, manusUser]);

  // Filtrar integrantes
  const integrantesFiltrados = integrantes.filter((integrante) => {
    if (busca) {
      const termoBusca = busca.toLowerCase();
      const matchNome = integrante.nome.toLowerCase().includes(termoBusca);
      const matchCpf = integrante.cpf?.includes(busca.replace(/\D/g, ""));
      if (!matchNome && !matchCpf) return false;
    }
    if (filtroCategoria && integrante.categoria !== filtroCategoria) {
      return false;
    }
    return integrante.ativo;
  });

  // Ordenar: diretoria primeiro, depois segmento, depois desfilante
  const integrantesOrdenados = [...integrantesFiltrados].sort((a, b) => {
    const ordem = { diretoria: 0, segmento: 1, desfilante: 2 };
    return ordem[a.categoria] - ordem[b.categoria];
  });

  // Login com integrante local
  const handleLoginLocal = async (integrante: typeof integrantes[0]) => {
    setIsLoggingIn(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loginLocal(integrante);
      showSuccess("Bem-vindo(a)!", `Olá, ${integrante.nome.split(" ")[0]}!`);
      router.replace("/(tabs)");
    } catch (error) {
      showError("Erro", "Não foi possível fazer login. Tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Login via OAuth (Manus) - redireciona para página de login
  const handleLoginOAuth = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Na web, redireciona para a página de login do Manus
    if (Platform.OS === "web") {
      window.location.href = "/api/auth/login";
    } else {
      // Em dispositivos nativos, usa WebBrowser para abrir a página de login
      showWarning("Atenção", "Use a versão web para fazer login online.");
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

  // Usar código de convite
  const handleUsarConvite = async () => {
    if (!codigoConvite.trim()) {
      showWarning("Atenção", "Digite o código do convite");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    usarConviteMutation.mutate({ codigo: codigoConvite.trim() });
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
  const corPrimaria = escola?.corPrimaria || colors.primary;

  if (localLoading || manusLoading) {
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
          className="items-center py-6 border-b border-border"
          style={{ backgroundColor: corPrimaria + "10" }}
        >
          {escola?.logo ? (
            <Image
              source={{ uri: escola.logo }}
              className="w-20 h-20 rounded-full mb-3"
              style={{ borderWidth: 3, borderColor: corPrimaria }}
            />
          ) : (
            <View
              className="w-20 h-20 rounded-full bg-muted/30 items-center justify-center mb-3"
              style={{ borderWidth: 3, borderColor: corPrimaria }}
            >
              <Text className="text-4xl">🎭</Text>
            </View>
          )}
          <Text className="text-foreground text-xl font-bold text-center px-4">
            {escola?.nome || "Escola de Samba"}
          </Text>
          <Text className="text-muted text-sm mt-1">
            Selecione como deseja entrar
          </Text>
        </View>

        {/* Tabs de modo de login */}
        <View className="flex-row border-b border-border">
          <TouchableOpacity
            onPress={() => setModoLogin("selecao")}
            className={`flex-1 py-3 items-center ${modoLogin === "selecao" ? "border-b-2" : ""}`}
            style={modoLogin === "selecao" ? { borderBottomColor: corPrimaria } : {}}
            activeOpacity={0.7}
          >
            <Text className={`font-medium ${modoLogin === "selecao" ? "text-primary" : "text-muted"}`}>
              👤 Perfil Local
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModoLogin("oauth")}
            className={`flex-1 py-3 items-center ${modoLogin === "oauth" ? "border-b-2" : ""}`}
            style={modoLogin === "oauth" ? { borderBottomColor: corPrimaria } : {}}
            activeOpacity={0.7}
          >
            <Text className={`font-medium ${modoLogin === "oauth" ? "text-primary" : "text-muted"}`}>
              🔐 Login Online
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModoLogin("convite")}
            className={`flex-1 py-3 items-center ${modoLogin === "convite" ? "border-b-2" : ""}`}
            style={modoLogin === "convite" ? { borderBottomColor: corPrimaria } : {}}
            activeOpacity={0.7}
          >
            <Text className={`font-medium ${modoLogin === "convite" ? "text-primary" : "text-muted"}`}>
              🎟️ Convite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo baseado no modo */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* MODO: Seleção de Perfil Local */}
          {modoLogin === "selecao" && (
            <>
              {/* Busca */}
              <View className="p-4 border-b border-border bg-surface">
                <View className="flex-row items-center bg-background rounded-xl px-4 py-3 border border-border">
                  <Text className="text-xl mr-3">🔍</Text>
                  <TextInput
                    value={busca}
                    onChangeText={setBusca}
                    placeholder="Buscar por nome ou CPF..."
                    placeholderTextColor="#9BA1A6"
                    className="flex-1 text-foreground text-base"
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setFiltroCategoria(null)}
                      className={`px-4 py-2 rounded-full ${
                        filtroCategoria === null ? "bg-primary" : "bg-background border border-border"
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text className={`font-medium ${filtroCategoria === null ? "text-white" : "text-foreground"}`}>
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {CATEGORIAS_INTEGRANTE.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        onPress={() => setFiltroCategoria(cat.value)}
                        className={`px-4 py-2 rounded-full ${
                          filtroCategoria === cat.value ? "bg-primary" : "bg-background border border-border"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text className={`font-medium ${filtroCategoria === cat.value ? "text-white" : "text-foreground"}`}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Lista de Integrantes */}
              <View className="p-4 gap-3">
                {integrantesOrdenados.length > 0 ? (
                  integrantesOrdenados.map((integrante) => (
                    <TouchableOpacity
                      key={integrante.id}
                      onPress={() => handleLoginLocal(integrante)}
                      className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-4"
                      activeOpacity={0.8}
                      disabled={isLoggingIn}
                    >
                      {integrante.foto ? (
                        <Image
                          source={{ uri: integrante.foto }}
                          className="w-14 h-14 rounded-full"
                          style={{ borderWidth: 2, borderColor: corPrimaria }}
                        />
                      ) : (
                        <View
                          className="w-14 h-14 rounded-full bg-muted/30 items-center justify-center"
                          style={{ borderWidth: 2, borderColor: corPrimaria }}
                        >
                          <Text className="text-xl">👤</Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-foreground text-base font-bold">{integrante.nome}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <View className="px-2 py-1 rounded" style={{ backgroundColor: corPrimaria + "20" }}>
                            <Text className="text-xs font-medium" style={{ color: corPrimaria }}>
                              {getCategoriaLabel(integrante.categoria)}
                            </Text>
                          </View>
                          {getSubcategoriaLabel(integrante) && (
                            <Text className="text-muted text-xs">{getSubcategoriaLabel(integrante)}</Text>
                          )}
                        </View>
                      </View>
                      <Text className="text-muted text-xl">→</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="items-center py-12">
                    <Text className="text-4xl mb-4">🔍</Text>
                    <Text className="text-foreground text-lg font-bold text-center mb-2">
                      Nenhum integrante encontrado
                    </Text>
                    <Text className="text-muted text-sm text-center">
                      {busca ? "Tente buscar com outro termo" : "Cadastre integrantes para fazer login"}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* MODO: Login OAuth */}
          {modoLogin === "oauth" && (
            <View className="p-6">
              {/* Botão de Login Principal */}
              <TouchableOpacity
                onPress={handleLoginOAuth}
                disabled={isLoggingIn}
                className="rounded-xl py-4 px-6 mb-4 flex-row items-center justify-center"
                style={{ backgroundColor: corPrimaria, opacity: isLoggingIn ? 0.7 : 1 }}
                activeOpacity={0.8}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-lg mr-2">🔐</Text>
                    <Text className="text-white font-semibold text-lg">Entrar com Manus</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text className="text-sm text-muted text-center mb-6">
                Use sua conta Manus para acessar.{"\n"}Em breve: Google e Apple ID
              </Text>

              {/* Informações sobre níveis de acesso */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-foreground font-semibold mb-3 text-center">📋 Níveis de Acesso</Text>
                <View className="gap-3">
                  {[
                    { icon: "👑", title: "Presidente", desc: "Acesso total à gestão da escola" },
                    { icon: "🎯", title: "Diretor", desc: "Gerencia blocos e eventos" },
                    { icon: "📋", title: "Coordenador", desc: "Check-in e organização" },
                    { icon: "🎭", title: "Integrante", desc: "Acessa eventos e próprio perfil" },
                    { icon: "💚", title: "Contribuinte", desc: "Apoiador com acesso limitado" },
                  ].map((item) => (
                    <View key={item.title} className="flex-row items-center">
                      <Text className="text-lg mr-3">{item.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-medium">{item.title}</Text>
                        <Text className="text-muted text-xs">{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* MODO: Convite */}
          {modoLogin === "convite" && (
            <View className="p-6">
              <View className="bg-surface rounded-xl p-4 border border-border mb-4">
                <Text className="text-foreground font-semibold mb-3">🎟️ Código de Convite</Text>
                <Text className="text-muted text-sm mb-4">
                  Recebeu um convite para participar de uma escola de samba? Cole o código abaixo.
                </Text>
                <TextInput
                  value={codigoConvite}
                  onChangeText={setCodigoConvite}
                  placeholder="Cole o código do convite aqui"
                  placeholderTextColor={colors.muted}
                  className="bg-background rounded-lg px-4 py-3 text-foreground mb-4 border border-border"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleUsarConvite}
                  disabled={usarConviteMutation.isPending || !codigoConvite.trim()}
                  className="rounded-xl py-3"
                  style={{ 
                    backgroundColor: corPrimaria, 
                    opacity: usarConviteMutation.isPending || !codigoConvite.trim() ? 0.5 : 1 
                  }}
                  activeOpacity={0.8}
                >
                  {usarConviteMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-center font-semibold">Usar Convite</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text className="text-muted text-sm text-center">
                Não tem um convite? Peça ao presidente ou diretor da escola para enviar um para você.
              </Text>
            </View>
          )}

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
                <Text className="text-primary text-base font-bold">Entrar como Administrador</Text>
                <Text className="text-muted text-xs">Acesso total para gestão (modo teste)</Text>
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
              <Text className="text-muted text-base">Continuar como visitante</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Loading overlay */}
        {isLoggingIn && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <View className="bg-surface rounded-2xl p-6 items-center">
              <ActivityIndicator size="large" color={corPrimaria} />
              <Text className="text-foreground mt-4 font-medium">Entrando...</Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
