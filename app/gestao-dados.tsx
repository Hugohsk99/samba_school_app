import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import {
  BLOCOS_EXEMPLO,
  INTEGRANTES_EXEMPLO,
  EVENTOS_EXEMPLO,
  MATERIAIS_EXEMPLO,
  ESCOLA_EXEMPLO,
} from "@/lib/dados-exemplo";

export default function GestaoDadosScreen() {
  const router = useRouter();
  const { 
    blocos, integrantes, eventos, materiais,
    setBlocos, setIntegrantes, setEventos, setMateriais,
    clearAllData 
  } = useData();
  const { escola, updateEscola, resetConfig } = useEscola();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Carregar dados de exemplo
  const handleCarregarDadosExemplo = async () => {
    Alert.alert(
      "Carregar Dados de Exemplo",
      "Isso irá adicionar dados de exemplo da escola 'Unidos da Alegria' ao aplicativo. Os dados existentes serão mantidos. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Carregar",
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction("carregar");
            showInfo("Carregando...", "Adicionando dados de exemplo.");

            try {
              // Adicionar blocos
              const novosBlocos = [...blocos, ...BLOCOS_EXEMPLO];
              await setBlocos(novosBlocos);

              // Adicionar integrantes
              const novosIntegrantes = [...integrantes, ...INTEGRANTES_EXEMPLO];
              await setIntegrantes(novosIntegrantes);

              // Adicionar eventos
              const novosEventos = [...eventos, ...EVENTOS_EXEMPLO];
              await setEventos(novosEventos);

              // Adicionar materiais
              const novosMateriais = [...materiais, ...MATERIAIS_EXEMPLO];
              await setMateriais(novosMateriais);

              // Configurar escola se não estiver configurada
              if (!escola?.nome) {
                await updateEscola(ESCOLA_EXEMPLO);
              }

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              showSuccess(
                "Dados carregados!",
                `Adicionados: ${BLOCOS_EXEMPLO.length} blocos, ${INTEGRANTES_EXEMPLO.length} integrantes, ${EVENTOS_EXEMPLO.length} eventos, ${MATERIAIS_EXEMPLO.length} materiais.`
              );
            } catch (error) {
              console.error("Erro ao carregar dados:", error);
              showError("Erro ao carregar", "Não foi possível carregar os dados de exemplo.");
            } finally {
              setIsLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  // Limpar todos os dados
  const handleLimparTodosDados = async () => {
    Alert.alert(
      "⚠️ Limpar Todos os Dados",
      "ATENÇÃO: Esta ação irá APAGAR PERMANENTEMENTE todos os dados do aplicativo (blocos, integrantes, eventos, materiais e configurações da escola). Esta ação NÃO pode ser desfeita. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar Tudo",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction("limpar");
            showWarning("Limpando...", "Removendo todos os dados.");

            try {
              await clearAllData();
              await resetConfig();

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              showSuccess("Dados limpos!", "Todos os dados foram removidos com sucesso.");
            } catch (error) {
              console.error("Erro ao limpar dados:", error);
              showError("Erro ao limpar", "Não foi possível limpar os dados.");
            } finally {
              setIsLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  // Limpar apenas blocos
  const handleLimparBlocos = async () => {
    Alert.alert(
      "Limpar Blocos",
      `Deseja apagar todos os ${blocos.length} blocos cadastrados?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction("blocos");
            try {
              await setBlocos([]);
              showSuccess("Blocos limpos!", "Todos os blocos foram removidos.");
            } catch (error) {
              showError("Erro", "Não foi possível limpar os blocos.");
            } finally {
              setIsLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  // Limpar apenas integrantes
  const handleLimparIntegrantes = async () => {
    Alert.alert(
      "Limpar Integrantes",
      `Deseja apagar todos os ${integrantes.length} integrantes cadastrados?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction("integrantes");
            try {
              await setIntegrantes([]);
              showSuccess("Integrantes limpos!", "Todos os integrantes foram removidos.");
            } catch (error) {
              showError("Erro", "Não foi possível limpar os integrantes.");
            } finally {
              setIsLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  // Limpar apenas eventos
  const handleLimparEventos = async () => {
    Alert.alert(
      "Limpar Eventos",
      `Deseja apagar todos os ${eventos.length} eventos cadastrados?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction("eventos");
            try {
              await setEventos([]);
              showSuccess("Eventos limpos!", "Todos os eventos foram removidos.");
            } catch (error) {
              showError("Erro", "Não foi possível limpar os eventos.");
            } finally {
              setIsLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  // Limpar apenas materiais
  const handleLimparMateriais = async () => {
    Alert.alert(
      "Limpar Materiais",
      `Deseja apagar todos os ${materiais.length} materiais cadastrados?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction("materiais");
            try {
              await setMateriais([]);
              showSuccess("Materiais limpos!", "Todos os materiais foram removidos.");
            } catch (error) {
              showError("Erro", "Não foi possível limpar os materiais.");
            } finally {
              setIsLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center px-3 py-2 rounded-xl bg-background"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-lg font-medium">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-xl font-bold">
            🗄️ Gestão de Dados
          </Text>

          <View className="w-20" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-6 pb-32">
            {/* Resumo dos Dados */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-xl font-bold mb-4">
                📊 Resumo dos Dados
              </Text>
              
              <View className="gap-3">
                <View className="flex-row items-center justify-between bg-background rounded-xl p-4">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">👥</Text>
                    <Text className="text-foreground text-lg font-medium">Blocos</Text>
                  </View>
                  <Text className="text-foreground text-2xl font-bold">{blocos.length}</Text>
                </View>

                <View className="flex-row items-center justify-between bg-background rounded-xl p-4">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">🎭</Text>
                    <Text className="text-foreground text-lg font-medium">Integrantes</Text>
                  </View>
                  <Text className="text-foreground text-2xl font-bold">{integrantes.length}</Text>
                </View>

                <View className="flex-row items-center justify-between bg-background rounded-xl p-4">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">📅</Text>
                    <Text className="text-foreground text-lg font-medium">Eventos</Text>
                  </View>
                  <Text className="text-foreground text-2xl font-bold">{eventos.length}</Text>
                </View>

                <View className="flex-row items-center justify-between bg-background rounded-xl p-4">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">📦</Text>
                    <Text className="text-foreground text-lg font-medium">Materiais</Text>
                  </View>
                  <Text className="text-foreground text-2xl font-bold">{materiais.length}</Text>
                </View>
              </View>
            </View>

            {/* Carregar Dados de Exemplo */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                📥 Carregar Dados de Exemplo
              </Text>
              <Text className="text-muted text-base mb-4">
                Carregue dados da escola fictícia "Unidos da Alegria" para testar o aplicativo com dados realistas.
              </Text>

              <TouchableOpacity
                onPress={handleCarregarDadosExemplo}
                className="rounded-xl p-4 flex-row items-center justify-center gap-3"
                style={{ backgroundColor: corPrimaria }}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {loadingAction === "carregar" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-2xl">📥</Text>
                )}
                <Text className="text-white text-lg font-bold">
                  {loadingAction === "carregar" ? "Carregando..." : "Carregar Dados de Exemplo"}
                </Text>
              </TouchableOpacity>

              <View className="mt-4 bg-background rounded-xl p-4">
                <Text className="text-muted text-sm">
                  Serão adicionados: {BLOCOS_EXEMPLO.length} blocos, {INTEGRANTES_EXEMPLO.length} integrantes, {EVENTOS_EXEMPLO.length} eventos e {MATERIAIS_EXEMPLO.length} materiais.
                </Text>
              </View>
            </View>

            {/* Limpar Dados Específicos */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🧹 Limpar Dados Específicos
              </Text>
              <Text className="text-muted text-base mb-4">
                Remova dados de categorias específicas sem afetar os demais.
              </Text>

              <View className="gap-3">
                <TouchableOpacity
                  onPress={handleLimparBlocos}
                  className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex-row items-center gap-3"
                  disabled={isLoading || blocos.length === 0}
                  style={{ opacity: blocos.length === 0 ? 0.5 : 1 }}
                  activeOpacity={0.8}
                >
                  {loadingAction === "blocos" ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Text className="text-2xl">👥</Text>
                  )}
                  <View className="flex-1">
                    <Text className="text-warning font-bold text-base">
                      Limpar Blocos ({blocos.length})
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLimparIntegrantes}
                  className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex-row items-center gap-3"
                  disabled={isLoading || integrantes.length === 0}
                  style={{ opacity: integrantes.length === 0 ? 0.5 : 1 }}
                  activeOpacity={0.8}
                >
                  {loadingAction === "integrantes" ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Text className="text-2xl">🎭</Text>
                  )}
                  <View className="flex-1">
                    <Text className="text-warning font-bold text-base">
                      Limpar Integrantes ({integrantes.length})
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLimparEventos}
                  className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex-row items-center gap-3"
                  disabled={isLoading || eventos.length === 0}
                  style={{ opacity: eventos.length === 0 ? 0.5 : 1 }}
                  activeOpacity={0.8}
                >
                  {loadingAction === "eventos" ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Text className="text-2xl">📅</Text>
                  )}
                  <View className="flex-1">
                    <Text className="text-warning font-bold text-base">
                      Limpar Eventos ({eventos.length})
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLimparMateriais}
                  className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex-row items-center gap-3"
                  disabled={isLoading || materiais.length === 0}
                  style={{ opacity: materiais.length === 0 ? 0.5 : 1 }}
                  activeOpacity={0.8}
                >
                  {loadingAction === "materiais" ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Text className="text-2xl">📦</Text>
                  )}
                  <View className="flex-1">
                    <Text className="text-warning font-bold text-base">
                      Limpar Materiais ({materiais.length})
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Limpar Todos os Dados */}
            <View className="bg-error/5 rounded-2xl p-5 border border-error/20">
              <Text className="text-error text-xl font-bold mb-2">
                ⚠️ Zona de Perigo
              </Text>
              <Text className="text-error/70 text-base mb-4">
                Esta ação irá apagar TODOS os dados do aplicativo permanentemente.
              </Text>

              <TouchableOpacity
                onPress={handleLimparTodosDados}
                className="bg-error rounded-xl p-4 flex-row items-center justify-center gap-3"
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {loadingAction === "limpar" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-2xl">🗑️</Text>
                )}
                <Text className="text-white text-lg font-bold">
                  {loadingAction === "limpar" ? "Limpando..." : "Limpar Todos os Dados"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
