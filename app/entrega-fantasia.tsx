/**
 * Tela de Entrega de Fantasia
 * Permite registrar a entrega de fantasias aos integrantes via QR Code
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import type { Material, Integrante, EntregaFantasia } from "@/lib/types";

export default function EntregaFantasiaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ materialId?: string; integranteId?: string }>();
  const { materiais, integrantes, registrarEntrega, updateMaterial } = useData();
  const { showSuccess, showError, showWarning } = useToast();
  const { escola } = useEscola();
  const { sessao } = useAuth();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Estados
  const [materialSelecionado, setMaterialSelecionado] = useState<Material | null>(null);
  const [integranteSelecionado, setIntegranteSelecionado] = useState<Integrante | null>(null);
  const [etapa, setEtapa] = useState<"material" | "integrante" | "confirmar">("material");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrar apenas fantasias disponíveis
  const fantasiasDisponiveis = materiais.filter(
    m => m.categoria === "fantasia" && m.quantidadeDisponivel > 0
  );

  // Carregar material se vier por parâmetro
  useEffect(() => {
    if (params.materialId) {
      const material = materiais.find(m => m.id === params.materialId);
      if (material) {
        setMaterialSelecionado(material);
        setEtapa("integrante");
      }
    }
    if (params.integranteId) {
      const integrante = integrantes.find(i => i.id === params.integranteId);
      if (integrante) {
        setIntegranteSelecionado(integrante);
        if (materialSelecionado) {
          setEtapa("confirmar");
        }
      }
    }
  }, [params.materialId, params.integranteId]);

  // Selecionar material
  const handleSelecionarMaterial = (material: Material) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMaterialSelecionado(material);
    setEtapa("integrante");
    showSuccess("Fantasia selecionada", material.nome);
  };

  // Selecionar integrante
  const handleSelecionarIntegrante = (integrante: Integrante) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIntegranteSelecionado(integrante);
    setEtapa("confirmar");
    showSuccess("Integrante selecionado", integrante.nome);
  };

  // Escanear QR Code do integrante
  const handleScanQRCode = () => {
    router.push({
      pathname: "/scanner-checkin",
      params: { 
        modo: "entrega",
        materialId: materialSelecionado?.id 
      }
    });
  };

  // Confirmar entrega
  const handleConfirmarEntrega = async () => {
    if (!materialSelecionado || !integranteSelecionado) {
      showError("Erro", "Selecione a fantasia e o integrante.");
      return;
    }

    if (materialSelecionado.quantidadeDisponivel <= 0) {
      showError("Erro", "Esta fantasia não está mais disponível.");
      return;
    }

    setIsProcessing(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Criar registro de entrega
      const entrega: Omit<EntregaFantasia, "id"> = {
        materialId: materialSelecionado.id,
        integranteId: integranteSelecionado.id,
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: sessao?.nome || "Sistema",
        qrCodeIntegrante: integranteSelecionado.qrCodeId,
        status: "entregue",
      };

      await registrarEntrega(entrega);

      // Atualizar estoque do material
      await updateMaterial(materialSelecionado.id, {
        quantidadeDisponivel: materialSelecionado.quantidadeDisponivel - 1,
        quantidadeEmUso: (materialSelecionado.quantidadeEmUso || 0) + 1,
      });

      showSuccess(
        "Entrega registrada!",
        `${materialSelecionado.nome} entregue para ${integranteSelecionado.nome}`
      );

      // Voltar para a tela anterior
      router.back();
    } catch (error) {
      console.error("Erro ao registrar entrega:", error);
      showError("Erro", "Não foi possível registrar a entrega. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Voltar etapa
  const handleVoltar = () => {
    if (etapa === "confirmar") {
      setEtapa("integrante");
      setIntegranteSelecionado(null);
    } else if (etapa === "integrante") {
      setEtapa("material");
      setMaterialSelecionado(null);
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
            👗 Entrega de Fantasia
          </Text>

          <View className="w-20" />
        </View>

        {/* Indicador de Etapas */}
        <View className="flex-row items-center justify-center p-4 bg-surface border-b border-border">
          <View className="flex-row items-center gap-2">
            <View 
              className={`w-8 h-8 rounded-full items-center justify-center ${
                etapa === "material" ? "" : "bg-success"
              }`}
              style={etapa === "material" ? { backgroundColor: corPrimaria } : {}}
            >
              <Text className="text-white font-bold">1</Text>
            </View>
            <Text className={`text-sm ${etapa === "material" ? "text-primary font-bold" : "text-muted"}`}>
              Fantasia
            </Text>
          </View>

          <View className="w-8 h-0.5 bg-border mx-2" />

          <View className="flex-row items-center gap-2">
            <View 
              className={`w-8 h-8 rounded-full items-center justify-center ${
                etapa === "integrante" ? "" : etapa === "confirmar" ? "bg-success" : "bg-muted"
              }`}
              style={etapa === "integrante" ? { backgroundColor: corPrimaria } : {}}
            >
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text className={`text-sm ${etapa === "integrante" ? "text-primary font-bold" : "text-muted"}`}>
              Integrante
            </Text>
          </View>

          <View className="w-8 h-0.5 bg-border mx-2" />

          <View className="flex-row items-center gap-2">
            <View 
              className={`w-8 h-8 rounded-full items-center justify-center ${
                etapa === "confirmar" ? "" : "bg-muted"
              }`}
              style={etapa === "confirmar" ? { backgroundColor: corPrimaria } : {}}
            >
              <Text className="text-white font-bold">3</Text>
            </View>
            <Text className={`text-sm ${etapa === "confirmar" ? "text-primary font-bold" : "text-muted"}`}>
              Confirmar
            </Text>
          </View>
        </View>

        {/* Conteúdo baseado na etapa */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Etapa 1: Selecionar Fantasia */}
          {etapa === "material" && (
            <View className="p-4">
              <Text className="text-foreground text-xl font-bold mb-2">
                Selecione a Fantasia
              </Text>
              <Text className="text-muted text-base mb-4">
                Escolha a fantasia que será entregue ao integrante
              </Text>

              {fantasiasDisponiveis.length === 0 ? (
                <View className="bg-warning/10 p-4 rounded-xl">
                  <Text className="text-warning text-center font-medium">
                    Nenhuma fantasia disponível no momento
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {fantasiasDisponiveis.map((material) => (
                    <TouchableOpacity
                      key={material.id}
                      onPress={() => handleSelecionarMaterial(material)}
                      className="bg-surface p-4 rounded-xl border border-border"
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-foreground text-lg font-bold">
                            {material.nome}
                          </Text>
                          {material.tamanho && (
                            <Text className="text-muted text-sm">
                              Tamanho: {material.tamanho}
                            </Text>
                          )}
                          {material.descricao && (
                            <Text className="text-muted text-sm mt-1" numberOfLines={1}>
                              {material.descricao}
                            </Text>
                          )}
                        </View>
                        <View className="items-end">
                          <View 
                            className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: corPrimaria + "20" }}
                          >
                            <Text style={{ color: corPrimaria }} className="font-bold">
                              {material.quantidadeDisponivel} disp.
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Etapa 2: Selecionar Integrante */}
          {etapa === "integrante" && (
            <View className="p-4">
              {/* Fantasia selecionada */}
              <View className="bg-success/10 p-4 rounded-xl mb-4 border border-success/30">
                <Text className="text-success text-sm font-medium mb-1">
                  ✓ Fantasia selecionada:
                </Text>
                <Text className="text-foreground text-lg font-bold">
                  {materialSelecionado?.nome}
                </Text>
              </View>

              <Text className="text-foreground text-xl font-bold mb-2">
                Selecione o Integrante
              </Text>
              <Text className="text-muted text-base mb-4">
                Escolha quem receberá a fantasia ou escaneie o QR Code
              </Text>

              {/* Botão de Scanner */}
              <TouchableOpacity
                onPress={handleScanQRCode}
                className="p-4 rounded-xl mb-4 flex-row items-center justify-center gap-3"
                style={{ backgroundColor: corPrimaria }}
                activeOpacity={0.8}
              >
                <Text className="text-white text-4xl">📷</Text>
                <View>
                  <Text className="text-white text-lg font-bold">
                    Escanear QR Code
                  </Text>
                  <Text className="text-white/80 text-sm">
                    Leia a carteirinha do integrante
                  </Text>
                </View>
              </TouchableOpacity>

              <Text className="text-muted text-center mb-4">ou selecione manualmente:</Text>

              {/* Lista de integrantes */}
              <View className="gap-2">
                {integrantes.map((integrante) => (
                  <TouchableOpacity
                    key={integrante.id}
                    onPress={() => handleSelecionarIntegrante(integrante)}
                    className="bg-surface p-4 rounded-xl border border-border flex-row items-center gap-3"
                    activeOpacity={0.8}
                  >
                    {/* Avatar */}
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: corPrimaria + "20" }}
                    >
                      {integrante.foto ? (
                        <Text className="text-2xl">👤</Text>
                      ) : (
                        <Text className="text-xl font-bold" style={{ color: corPrimaria }}>
                          {integrante.nome.charAt(0)}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="text-foreground text-base font-bold">
                        {integrante.nome}
                      </Text>
                      <Text className="text-muted text-sm">
                        {integrante.categoria}
                      </Text>
                    </View>

                    <Text className="text-primary text-2xl">→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Etapa 3: Confirmar Entrega */}
          {etapa === "confirmar" && (
            <View className="p-4">
              <Text className="text-foreground text-xl font-bold mb-4 text-center">
                Confirmar Entrega
              </Text>

              {/* Resumo */}
              <View className="bg-surface p-5 rounded-2xl border border-border mb-6">
                {/* Fantasia */}
                <View className="mb-4 pb-4 border-b border-border">
                  <Text className="text-muted text-sm mb-1">FANTASIA</Text>
                  <Text className="text-foreground text-xl font-bold">
                    👗 {materialSelecionado?.nome}
                  </Text>
                  {materialSelecionado?.tamanho && (
                    <Text className="text-muted text-base">
                      Tamanho: {materialSelecionado.tamanho}
                    </Text>
                  )}
                </View>

                {/* Integrante */}
                <View className="mb-4 pb-4 border-b border-border">
                  <Text className="text-muted text-sm mb-1">INTEGRANTE</Text>
                  <Text className="text-foreground text-xl font-bold">
                    👤 {integranteSelecionado?.nome}
                  </Text>
                  <Text className="text-muted text-base">
                    {integranteSelecionado?.categoria}
                  </Text>
                </View>

                {/* Data e Responsável */}
                <View>
                  <Text className="text-muted text-sm mb-1">DATA E RESPONSÁVEL</Text>
                  <Text className="text-foreground text-base">
                    📅 {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text className="text-foreground text-base">
                    👤 {sessao?.nome || "Sistema"}
                  </Text>
                </View>
              </View>

              {/* Botões */}
              <View className="gap-3">
                <TouchableOpacity
                  onPress={handleConfirmarEntrega}
                  className="p-4 rounded-xl items-center"
                  style={{ backgroundColor: corPrimaria }}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  <Text className="text-white text-lg font-bold">
                    {isProcessing ? "Processando..." : "✓ Confirmar Entrega"}
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
