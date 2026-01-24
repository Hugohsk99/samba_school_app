/**
 * Tela de Devolução de Fantasia
 * Permite registrar a devolução de fantasias com estado de conservação
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import type { EntregaFantasia, EstadoConservacao } from "@/lib/types";

// Estados de conservação disponíveis
const ESTADOS_CONSERVACAO: { value: EstadoConservacao; label: string; emoji: string; cor: string }[] = [
  { value: "novo", label: "Novo", emoji: "✨", cor: "#22C55E" },
  { value: "bom", label: "Bom Estado", emoji: "👍", cor: "#3B82F6" },
  { value: "regular", label: "Regular", emoji: "⚠️", cor: "#F59E0B" },
  { value: "danificado", label: "Danificado", emoji: "❌", cor: "#EF4444" },
];

export default function DevolucaoFantasiaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entregaId?: string }>();
  const { 
    materiais, 
    integrantes, 
    entregasFantasias,
    registrarDevolucao, 
    updateMaterial 
  } = useData();
  const { showSuccess, showError, showWarning } = useToast();
  const { escola } = useEscola();
  const { sessao } = useAuth();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Estados
  const [entregaSelecionada, setEntregaSelecionada] = useState<EntregaFantasia | null>(null);
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>("bom");
  const [observacao, setObservacao] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [etapa, setEtapa] = useState<"selecionar" | "confirmar">("selecionar");

  // Filtrar apenas entregas pendentes (não devolvidas)
  const entregasPendentes = entregasFantasias.filter(e => e.status === "entregue");

  // Carregar entrega se vier por parâmetro
  useEffect(() => {
    if (params.entregaId) {
      const entrega = entregasFantasias.find(e => e.id === params.entregaId);
      if (entrega) {
        setEntregaSelecionada(entrega);
        setEtapa("confirmar");
      }
    }
  }, [params.entregaId]);

  // Obter dados do material e integrante
  const getMaterial = (materialId: string) => materiais.find(m => m.id === materialId);
  const getIntegrante = (integranteId: string) => integrantes.find(i => i.id === integranteId);

  // Selecionar entrega
  const handleSelecionarEntrega = (entrega: EntregaFantasia) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEntregaSelecionada(entrega);
    setEtapa("confirmar");
    
    const material = getMaterial(entrega.materialId);
    showSuccess("Entrega selecionada", material?.nome || "Fantasia");
  };

  // Confirmar devolução
  const handleConfirmarDevolucao = async () => {
    if (!entregaSelecionada) {
      showError("Erro", "Selecione uma entrega para devolver.");
      return;
    }

    setIsProcessing(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Registrar devolução
      await registrarDevolucao(
        entregaSelecionada.id,
        sessao?.nome || "Sistema",
        estadoConservacao,
        observacao.trim() || undefined
      );

      // Atualizar estoque do material
      const material = getMaterial(entregaSelecionada.materialId);
      if (material) {
        await updateMaterial(material.id, {
          quantidadeDisponivel: material.quantidadeDisponivel + 1,
          quantidadeEmUso: Math.max(0, (material.quantidadeEmUso || 0) - 1),
        });
      }

      const integrante = getIntegrante(entregaSelecionada.integranteId);
      showSuccess(
        "Devolução registrada!",
        `Fantasia devolvida por ${integrante?.nome || "integrante"}`
      );

      // Voltar para a tela anterior
      router.back();
    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
      showError("Erro", "Não foi possível registrar a devolução. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Voltar etapa
  const handleVoltar = () => {
    if (etapa === "confirmar") {
      setEtapa("selecionar");
      setEntregaSelecionada(null);
      setEstadoConservacao("bom");
      setObservacao("");
    } else {
      router.back();
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={handleVoltar}
            className="px-3 py-2 rounded-xl bg-background"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-base font-medium">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-bold">
            🔄 Devolução de Fantasia
          </Text>

          <View className="w-20" />
        </View>

        {/* Conteúdo */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Etapa 1: Selecionar Entrega */}
          {etapa === "selecionar" && (
            <View className="p-4">
              <Text className="text-foreground text-xl font-bold mb-2">
                Selecione a Fantasia
              </Text>
              <Text className="text-muted text-base mb-4">
                Escolha a fantasia que está sendo devolvida
              </Text>

              {entregasPendentes.length === 0 ? (
                <View className="bg-success/10 p-4 rounded-xl">
                  <Text className="text-success text-center font-medium">
                    ✓ Todas as fantasias foram devolvidas!
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {entregasPendentes.map((entrega) => {
                    const material = getMaterial(entrega.materialId);
                    const integrante = getIntegrante(entrega.integranteId);
                    const dataEntrega = new Date(entrega.dataEntrega).toLocaleDateString("pt-BR");
                    
                    return (
                      <TouchableOpacity
                        key={entrega.id}
                        onPress={() => handleSelecionarEntrega(entrega)}
                        className="bg-surface p-4 rounded-xl border border-border"
                        activeOpacity={0.8}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className="text-foreground text-lg font-bold">
                              👗 {material?.nome || "Fantasia"}
                            </Text>
                            {material?.tamanho && (
                              <Text className="text-muted text-sm">
                                Tamanho: {material.tamanho}
                              </Text>
                            )}
                            <View className="mt-2 pt-2 border-t border-border">
                              <Text className="text-foreground text-sm font-medium">
                                👤 {integrante?.nome || "Integrante"}
                              </Text>
                              <Text className="text-muted text-xs">
                                Entregue em: {dataEntrega}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-primary text-2xl">→</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Etapa 2: Confirmar Devolução */}
          {etapa === "confirmar" && entregaSelecionada && (
            <View className="p-4">
              {/* Resumo da entrega */}
              <View className="bg-surface p-4 rounded-xl border border-border mb-6">
                <Text className="text-muted text-sm mb-2">FANTASIA SELECIONADA</Text>
                <Text className="text-foreground text-xl font-bold">
                  👗 {getMaterial(entregaSelecionada.materialId)?.nome}
                </Text>
                <Text className="text-muted text-base mt-1">
                  👤 {getIntegrante(entregaSelecionada.integranteId)?.nome}
                </Text>
              </View>

              {/* Estado de Conservação */}
              <Text className="text-foreground text-xl font-bold mb-2">
                Estado de Conservação
              </Text>
              <Text className="text-muted text-base mb-4">
                Como está a fantasia após o uso?
              </Text>

              <View className="gap-3 mb-6">
                {ESTADOS_CONSERVACAO.map((estado) => (
                  <TouchableOpacity
                    key={estado.value}
                    onPress={() => {
                      setEstadoConservacao(estado.value);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 flex-row items-center gap-3 ${
                      estadoConservacao === estado.value
                        ? ""
                        : "bg-surface border-border"
                    }`}
                    style={estadoConservacao === estado.value ? {
                      backgroundColor: estado.cor + "15",
                      borderColor: estado.cor,
                    } : {}}
                    activeOpacity={0.8}
                  >
                    <Text className="text-3xl">{estado.emoji}</Text>
                    <View className="flex-1">
                      <Text 
                        className="text-lg font-bold"
                        style={{ color: estadoConservacao === estado.value ? estado.cor : undefined }}
                      >
                        {estado.label}
                      </Text>
                    </View>
                    {estadoConservacao === estado.value && (
                      <Text style={{ color: estado.cor }} className="text-2xl">✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Observações */}
              <Text className="text-foreground text-base font-semibold mb-2">
                📝 Observações (opcional)
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base mb-6"
                placeholder="Descreva detalhes sobre o estado da fantasia..."
                placeholderTextColor="#9BA1A6"
                value={observacao}
                onChangeText={setObservacao}
                multiline
                numberOfLines={3}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />

              {/* Resumo Final */}
              <View className="bg-surface p-4 rounded-xl border border-border mb-6">
                <Text className="text-muted text-sm mb-2">RESUMO DA DEVOLUÇÃO</Text>
                <View className="gap-1">
                  <Text className="text-foreground text-base">
                    📅 {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text className="text-foreground text-base">
                    👤 Responsável: {sessao?.nome || "Sistema"}
                  </Text>
                  <Text className="text-foreground text-base">
                    {ESTADOS_CONSERVACAO.find(e => e.value === estadoConservacao)?.emoji} Estado: {ESTADOS_CONSERVACAO.find(e => e.value === estadoConservacao)?.label}
                  </Text>
                </View>
              </View>

              {/* Botões */}
              <View className="gap-3">
                <TouchableOpacity
                  onPress={handleConfirmarDevolucao}
                  className="p-4 rounded-xl items-center"
                  style={{ backgroundColor: corPrimaria }}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  <Text className="text-white text-lg font-bold">
                    {isProcessing ? "Processando..." : "✓ Confirmar Devolução"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleVoltar}
                  className="p-4 rounded-xl items-center bg-surface border border-border"
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  <Text className="text-foreground text-lg font-medium">
                    ← Voltar e Alterar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Espaço extra */}
          <View className="h-8" />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
