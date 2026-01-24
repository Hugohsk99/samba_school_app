import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
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
  const { showSuccess, showError, showWarning, showInfo } = useToast();

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
  const [tipo, setTipo] = useState<'ala' | 'segmento'>(blocoExistente?.tipo || 'ala');
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = nome.trim().length > 0 && responsavel.trim().length > 0;

  // Salvar bloco
  const handleSave = async () => {
    if (!nome.trim()) {
      showWarning("Campo obrigatório", "Digite o nome do bloco.");
      return;
    }

    if (!responsavel.trim()) {
      showWarning("Campo obrigatório", "Digite o nome do responsável.");
      return;
    }

    setIsSaving(true);
    showInfo("Salvando...", "Aguarde enquanto salvamos o bloco.");

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
          tipo,
        });
        showSuccess("Bloco atualizado!", `"${nome.trim()}" foi atualizado com sucesso.`);
      } else {
        await addBloco({
          nome: nome.trim(),
          responsavel: responsavel.trim(),
          descricao: descricao.trim(),
          cor,
          tipo,
        });
        showSuccess("Bloco criado!", `"${nome.trim()}" foi adicionado com sucesso.`);
      }

      // Aguardar um pouco para o usuário ver a mensagem
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar bloco:", error);
      showError("Erro ao salvar", "Não foi possível salvar o bloco. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={handleCancel}
            className="flex-row items-center px-3 py-2 rounded-xl bg-background"
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-lg font-medium">← Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-xl font-bold">
            {isEditing ? "✏️ Editar Bloco" : "➕ Novo Bloco"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="px-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: isValid && !isSaving ? "#22C55E" : "#ccc",
              opacity: isValid && !isSaving ? 1 : 0.7
            }}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white text-lg font-bold">Salvando...</Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-bold">✓ Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-6 pb-32">
            {/* Campo: Nome */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-base font-bold mb-3">
                🎭 Nome do Bloco *
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Ex: Bateria, Passistas, Ala das Baianas"
                placeholderTextColor="#9BA1A6"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Tipo */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-base font-bold mb-3">
                📋 Tipo do Bloco
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setTipo('ala');
                    showInfo("Tipo selecionado", "Ala - grupo de desfilantes");
                  }}
                  className={`flex-1 py-4 rounded-xl items-center ${
                    tipo === 'ala'
                      ? "bg-primary"
                      : "bg-background border border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mb-1">👥</Text>
                  <Text
                    className={`font-bold text-base ${
                      tipo === 'ala' ? "text-white" : "text-foreground"
                    }`}
                  >
                    Ala
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setTipo('segmento');
                    showInfo("Tipo selecionado", "Segmento - grupo especializado");
                  }}
                  className={`flex-1 py-4 rounded-xl items-center ${
                    tipo === 'segmento'
                      ? "bg-primary"
                      : "bg-background border border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mb-1">🥁</Text>
                  <Text
                    className={`font-bold text-base ${
                      tipo === 'segmento' ? "text-white" : "text-foreground"
                    }`}
                  >
                    Segmento
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo: Responsável */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-base font-bold mb-3">
                👤 Responsável *
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Nome do responsável pelo bloco"
                placeholderTextColor="#9BA1A6"
                value={responsavel}
                onChangeText={setResponsavel}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Descrição */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-base font-bold mb-3">
                📝 Descrição (opcional)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Descrição ou observações sobre o bloco"
                placeholderTextColor="#9BA1A6"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={3}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>

            {/* Campo: Cor */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-base font-bold mb-3">
                🎨 Cor do Bloco
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
                      showInfo("Cor selecionada", corOption.nome);
                    }}
                    className={`w-14 h-14 rounded-xl items-center justify-center ${
                      cor === corOption.valor
                        ? "border-4 border-foreground"
                        : "border-2 border-border"
                    }`}
                    style={{ backgroundColor: corOption.valor }}
                    activeOpacity={0.8}
                  >
                    {cor === corOption.valor && (
                      <Text className="text-white text-xl font-bold">✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview do Bloco */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-base font-bold mb-3">
                👁️ Pré-visualização
              </Text>
              <View className="bg-background rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: `${cor}20` }}
                  >
                    <View
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: cor }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-xl font-bold">
                      {nome || "Nome do Bloco"}
                    </Text>
                    <Text className="text-muted text-base mt-1">
                      Responsável: {responsavel || "—"}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View 
                        className="px-2 py-1 rounded-md"
                        style={{ backgroundColor: `${cor}30` }}
                      >
                        <Text className="text-xs font-medium" style={{ color: cor }}>
                          {tipo === 'ala' ? 'ALA' : 'SEGMENTO'}
                        </Text>
                      </View>
                    </View>
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
