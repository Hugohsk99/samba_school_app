/**
 * Formulário de Evento
 * Com máscaras de data (DD/MM/AAAA) e horário (HH:MM) no formato brasileiro
 */

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
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import * as Haptics from "expo-haptics";
import { TIPOS_EVENTO } from "@/lib/types";
import type { Evento } from "@/lib/types";

// Função para aplicar máscara de data (DD/MM/AAAA)
function aplicarMascaraData(valor: string): string {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, "");
  
  // Aplica a máscara
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
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, "");
  
  // Aplica a máscara
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

export default function EventoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { eventos, blocos, addEvento, updateEvento } = useData();
  const { showSuccess, showError, showWarning } = useToast();
  const { escola } = useEscola();

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

  // Erros de validação
  const [erroData, setErroData] = useState<string | null>(null);
  const [erroHorario, setErroHorario] = useState<string | null>(null);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Validação
  const isValid = titulo.trim().length > 0 && 
                  data.length === 10 && validarData(data) && 
                  horario.length === 5 && validarHorario(horario);

  // Handler para campo de data com máscara
  const handleDataChange = (valor: string) => {
    const dataFormatada = aplicarMascaraData(valor);
    setData(dataFormatada);
    
    // Validar quando completo
    if (dataFormatada.length === 10) {
      if (!validarData(dataFormatada)) {
        setErroData("Data inválida. Use o formato DD/MM/AAAA");
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
    
    // Validar quando completo
    if (horarioFormatado.length === 5) {
      if (!validarHorario(horarioFormatado)) {
        setErroHorario("Horário inválido. Use o formato HH:MM (00:00 a 23:59)");
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
    // Validações
    if (!titulo.trim()) {
      showError("Erro", "Informe o título do evento.");
      return;
    }

    if (!validarData(data)) {
      showError("Erro", "Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }

    if (!validarHorario(horario)) {
      showError("Erro", "Horário inválido. Use o formato HH:MM.");
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
        showSuccess("Atualizado!", "Evento atualizado com sucesso.");
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
        showSuccess("Criado!", "Evento criado com sucesso.");
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      showError("Erro", "Não foi possível salvar o evento. Tente novamente.");
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
            {isEditing ? "✏️ Editar Evento" : "📅 Novo Evento"}
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
            {/* Campo: Título */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-foreground text-base font-semibold">
                  Título do Evento
                </Text>
                <Text className="text-error">*</Text>
              </View>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Ex: Ensaio Geral, Feijoada..."
                placeholderTextColor="#9BA1A6"
                value={titulo}
                onChangeText={setTitulo}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Tipo */}
            <View>
              <Text className="text-foreground text-base font-semibold mb-3">
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
                    className={`px-5 py-3 rounded-xl ${
                      tipo === t.value
                        ? ""
                        : "bg-surface border border-border"
                    }`}
                    style={tipo === t.value ? { backgroundColor: corPrimaria } : {}}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        tipo === t.value ? "text-white" : "text-foreground"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
                Exemplo: 15/03/2026
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
                  onPress={() => showWarning("Formato", "Digite o horário no formato HH:MM\nExemplo: 19:30")}
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
                Exemplo: 19:30 (formato 24 horas)
              </Text>
            </View>

            {/* Campo: Local */}
            <View>
              <Text className="text-foreground text-base font-semibold mb-2">
                📍 Local
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Endereço ou nome do local"
                placeholderTextColor="#9BA1A6"
                value={local}
                onChangeText={setLocal}
                autoCapitalize="words"
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
                placeholder="Detalhes sobre o evento"
                placeholderTextColor="#9BA1A6"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={3}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>

            {/* Campo: Blocos Participantes */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-foreground text-base font-semibold">
                  🎪 Blocos Participantes
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={selecionarTodos} activeOpacity={0.7}>
                    <Text className="text-primary text-sm font-medium">Todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={limparSelecao} activeOpacity={0.7}>
                    <Text className="text-muted text-sm font-medium">Limpar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {blocos.length === 0 ? (
                <View className="bg-surface border border-border rounded-xl p-6 items-center">
                  <Text className="text-4xl mb-2">📭</Text>
                  <Text className="text-muted text-center">
                    Nenhum bloco cadastrado ainda.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {blocos.map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => toggleBloco(bloco.id)}
                      className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                        blocosIds.includes(bloco.id)
                          ? "border-2"
                          : "bg-surface border-border"
                      }`}
                      style={blocosIds.includes(bloco.id) ? { 
                        backgroundColor: corPrimaria + "15",
                        borderColor: corPrimaria 
                      } : {}}
                      activeOpacity={0.8}
                    >
                      {/* Checkbox */}
                      <View
                        className={`w-6 h-6 rounded-lg items-center justify-center ${
                          blocosIds.includes(bloco.id)
                            ? ""
                            : "bg-background border-2 border-border"
                        }`}
                        style={blocosIds.includes(bloco.id) ? { backgroundColor: corPrimaria } : {}}
                      >
                        {blocosIds.includes(bloco.id) && (
                          <Text className="text-white text-sm font-bold">✓</Text>
                        )}
                      </View>

                      {/* Cor do bloco */}
                      <View
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: bloco.cor || corPrimaria }}
                      />

                      {/* Nome do bloco */}
                      <Text className="text-foreground text-base font-medium flex-1">
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
