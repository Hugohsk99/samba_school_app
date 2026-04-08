/**
 * Tela 05 - Fila de Aprovação
 * Diretores aprovam/rejeitam cadastros pendentes
 * Integrado com banco de dados via tRPC
 */

import { useState, useCallback } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const ROLES_LABELS: Record<string, string> = {
  master: "Master",
  diretor_escola: "Diretor de Escola",
  diretor_carnaval: "Diretor de Carnaval",
  diretor_ala: "Diretor de Ala",
  diretor_segmento: "Diretor de Segmento",
  integrante: "Integrante",
  pendente: "Pendente",
};

const ROLES_DISPONIVEIS = [
  { value: "integrante", label: "Integrante" },
  { value: "diretor_segmento", label: "Diretor de Segmento" },
  { value: "diretor_ala", label: "Diretor de Ala" },
  { value: "diretor_carnaval", label: "Diretor de Carnaval" },
];

export default function FilaAprovacaoScreen() {
  const router = useRouter();
  const colors = useColors();
  const { usuario, temPermissao } = useAuth();
  const { escola } = useEscola();
  const { showSuccess, showError } = useToast();

  const corPrimaria = escola?.corPrimaria || colors.primary;

  const [modalVisivel, setModalVisivel] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<any>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [roleSelecionado, setRoleSelecionado] = useState("integrante");
  const [imagemAmpliadaUri, setImagemAmpliadaUri] = useState<string | null>(null);

  // Buscar pendentes do banco via tRPC
  const pendentesQuery = trpc.usuarios.pendentes.useQuery(undefined, {
    enabled: !!usuario,
  });

  // Mutations
  const aprovarMutation = trpc.usuarios.aprovar.useMutation({
    onSuccess: () => {
      pendentesQuery.refetch();
      showSuccess("Aprovado!", "Usuário aprovado com sucesso.");
      setModalVisivel(false);
      setUsuarioSelecionado(null);
    },
    onError: (err) => {
      showError("Erro", err.message || "Não foi possível aprovar.");
    },
  });

  const rejeitarMutation = trpc.usuarios.rejeitar.useMutation({
    onSuccess: () => {
      pendentesQuery.refetch();
      showSuccess("Rejeitado", "Solicitação rejeitada.");
      setModalVisivel(false);
      setUsuarioSelecionado(null);
      setMotivoRejeicao("");
    },
    onError: (err) => {
      showError("Erro", err.message || "Não foi possível rejeitar.");
    },
  });

  const handleAprovar = () => {
    if (!usuarioSelecionado) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    aprovarMutation.mutate({
      usuarioId: usuarioSelecionado.id,
      role: roleSelecionado as any,
    });
  };

  const handleRejeitar = () => {
    if (!usuarioSelecionado) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    rejeitarMutation.mutate({
      usuarioId: usuarioSelecionado.id,
      motivo: motivoRejeicao || undefined,
    });
  };

  const abrirDetalhes = (item: any) => {
    setUsuarioSelecionado(item);
    setRoleSelecionado("integrante");
    setMotivoRejeicao("");
    setModalVisivel(true);
  };

  // Verificar permissão
  if (!temPermissao("aprovarUsuarios")) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center">
            Acesso Restrito
          </Text>
          <Text className="text-muted text-center mt-2">
            Apenas diretores podem aprovar cadastros.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-xl"
            style={{ backgroundColor: corPrimaria }}
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const pendentes = pendentesQuery.data || [];

  const formatarData = (data: string | Date) => {
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => abrirDetalhes(item)}
      activeOpacity={0.7}
      className="mx-4 mb-3 rounded-2xl p-4"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: corPrimaria + "20" }}
        >
          <Text className="text-xl">👤</Text>
        </View>

        {/* Dados */}
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold">
            {item.name || "Sem nome"}
          </Text>
          <Text className="text-muted text-xs mt-1">
            CPF: {item.cpf ? `***.***.${item.cpf.slice(-5)}` : "N/A"}
          </Text>
          {item.email && (
            <Text className="text-muted text-xs">{item.email}</Text>
          )}
          <Text className="text-muted text-xs mt-1">
            Cadastro: {item.createdAt ? formatarData(item.createdAt) : "N/A"}
          </Text>
        </View>

        {/* Badge */}
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: "#F59E0B" + "20" }}
        >
          <Text className="text-xs font-medium" style={{ color: "#F59E0B" }}>
            Pendente
          </Text>
        </View>
      </View>

      {/* Comprovante PIX */}
      {item.comprovantePix && (
        <View className="mt-3 flex-row items-center">
          <Text className="text-xs mr-2" style={{ color: colors.success }}>
            📎 Comprovante PIX anexado
          </Text>
          <TouchableOpacity
            onPress={() => setImagemAmpliadaUri(item.comprovantePix)}
          >
            <Text className="text-xs font-medium" style={{ color: corPrimaria }}>
              Ver
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
          <Text className="text-foreground text-xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-foreground text-xl font-bold">
            Fila de Aprovação
          </Text>
          <Text className="text-muted text-xs">
            {pendentes.length} solicitação(ões) pendente(s)
          </Text>
        </View>
      </View>

      {/* Loading */}
      {pendentesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={corPrimaria} />
          <Text className="text-muted mt-4">Carregando solicitações...</Text>
        </View>
      ) : pendentes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">✅</Text>
          <Text className="text-foreground text-xl font-bold text-center">
            Nenhuma Pendência
          </Text>
          <Text className="text-muted text-center mt-2">
            Todas as solicitações foram processadas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendentes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={pendentesQuery.isFetching}
              onRefresh={() => pendentesQuery.refetch()}
            />
          }
        />
      )}

      {/* Modal de Detalhes / Aprovação */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View className="flex-1 bg-background">
          {/* Header do Modal */}
          <View className="flex-row items-center px-4 py-4 border-b border-border">
            <TouchableOpacity
              onPress={() => setModalVisivel(false)}
              className="mr-3 p-2"
            >
              <Text className="text-foreground text-lg">✕</Text>
            </TouchableOpacity>
            <Text className="text-foreground text-lg font-bold flex-1">
              Detalhes da Solicitação
            </Text>
          </View>

          {usuarioSelecionado && (
            <FlatList
              data={[1]}
              keyExtractor={() => "details"}
              renderItem={() => (
                <View className="p-6">
                  {/* Dados do Solicitante */}
                  <View
                    className="rounded-2xl p-5 mb-4"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text className="text-foreground text-lg font-bold mb-3">
                      {usuarioSelecionado.name || "Sem nome"}
                    </Text>

                    <View className="gap-2">
                      <View className="flex-row">
                        <Text className="text-muted text-sm w-20">CPF:</Text>
                        <Text className="text-foreground text-sm flex-1">
                          {usuarioSelecionado.cpf || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-muted text-sm w-20">E-mail:</Text>
                        <Text className="text-foreground text-sm flex-1">
                          {usuarioSelecionado.email || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-muted text-sm w-20">Telefone:</Text>
                        <Text className="text-foreground text-sm flex-1">
                          {usuarioSelecionado.telefone || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-muted text-sm w-20">Cadastro:</Text>
                        <Text className="text-foreground text-sm flex-1">
                          {usuarioSelecionado.createdAt
                            ? formatarData(usuarioSelecionado.createdAt)
                            : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Comprovante PIX */}
                  {usuarioSelecionado.comprovantePix && (
                    <View
                      className="rounded-2xl p-4 mb-4"
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text className="text-foreground text-base font-semibold mb-3">
                        📎 Comprovante PIX
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setImagemAmpliadaUri(usuarioSelecionado.comprovantePix)
                        }
                      >
                        <Image
                          source={{ uri: usuarioSelecionado.comprovantePix }}
                          className="w-full h-48 rounded-xl"
                          resizeMode="contain"
                          style={{ backgroundColor: colors.border }}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Selecionar Role */}
                  <View
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text className="text-foreground text-base font-semibold mb-3">
                      Cargo/Função
                    </Text>
                    <View className="gap-2">
                      {ROLES_DISPONIVEIS.map((role) => (
                        <TouchableOpacity
                          key={role.value}
                          onPress={() => setRoleSelecionado(role.value)}
                          className="flex-row items-center py-3 px-4 rounded-xl"
                          style={{
                            backgroundColor:
                              roleSelecionado === role.value
                                ? corPrimaria + "15"
                                : "transparent",
                            borderWidth: 1,
                            borderColor:
                              roleSelecionado === role.value
                                ? corPrimaria
                                : colors.border,
                          }}
                        >
                          <View
                            className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                            style={{
                              borderWidth: 2,
                              borderColor:
                                roleSelecionado === role.value
                                  ? corPrimaria
                                  : colors.muted,
                              backgroundColor:
                                roleSelecionado === role.value
                                  ? corPrimaria
                                  : "transparent",
                            }}
                          >
                            {roleSelecionado === role.value && (
                              <View className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </View>
                          <Text
                            className="text-sm font-medium"
                            style={{
                              color:
                                roleSelecionado === role.value
                                  ? corPrimaria
                                  : colors.foreground,
                            }}
                          >
                            {role.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Motivo de Rejeição */}
                  <View
                    className="rounded-2xl p-4 mb-6"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text className="text-foreground text-base font-semibold mb-2">
                      Motivo (se rejeitar)
                    </Text>
                    <TextInput
                      value={motivoRejeicao}
                      onChangeText={setMotivoRejeicao}
                      placeholder="Opcional: motivo da rejeição..."
                      placeholderTextColor={colors.muted}
                      multiline
                      numberOfLines={3}
                      className="text-foreground text-sm rounded-xl p-3"
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 80,
                        textAlignVertical: "top",
                      }}
                    />
                  </View>

                  {/* Botões de Ação */}
                  <View className="flex-row gap-3 mb-8">
                    <TouchableOpacity
                      onPress={handleRejeitar}
                      disabled={rejeitarMutation.isPending}
                      className="flex-1 py-4 rounded-xl items-center"
                      style={{
                        backgroundColor: colors.error + "15",
                        borderWidth: 1,
                        borderColor: colors.error,
                        opacity: rejeitarMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      {rejeitarMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Text
                          className="text-base font-bold"
                          style={{ color: colors.error }}
                        >
                          Rejeitar
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleAprovar}
                      disabled={aprovarMutation.isPending}
                      className="flex-1 py-4 rounded-xl items-center"
                      style={{
                        backgroundColor: corPrimaria,
                        opacity: aprovarMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      {aprovarMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text className="text-white text-base font-bold">
                          Aprovar como {ROLES_LABELS[roleSelecionado] || roleSelecionado}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Modal de Imagem Ampliada */}
      <Modal
        visible={!!imagemAmpliadaUri}
        animationType="fade"
        transparent
        onRequestClose={() => setImagemAmpliadaUri(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setImagemAmpliadaUri(null)}
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
        >
          {imagemAmpliadaUri && (
            <Image
              source={{ uri: imagemAmpliadaUri }}
              className="w-full h-3/4"
              resizeMode="contain"
            />
          )}
          <Text className="text-white text-base mt-4">
            Toque para fechar
          </Text>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}
