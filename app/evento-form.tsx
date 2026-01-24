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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import { TIPOS_EVENTO } from "@/lib/types";
import type { Evento } from "@/lib/types";

export default function EventoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { eventos, blocos, addEvento, updateEvento } = useData();

  const isEditing = !!params.id;
  const eventoExistente = isEditing ? eventos.find(e => e.id === params.id) : null;

  // Estado do formulário
  const [titulo, setTitulo] = useState(eventoExistente?.titulo || "");
  const [tipo, setTipo] = useState<Evento['tipo']>(eventoExistente?.tipo || "ensaio");
  const [data, setData] = useState(eventoExistente?.data || "");
  const [horario, setHorario] = useState(eventoExistente?.horario || "");
  const [local, setLocal] = useState(eventoExistente?.local || "");
  const [descricao, setDescricao] = useState(eventoExistente?.descricao || "");
  const [blocosIds, setBlocosIds] = useState<string[]>(eventoExistente?.blocosIds || []);
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = titulo.trim().length > 0 && data.trim().length > 0 && horario.trim().length > 0;

  // Toggle bloco selecionado
  const toggleBloco = (blocoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setBlocosIds((prev) => {
      if (prev.includes(blocoId)) {
        return prev.filter((id) => id !== blocoId);
      }
      return [...prev, blocoId];
    });
  };

  // Selecionar todos os blocos
  const selecionarTodos = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setBlocosIds(blocos.map(b => b.id));
  };

  // Limpar seleção
  const limparSelecao = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setBlocosIds([]);
  };

  // Salvar evento
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Erro", "Preencha título, data e horário.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (isEditing && params.id) {
        await updateEvento(params.id, {
          titulo: titulo.trim(),
          tipo,
          data: data.trim(),
          horario: horario.trim(),
          local: local.trim(),
          descricao: descricao.trim(),
          blocosIds,
        });
      } else {
        await addEvento({
          titulo: titulo.trim(),
          tipo,
          data: data.trim(),
          horario: horario.trim(),
          local: local.trim(),
          descricao: descricao.trim(),
          blocosIds,
          status: 'agendado',
          checkInAberto: false,
        });
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      Alert.alert("Erro", "Não foi possível salvar o evento. Tente novamente.");
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
            {isEditing ? "Editar Evento" : "Novo Evento"}
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
            {/* Campo: Título */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Título do Evento *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: Ensaio Geral, Feijoada Beneficente..."
                placeholderTextColor="#687076"
                value={titulo}
                onChangeText={setTitulo}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Tipo */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Tipo de Evento
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TIPOS_EVENTO.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => {
                      setTipo(t.value);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className={`px-4 py-2 rounded-full ${
                      tipo === t.value
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        tipo === t.value ? "text-white" : "text-foreground"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Campo: Data */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Data *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#687076"
                value={data}
                onChangeText={setData}
                keyboardType="numeric"
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
                placeholder="HH:MM"
                placeholderTextColor="#687076"
                value={horario}
                onChangeText={setHorario}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Local */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Local
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Endereço ou nome do local"
                placeholderTextColor="#687076"
                value={local}
                onChangeText={setLocal}
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
                placeholder="Detalhes sobre o evento"
                placeholderTextColor="#687076"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Campo: Blocos Participantes */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground text-sm font-medium">
                  Blocos Participantes
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={selecionarTodos}>
                    <Text className="text-primary text-xs">Todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={limparSelecao}>
                    <Text className="text-muted text-xs">Limpar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {blocos.length === 0 ? (
                <View className="bg-surface border border-border rounded-xl p-4 items-center">
                  <Text className="text-muted text-center">
                    Nenhum bloco cadastrado.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {blocos.map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => toggleBloco(bloco.id)}
                      className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                        blocosIds.includes(bloco.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      {/* Checkbox */}
                      <View
                        className={`w-5 h-5 rounded items-center justify-center ${
                          blocosIds.includes(bloco.id)
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                      >
                        {blocosIds.includes(bloco.id) && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>

                      {/* Cor do bloco */}
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bloco.cor }}
                      />

                      {/* Nome do bloco */}
                      <Text className="text-foreground text-sm font-medium flex-1">
                        {bloco.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Espaço extra no final */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
