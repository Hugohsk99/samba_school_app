import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";

// Cores disponíveis para os blocos
const CORES_DISPONIVEIS = [
  { nome: "Laranja", valor: "#FF6B35" },
  { nome: "Turquesa", valor: "#4ECDC4" },
  { nome: "Amarelo", valor: "#FFE66D" },
  { nome: "Verde Água", valor: "#95E1D3" },
  { nome: "Coral", valor: "#F38181" },
  { nome: "Roxo", valor: "#AA96DA" },
  { nome: "Rosa", valor: "#FCBAD3" },
  { nome: "Azul Claro", valor: "#A8D8EA" },
];

export default function BlocoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const { blocos, addBloco, updateBloco } = useData();

  const isEditing = params.mode === "edit" && params.id;
  const blocoExistente = isEditing
    ? blocos.find((b) => b.id === params.id)
    : null;

  // Estado do formulário
  const [nome, setNome] = useState(blocoExistente?.nome || "");
  const [responsavel, setResponsavel] = useState(
    blocoExistente?.responsavel || ""
  );
  const [descricao, setDescricao] = useState(blocoExistente?.descricao || "");
  const [cor, setCor] = useState(blocoExistente?.cor || CORES_DISPONIVEIS[0].valor);
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = nome.trim().length > 0 && responsavel.trim().length > 0;

  // Salvar bloco
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (isEditing && params.id) {
        await updateBloco(params.id, {
          nome: nome.trim(),
          responsavel: responsavel.trim(),
          descricao: descricao.trim(),
          cor,
        });
      } else {
        await addBloco({
          nome: nome.trim(),
          responsavel: responsavel.trim(),
          descricao: descricao.trim(),
          cor,
        });
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar bloco:", error);
      Alert.alert("Erro", "Não foi possível salvar o bloco. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
            style={{ opacity: isSaving ? 0.5 : 1 }}
            disabled={isSaving}
          >
            <Text className="text-primary text-base">Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            {isEditing ? "Editar Bloco" : "Novo Bloco"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="p-2"
            style={{ opacity: isValid && !isSaving ? 1 : 0.5 }}
            disabled={!isValid || isSaving}
          >
            <Text className="text-primary text-base font-semibold">
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <ScrollView className="flex-1 p-6">
          <View className="gap-6">
            {/* Campo: Nome */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Nome do Bloco *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: Bateria, Passistas, Ala das Baianas"
                placeholderTextColor="#687076"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Responsável */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Responsável *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Nome do responsável pelo bloco"
                placeholderTextColor="#687076"
                value={responsavel}
                onChangeText={setResponsavel}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Descrição */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Descrição
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Descrição ou observações sobre o bloco"
                placeholderTextColor="#687076"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Campo: Cor */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-3">
                Cor do Bloco
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CORES_DISPONIVEIS.map((corOption) => (
                  <TouchableOpacity
                    key={corOption.valor}
                    onPress={() => {
                      setCor(corOption.valor);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      cor === corOption.valor
                        ? "border-4 border-foreground"
                        : "border-2 border-border"
                    }`}
                    style={{ backgroundColor: corOption.valor }}
                  >
                    {cor === corOption.valor && (
                      <Text className="text-white text-lg font-bold">✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview do Bloco */}
            <View className="mt-4">
              <Text className="text-foreground text-sm font-medium mb-3">
                Pré-visualização
              </Text>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${cor}20` }}
                  >
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cor }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-lg font-semibold">
                      {nome || "Nome do Bloco"}
                    </Text>
                    <Text className="text-muted text-sm mt-0.5">
                      Responsável: {responsavel || "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
