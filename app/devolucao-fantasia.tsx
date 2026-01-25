/**
 * Tela de Devolução de Fantasia - Aprimorada
 * Permite registrar a devolução de fantasias com estado de conservação
 * Interface clara mostrando quem está com cada material
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import type { EntregaFantasia, EstadoConservacao, Material, Integrante } from "@/lib/types";
import { CATEGORIAS_MATERIAL } from "@/lib/types";

// Estados de conservação disponíveis
const ESTADOS_CONSERVACAO: { value: EstadoConservacao; label: string; emoji: string; cor: string; descricao: string }[] = [
  { value: "novo", label: "Novo", emoji: "✨", cor: "#22C55E", descricao: "Sem uso, perfeito estado" },
  { value: "bom", label: "Bom Estado", emoji: "👍", cor: "#3B82F6", descricao: "Usado, mas sem danos" },
  { value: "regular", label: "Regular", emoji: "⚠️", cor: "#F59E0B", descricao: "Pequenos desgastes ou manchas" },
  { value: "danificado", label: "Danificado", emoji: "❌", cor: "#EF4444", descricao: "Precisa de reparo" },
];

// Tipo para item de devolução com dados completos
interface ItemDevolucao {
  entrega: EntregaFantasia;
  material: Material;
  integrante: Integrante;
  diasEmprestado: number;
}

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
  const { showSuccess, showError, showInfo } = useToast();
  const { escola } = useEscola();
  const { sessao } = useAuth();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Estados
  const [entregaSelecionada, setEntregaSelecionada] = useState<ItemDevolucao | null>(null);
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>("bom");
  const [observacao, setObservacao] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [etapa, setEtapa] = useState<"selecionar" | "confirmar">("selecionar");
  const [searchQuery, setSearchQuery] = useState("");

  // Calcular dias de empréstimo
  const calcularDiasEmprestado = (dataEntrega: string) => {
    const entrega = new Date(dataEntrega);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - entrega.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Montar lista de itens pendentes com dados completos
  const itensPendentes: ItemDevolucao[] = entregasFantasias
    .filter(e => e.status === 'entregue')
    .map(entrega => {
      const material = materiais.find(m => m.id === entrega.materialId);
      const integrante = integrantes.find(i => i.id === entrega.integranteId);
      if (material && integrante) {
        return {
          entrega,
          material,
          integrante,
          diasEmprestado: calcularDiasEmprestado(entrega.dataEntrega),
        };
      }
      return null;
    })
    .filter((item): item is ItemDevolucao => item !== null);

  // Filtrar por busca
  const itensFiltrados = itensPendentes.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.material.nome.toLowerCase().includes(query) ||
      item.integrante.nome.toLowerCase().includes(query)
    );
  });

  // Ordenar por dias emprestado (mais antigos primeiro)
  const itensOrdenados = [...itensFiltrados].sort((a, b) => b.diasEmprestado - a.diasEmprestado);

  // Carregar entrega se vier por parâmetro
  useEffect(() => {
    if (params.entregaId) {
      const item = itensPendentes.find(i => i.entrega.id === params.entregaId);
      if (item) {
        setEntregaSelecionada(item);
        setEtapa("confirmar");
      }
    }
  }, [params.entregaId, itensPendentes.length]);

  // Obter label da categoria
  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS_MATERIAL.find(c => c.value === categoria);
    return cat?.label || categoria;
  };

  // Selecionar entrega
  const handleSelecionarEntrega = (item: ItemDevolucao) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEntregaSelecionada(item);
    setEtapa("confirmar");
    showInfo("Item selecionado", item.material.nome);
  };

  // Confirmar devolução
  const handleConfirmarDevolucao = async () => {
    if (!entregaSelecionada) {
      showError("Erro", "Selecione um item para devolver.");
      return;
    }

    setIsProcessing(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Registrar devolução
      await registrarDevolucao(
        entregaSelecionada.entrega.id,
        sessao?.nome || "Sistema",
        estadoConservacao,
        observacao.trim() || undefined
      );

      // Atualizar estoque do material
      const material = entregaSelecionada.material;
      await updateMaterial(material.id, {
        quantidadeDisponivel: material.quantidadeDisponivel + 1,
        quantidadeEmUso: Math.max(0, (material.quantidadeEmUso || 0) - 1),
        status: "disponivel",
        integranteAtualId: undefined,
      });

      showSuccess(
        "Devolução registrada!",
        `${material.nome} devolvido por ${entregaSelecionada.integrante.nome}`
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

  // Renderizar item pendente
  const renderItemPendente = ({ item }: { item: ItemDevolucao }) => {
    const dataEntrega = new Date(item.entrega.dataEntrega).toLocaleDateString("pt-BR");
    const diasAlerta = item.diasEmprestado > 30;
    
    return (
      <TouchableOpacity
        onPress={() => handleSelecionarEntrega(item)}
        className={`bg-surface rounded-xl p-4 mb-3 border ${diasAlerta ? 'border-warning' : 'border-border'}`}
        activeOpacity={0.7}
      >
        {/* Alerta de tempo */}
        {diasAlerta && (
          <View className="bg-warning/15 rounded-lg px-3 py-2 mb-3 flex-row items-center gap-2">
            <Text className="text-warning">⏰</Text>
            <Text className="text-warning text-xs font-medium">
              Emprestado há {item.diasEmprestado} dias
            </Text>
          </View>
        )}

        <View className="flex-row items-start gap-3">
          {/* Foto do material ou ícone */}
          {item.material.foto ? (
            <Image
              source={{ uri: item.material.foto }}
              className="w-16 h-16 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View 
              className="w-16 h-16 rounded-lg items-center justify-center"
              style={{ backgroundColor: corPrimaria + "20" }}
            >
              <Text style={{ color: corPrimaria }} className="text-2xl">👗</Text>
            </View>
          )}

          <View className="flex-1">
            {/* Nome do material */}
            <Text className="text-foreground text-lg font-bold">
              {item.material.nome}
            </Text>
            
            {/* Categoria e tamanho */}
            <View className="flex-row flex-wrap gap-2 mt-1">
              <View className="bg-primary/20 px-2 py-0.5 rounded">
                <Text className="text-primary text-xs">{getCategoriaLabel(item.material.categoria)}</Text>
              </View>
              {item.material.tamanho && (
                <View className="bg-muted/20 px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs">Tam: {item.material.tamanho}</Text>
                </View>
              )}
            </View>

            {/* Integrante */}
            <View className="flex-row items-center gap-2 mt-3 pt-2 border-t border-border">
              {item.integrante.foto ? (
                <Image
                  source={{ uri: item.integrante.foto }}
                  className="w-8 h-8 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-muted/20 items-center justify-center">
                  <Text className="text-muted text-xs">👤</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-foreground font-medium">{item.integrante.nome}</Text>
                <Text className="text-muted text-xs">Entregue em {dataEntrega}</Text>
              </View>
            </View>
          </View>

          {/* Seta */}
          <View className="justify-center">
            <Text className="text-primary text-xl">→</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View 
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: corPrimaria }}
        >
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={handleVoltar}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Registrar Devolução</Text>
              <Text className="text-white/80 text-sm">
                {etapa === "selecionar" 
                  ? `${itensPendentes.length} item(s) emprestado(s)`
                  : "Confirme a devolução"
                }
              </Text>
            </View>
          </View>

          {/* Indicador de progresso */}
          <View className="flex-row gap-2 mt-4">
            <View className={`flex-1 h-1 rounded-full ${etapa === "selecionar" || etapa === "confirmar" ? "bg-white" : "bg-white/30"}`} />
            <View className={`flex-1 h-1 rounded-full ${etapa === "confirmar" ? "bg-white" : "bg-white/30"}`} />
          </View>
        </View>

        {/* Conteúdo */}
        {etapa === "selecionar" && (
          <View className="flex-1 px-6 pt-4">
            {/* Busca */}
            <View className="bg-surface rounded-xl px-4 py-3 mb-4 border border-border flex-row items-center">
              <Text className="text-muted mr-2">🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por material ou integrante..."
                placeholderTextColor="#9BA1A6"
                className="flex-1 text-foreground text-base"
              />
            </View>

            {/* Resumo */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-foreground font-bold mb-2">📊 Resumo de Empréstimos</Text>
              <View className="flex-row gap-4">
                <View className="flex-1 items-center">
                  <Text className="text-foreground text-2xl font-bold">{itensPendentes.length}</Text>
                  <Text className="text-muted text-xs">Total</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-warning text-2xl font-bold">
                    {itensPendentes.filter(i => i.diasEmprestado > 30).length}
                  </Text>
                  <Text className="text-muted text-xs">{">"}30 dias</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-error text-2xl font-bold">
                    {itensPendentes.filter(i => i.diasEmprestado > 60).length}
                  </Text>
                  <Text className="text-muted text-xs">{">"}60 dias</Text>
                </View>
              </View>
            </View>

            {/* Lista de itens */}
            {itensOrdenados.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-success text-6xl mb-4">✓</Text>
                <Text className="text-foreground text-xl font-bold mb-2">
                  Tudo em dia!
                </Text>
                <Text className="text-muted text-center">
                  Não há materiais pendentes de devolução.
                </Text>
              </View>
            ) : (
              <FlatList
                data={itensOrdenados}
                keyExtractor={(item) => item.entrega.id}
                renderItem={renderItemPendente}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        )}

        {etapa === "confirmar" && entregaSelecionada && (
          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
            {/* Resumo do item */}
            <View className="bg-surface rounded-xl p-4 mb-4 border-2" style={{ borderColor: corPrimaria }}>
              <Text className="text-muted text-xs mb-2 uppercase">Item Selecionado</Text>
              
              <View className="flex-row items-start gap-3">
                {entregaSelecionada.material.foto ? (
                  <Image
                    source={{ uri: entregaSelecionada.material.foto }}
                    className="w-20 h-20 rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View 
                    className="w-20 h-20 rounded-lg items-center justify-center"
                    style={{ backgroundColor: corPrimaria + "20" }}
                  >
                    <Text style={{ color: corPrimaria }} className="text-3xl">👗</Text>
                  </View>
                )}

                <View className="flex-1">
                  <Text className="text-foreground text-xl font-bold">
                    {entregaSelecionada.material.nome}
                  </Text>
                  {entregaSelecionada.material.tamanho && (
                    <Text className="text-muted">Tamanho: {entregaSelecionada.material.tamanho}</Text>
                  )}
                  <Text className="text-muted text-sm">
                    {getCategoriaLabel(entregaSelecionada.material.categoria)}
                  </Text>
                </View>
              </View>

              <View className="mt-4 pt-4 border-t border-border">
                <View className="flex-row items-center gap-2">
                  {entregaSelecionada.integrante.foto ? (
                    <Image
                      source={{ uri: entregaSelecionada.integrante.foto }}
                      className="w-10 h-10 rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-muted/20 items-center justify-center">
                      <Text className="text-muted">👤</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{entregaSelecionada.integrante.nome}</Text>
                    <Text className="text-muted text-xs">
                      Emprestado há {entregaSelecionada.diasEmprestado} dia(s)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Estado de Conservação */}
            <Text className="text-foreground text-lg font-bold mb-2">
              Como está o item?
            </Text>
            <Text className="text-muted text-sm mb-4">
              Selecione o estado de conservação após o uso
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
                    <Text className="text-muted text-xs">{estado.descricao}</Text>
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
              placeholder="Descreva detalhes sobre o estado do item..."
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
            <View className="gap-3 mb-8">
              <TouchableOpacity
                onPress={handleConfirmarDevolucao}
                className="p-4 rounded-xl items-center"
                style={{ backgroundColor: isProcessing ? "#ccc" : corPrimaria }}
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
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
