import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";

export default function EnsaioFormScreen() {
  const router = useRouter();
  const { blocos, addEnsaio } = useData();

  // Estado do formulário
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("Quadra da Escola");
  const [descricao, setDescricao] = useState("");
  const [blocosIds, setBlocosIds] = useState<string[]>(["todos"]);
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = data.trim().length > 0 && horario.trim().length > 0 && local.trim().length > 0;

  // Toggle bloco selecionado
  const toggleBloco = (blocoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (blocoId === "todos") {
      setBlocosIds(["todos"]);
      return;
    }

    setBlocosIds((prev) => {
      // Se "todos" está selecionado, remover e adicionar o bloco específico
      if (prev.includes("todos")) {
        return [blocoId];
      }

      // Toggle do bloco
      if (prev.includes(blocoId)) {
        const novos = prev.filter((id) => id !== blocoId);
        // Se não sobrou nenhum, voltar para "todos"
        return novos.length === 0 ? ["todos"] : novos;
      }

      return [...prev, blocoId];
    });
  };

  // Salvar ensaio
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

      await addEnsaio({
        data: data.trim(),
        horario: horario.trim(),
        local: local.trim(),
        descricao: descricao.trim(),
        blocosIds,
        status: "agendado",
      });

      router.back();
    } catch (error) {
      console.error("Erro ao salvar ensaio:", error);
      Alert.alert("Erro", "Não foi possível salvar o ensaio. Tente novamente.");
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
            disabled={isSaving}
          >
            <Text className="text-primary text-base">Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            Novo Ensaio
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
            {/* Campo: Data */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Data *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: 25 Jan 2026"
                placeholderTextColor="#687076"
                value={data}
                onChangeText={setData}
                returnKeyType="next"
              />
            </View>

            {/* Campo: Horário */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Horário *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: 19:00 - 22:00"
                placeholderTextColor="#687076"
                value={horario}
                onChangeText={setHorario}
                returnKeyType="next"
              />
            </View>

            {/* Campo: Local */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Local *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: Quadra da Escola"
                placeholderTextColor="#687076"
                value={local}
                onChangeText={setLocal}
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
                placeholder="Ex: Ensaio geral, Ensaio de bateria..."
                placeholderTextColor="#687076"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={2}
                style={{ minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            {/* Campo: Blocos Participantes */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-3">
                Blocos Participantes
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {/* Opção "Todos" */}
                <TouchableOpacity
                  onPress={() => toggleBloco("todos")}
                  className={`px-4 py-2 rounded-full ${
                    blocosIds.includes("todos")
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      blocosIds.includes("todos")
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    Todos os Blocos
                  </Text>
                </TouchableOpacity>

                {/* Blocos individuais */}
                {blocos.map((bloco) => (
                  <TouchableOpacity
                    key={bloco.id}
                    onPress={() => toggleBloco(bloco.id)}
                    className={`px-4 py-2 rounded-full ${
                      blocosIds.includes(bloco.id)
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        blocosIds.includes(bloco.id)
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      {bloco.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
