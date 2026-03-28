/**
 * Formulário de Ensaio
 * Com máscaras de data (DD/MM/AAAA) e horário (HH:MM) no formato brasileiro
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import * as Haptics from "expo-haptics";

// Função para aplicar máscara de data (DD/MM/AAAA)
function aplicarMascaraData(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 2) {
    return numeros;
  } else if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  } else {
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
  }
}

// Função para aplicar máscara de horário (HH:MM)
function aplicarMascaraHorario(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 2) {
    return numeros;
  } else {
    return `${numeros.slice(0, 2)}:${numeros.slice(2, 4)}`;
  }
}

// Validar data no formato DD/MM/AAAA
function validarData(data: string): boolean {
  if (data.length !== 10) return false;
  const partes = data.split("/");
  if (partes.length !== 3) return false;
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const ano = parseInt(partes[2], 10);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
  if (dia < 1 || dia > 31) return false;
  if (mes < 1 || mes > 12) return false;
  if (ano < 2020 || ano > 2100) return false;
  return true;
}

// Validar horário no formato HH:MM
function validarHorario(horario: string): boolean {
  if (horario.length !== 5) return false;
  const partes = horario.split(":");
  if (partes.length !== 2) return false;
  const hora = parseInt(partes[0], 10);
  const minuto = parseInt(partes[1], 10);
  if (isNaN(hora) || isNaN(minuto)) return false;
  if (hora < 0 || hora > 23) return false;
  if (minuto < 0 || minuto > 59) return false;
  return true;
}

export default function EnsaioFormScreen() {
  const router = useRouter();
  const { blocos, addEnsaio } = useData();
  const { showSuccess, showError, showWarning } = useToast();
  const { escola } = useEscola();

  // Estado do formulário
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("Quadra da Escola");
  const [descricao, setDescricao] = useState("");
  const [blocosIds, setBlocosIds] = useState<string[]>(["todos"]);
  const [isSaving, setIsSaving] = useState(false);

  // Erros de validação
  const [erroData, setErroData] = useState<string | null>(null);
  const [erroHorario, setErroHorario] = useState<string | null>(null);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Validação
  const isValid = data.length === 10 && validarData(data) && 
                  horario.length === 5 && validarHorario(horario) && 
                  local.trim().length > 0;

  // Handler para campo de data com máscara
  const handleDataChange = (valor: string) => {
    const dataFormatada = aplicarMascaraData(valor);
    setData(dataFormatada);
    if (dataFormatada.length === 10) {
      if (!validarData(dataFormatada)) {
        setErroData("Data inválida. Use DD/MM/AAAA");
      } else {
        setErroData(null);
      }
    } else {
      setErroData(null);
    }
  };

  // Handler para campo de horário com máscara
  const handleHorarioChange = (valor: string) => {
    const horarioFormatado = aplicarMascaraHorario(valor);
    setHorario(horarioFormatado);
    if (horarioFormatado.length === 5) {
      if (!validarHorario(horarioFormatado)) {
        setErroHorario("Horário inválido. Use HH:MM");
      } else {
        setErroHorario(null);
      }
    } else {
      setErroHorario(null);
    }
  };

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
      if (prev.includes("todos")) {
        return [blocoId];
      }
      if (prev.includes(blocoId)) {
        const novos = prev.filter((id) => id !== blocoId);
        return novos.length === 0 ? ["todos"] : novos;
      }
      return [...prev, blocoId];
    });
  };

  // Salvar ensaio
  const handleSave = async () => {
    if (!validarData(data)) {
      showError("Erro", "Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }

    if (!validarHorario(horario)) {
      showError("Erro", "Horário inválido. Use o formato HH:MM.");
      return;
    }

    if (!local.trim()) {
      showError("Erro", "Informe o local do ensaio.");
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

      showSuccess("Ensaio criado!", "O ensaio foi agendado com sucesso.");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar ensaio:", error);
      showError("Erro", "Não foi possível salvar o ensaio. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-3 py-2 rounded-xl bg-background"
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-base font-medium">← Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-bold">
            🎵 Novo Ensaio
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="px-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: isValid && !isSaving ? corPrimaria : "#ccc",
              opacity: isValid && !isSaving ? 1 : 0.6 
            }}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">
              {isSaving ? "..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-6">
            {/* Campo: Data com Máscara */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-foreground text-base font-semibold">
                  📅 Data
                </Text>
                <Text className="text-error">*</Text>
                <TouchableOpacity
                  onPress={() => showWarning("Formato", "Digite a data no formato DD/MM/AAAA\nExemplo: 15/03/2026")}
                  className="ml-1"
                >
                  <Text className="text-primary text-lg">ⓘ</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                className={`bg-surface border rounded-xl px-4 py-4 text-foreground text-lg ${
                  erroData ? "border-error" : "border-border"
                }`}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9BA1A6"
                value={data}
                onChangeText={handleDataChange}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="next"
              />
              {erroData && (
                <Text className="text-error text-sm mt-1">{erroData}</Text>
              )}
              <Text className="text-muted text-xs mt-1">
                Exemplo: 25/01/2026
              </Text>
            </View>

            {/* Campo: Horário com Máscara */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-foreground text-base font-semibold">
                  🕐 Horário
                </Text>
                <Text className="text-error">*</Text>
                <TouchableOpacity
                  onPress={() => showWarning("Formato", "Digite o horário no formato HH:MM\nExemplo: 19:00")}
                  className="ml-1"
                >
                  <Text className="text-primary text-lg">ⓘ</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                className={`bg-surface border rounded-xl px-4 py-4 text-foreground text-lg ${
                  erroHorario ? "border-error" : "border-border"
                }`}
                placeholder="HH:MM"
                placeholderTextColor="#9BA1A6"
                value={horario}
                onChangeText={handleHorarioChange}
                keyboardType="numeric"
                maxLength={5}
                returnKeyType="next"
              />
              {erroHorario && (
                <Text className="text-error text-sm mt-1">{erroHorario}</Text>
              )}
              <Text className="text-muted text-xs mt-1">
                Exemplo: 19:00 (formato 24 horas)
              </Text>
            </View>

            {/* Campo: Local */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-foreground text-base font-semibold">
                  📍 Local
                </Text>
                <Text className="text-error">*</Text>
              </View>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Ex: Quadra da Escola"
                placeholderTextColor="#9BA1A6"
                value={local}
                onChangeText={setLocal}
                returnKeyType="next"
              />
            </View>

            {/* Campo: Descrição */}
            <View>
              <Text className="text-foreground text-base font-semibold mb-2">
                📝 Descrição
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Ex: Ensaio geral, Ensaio de bateria..."
                placeholderTextColor="#9BA1A6"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={2}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Campo: Segmentos Participantes */}
            <View>
              <Text className="text-foreground text-base font-semibold mb-3">
                🎪 Segmentos Participantes
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {/* Opção "Todos" */}
                <TouchableOpacity
                  onPress={() => toggleBloco("todos")}
                  className={`px-5 py-3 rounded-xl ${
                    blocosIds.includes("todos")
                      ? ""
                      : "bg-surface border border-border"
                  }`}
                  style={blocosIds.includes("todos") ? { backgroundColor: corPrimaria } : {}}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-base font-semibold ${
                      blocosIds.includes("todos")
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    Todos os Segmentos
                  </Text>
                </TouchableOpacity>

                {/* Segmentos individuais */}
                {blocos.map((bloco) => (
                  <TouchableOpacity
                    key={bloco.id}
                    onPress={() => toggleBloco(bloco.id)}
                    className={`px-5 py-3 rounded-xl ${
                      blocosIds.includes(bloco.id)
                        ? ""
                        : "bg-surface border border-border"
                    }`}
                    style={blocosIds.includes(bloco.id) ? { backgroundColor: corPrimaria } : {}}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-base font-semibold ${
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

            {/* Espaço extra no final */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
