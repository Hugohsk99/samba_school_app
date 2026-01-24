import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";

export default function BlocoDetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { blocos, deleteBloco, getIntegrantesByBloco } = useData();
  const [isDeleting, setIsDeleting] = useState(false);

  const bloco = blocos.find((b) => b.id === params.id);
  const integrantes = bloco ? getIntegrantesByBloco(bloco.id) : [];

  if (!bloco) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-xl font-semibold mb-2">
            Bloco não encontrado
          </Text>
          <Text className="text-muted text-center mb-6">
            O bloco que você está procurando não existe ou foi removido.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const handleEdit = () => {
    router.push({
      pathname: "/bloco-form",
      params: { id: bloco.id, mode: "edit" },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Bloco",
      `Tem certeza que deseja excluir o bloco "${bloco.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                );
              }
              await deleteBloco(bloco.id);
              router.back();
            } catch (error) {
              console.error("Erro ao excluir bloco:", error);
              Alert.alert(
                "Erro",
                "Não foi possível excluir o bloco. Tente novamente."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            Detalhes
          </Text>

          <TouchableOpacity onPress={handleEdit} className="p-2">
            <Text className="text-primary text-base font-semibold">Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo */}
        <ScrollView className="flex-1">
          {/* Card Principal */}
          <View className="p-6">
            <View className="bg-surface rounded-2xl p-6 border border-border">
              {/* Ícone e Nome */}
              <View className="items-center mb-6">
                <View
                  className="w-24 h-24 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: `${bloco.cor}20` }}
                >
                  <View
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: bloco.cor }}
                  />
                </View>
                <Text className="text-foreground text-2xl font-bold text-center">
                  {bloco.nome}
                </Text>
              </View>

              {/* Informações */}
              <View className="gap-4">
                <View className="flex-row items-center justify-between py-3 border-b border-border">
                  <Text className="text-muted text-sm">Responsável</Text>
                  <Text className="text-foreground text-base font-medium">
                    {bloco.responsavel}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-border">
                  <Text className="text-muted text-sm">Integrantes</Text>
                  <Text className="text-foreground text-base font-medium">
                    {integrantes.length} pessoas
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-border">
                  <Text className="text-muted text-sm">Criado em</Text>
                  <Text className="text-foreground text-base font-medium">
                    {formatDate(bloco.criadoEm)}
                  </Text>
                </View>

                {bloco.descricao && (
                  <View className="py-3">
                    <Text className="text-muted text-sm mb-2">Descrição</Text>
                    <Text className="text-foreground text-base">
                      {bloco.descricao}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Lista de Integrantes */}
          <View className="px-6 pb-6">
            <Text className="text-foreground text-lg font-semibold mb-4">
              Integrantes ({integrantes.length})
            </Text>

            {integrantes.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-muted text-center">
                  Nenhum integrante cadastrado neste bloco.
                </Text>
                <TouchableOpacity className="mt-4 bg-primary px-4 py-2 rounded-xl">
                  <Text className="text-white font-medium">
                    Adicionar Integrante
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2">
                {integrantes.map((integrante) => (
                  <View
                    key={integrante.id}
                    className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
                  >
                    <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                      <Text className="text-primary text-lg font-semibold">
                        {integrante.nome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-base font-medium">
                        {integrante.nome}
                      </Text>
                      {integrante.telefone && (
                        <Text className="text-muted text-sm">
                          {integrante.telefone}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Botão de Excluir */}
          <View className="px-6 pb-8">
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              className="bg-error/10 rounded-xl py-4 items-center"
              style={{ opacity: isDeleting ? 0.5 : 1 }}
            >
              <Text className="text-error font-semibold">
                {isDeleting ? "Excluindo..." : "Excluir Bloco"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
