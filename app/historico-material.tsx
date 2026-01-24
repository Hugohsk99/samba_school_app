/**
 * Tela de Histórico de Movimentações de Material
 * Mostra todas as entregas e devoluções de um material específico
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import type { Material, EntregaFantasia, Integrante } from "@/lib/types";
import { CATEGORIAS_MATERIAL } from "@/lib/types";

// Estados de conservação
const ESTADOS_CONSERVACAO = [
  { value: "novo", label: "Novo", emoji: "✨", cor: "#22C55E" },
  { value: "bom", label: "Bom Estado", emoji: "👍", cor: "#3B82F6" },
  { value: "regular", label: "Regular", emoji: "⚠️", cor: "#F59E0B" },
  { value: "danificado", label: "Danificado", emoji: "❌", cor: "#EF4444" },
];

interface MovimentacaoItem {
  entrega: EntregaFantasia;
  integrante: Integrante | undefined;
  tipo: "entrega" | "devolucao";
  data: string;
}

export default function HistoricoMaterialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ materialId: string }>();
  const { materiais, integrantes, entregasFantasias, blocos } = useData();
  const { escola } = useEscola();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Obter material
  const material = materiais.find(m => m.id === params.materialId);

  // Obter todas as movimentações deste material
  const movimentacoes: MovimentacaoItem[] = [];
  
  entregasFantasias
    .filter((e: EntregaFantasia) => e.materialId === params.materialId)
    .forEach(entrega => {
      const integrante = integrantes.find(i => i.id === entrega.integranteId);
      
      // Adicionar entrega
      movimentacoes.push({
        entrega,
        integrante,
        tipo: "entrega",
        data: entrega.dataEntrega,
      });
      
      // Adicionar devolução se existir
      if (entrega.status === "devolvido" && entrega.dataDevolucao) {
        movimentacoes.push({
          entrega,
          integrante,
          tipo: "devolucao",
          data: entrega.dataDevolucao,
        });
      }
    });

  // Ordenar por data (mais recente primeiro)
  movimentacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Estatísticas
  const totalEntregas = entregasFantasias.filter((e: EntregaFantasia) => e.materialId === params.materialId).length;
  const pendentes = entregasFantasias.filter(e => e.materialId === params.materialId && e.status === "entregue").length;
  const devolvidos = entregasFantasias.filter(e => e.materialId === params.materialId && e.status === "devolvido").length;

  // Obter nome do bloco
  const getBlocoNome = (blocoId?: string) => {
    if (!blocoId) return null;
    const bloco = blocos.find(b => b.id === blocoId);
    return bloco?.nome;
  };

  // Obter label da categoria
  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS_MATERIAL.find(c => c.value === categoria);
    return cat?.label || categoria;
  };

  // Obter estado de conservação
  const getEstadoConservacao = (estado?: string) => {
    if (!estado) return null;
    return ESTADOS_CONSERVACAO.find(e => e.value === estado);
  };

  // Formatar data
  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderizar item de movimentação
  const renderMovimentacaoItem = ({ item }: { item: MovimentacaoItem }) => {
    const isEntrega = item.tipo === "entrega";
    const estadoConservacao = !isEntrega ? getEstadoConservacao(item.entrega.estadoConservacao) : null;
    
    return (
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row items-start gap-3">
          {/* Ícone */}
          <View 
            className={`w-12 h-12 rounded-full items-center justify-center ${
              isEntrega ? 'bg-warning/20' : 'bg-success/20'
            }`}
          >
            <Text className="text-xl">{isEntrega ? '📤' : '📥'}</Text>
          </View>
          
          <View className="flex-1">
            {/* Tipo de movimentação */}
            <View className="flex-row items-center gap-2">
              <Text className={`font-bold ${isEntrega ? 'text-warning' : 'text-success'}`}>
                {isEntrega ? 'ENTREGA' : 'DEVOLUÇÃO'}
              </Text>
              <Text className="text-muted text-xs">
                {formatarData(item.data)}
              </Text>
            </View>
            
            {/* Integrante */}
            <View className="flex-row items-center gap-2 mt-2">
              {item.integrante?.foto ? (
                <Image
                  source={{ uri: item.integrante.foto }}
                  className="w-8 h-8 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View 
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: corPrimaria + "20" }}
                >
                  <Text style={{ color: corPrimaria }} className="text-xs">👤</Text>
                </View>
              )}
              <Text className="text-foreground font-medium">
                {item.integrante?.nome || "Integrante não encontrado"}
              </Text>
            </View>
            
            {/* Responsável */}
            <Text className="text-muted text-sm mt-1">
              Responsável: {isEntrega ? item.entrega.responsavelEntrega : item.entrega.responsavelDevolucao}
            </Text>
            
            {/* Estado de conservação (apenas para devoluções) */}
            {!isEntrega && estadoConservacao && (
              <View className="flex-row items-center gap-2 mt-2">
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: estadoConservacao.cor + "20" }}
                >
                  <Text style={{ color: estadoConservacao.cor }} className="text-xs font-medium">
                    {estadoConservacao.emoji} {estadoConservacao.label}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Observação */}
            {(isEntrega ? item.entrega.observacaoEntrega : item.entrega.observacaoDevolucao) && (
              <View className="mt-2 bg-muted/10 p-2 rounded">
                <Text className="text-muted text-sm italic">
                  "{isEntrega ? item.entrega.observacaoEntrega : item.entrega.observacaoDevolucao}"
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!material) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-lg">Material não encontrado</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-xl"
            style={{ backgroundColor: corPrimaria }}
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

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
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Histórico</Text>
              <Text className="text-white/80 text-sm">{material.nome}</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Informações do Material */}
          <View className="px-6 pt-4">
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <View className="flex-row items-start gap-4">
                {material.foto ? (
                  <Image
                    source={{ uri: material.foto }}
                    className="w-20 h-20 rounded-xl"
                    resizeMode="cover"
                  />
                ) : (
                  <View 
                    className="w-20 h-20 rounded-xl items-center justify-center"
                    style={{ backgroundColor: corPrimaria + "20" }}
                  >
                    <Text style={{ color: corPrimaria }} className="text-3xl">📦</Text>
                  </View>
                )}
                
                <View className="flex-1">
                  <Text className="text-foreground text-xl font-bold">{material.nome}</Text>
                  
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    <View className="bg-primary/20 px-2 py-0.5 rounded">
                      <Text className="text-primary text-xs">{getCategoriaLabel(material.categoria)}</Text>
                    </View>
                    {material.tamanho && (
                      <View className="bg-muted/20 px-2 py-0.5 rounded">
                        <Text className="text-muted text-xs">Tam: {material.tamanho}</Text>
                      </View>
                    )}
                    {getBlocoNome(material.blocoId) && (
                      <View className="bg-muted/20 px-2 py-0.5 rounded">
                        <Text className="text-muted text-xs">{getBlocoNome(material.blocoId)}</Text>
                      </View>
                    )}
                  </View>
                  
                  {material.descricao && (
                    <Text className="text-muted text-sm mt-2">{material.descricao}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Estatísticas */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                <Text className="text-foreground text-2xl font-bold">{totalEntregas}</Text>
                <Text className="text-muted text-xs">Total Entregas</Text>
              </View>
              <View className="flex-1 bg-warning/10 rounded-xl p-4 border border-warning/30 items-center">
                <Text className="text-warning text-2xl font-bold">{pendentes}</Text>
                <Text className="text-warning text-xs">Pendentes</Text>
              </View>
              <View className="flex-1 bg-success/10 rounded-xl p-4 border border-success/30 items-center">
                <Text className="text-success text-2xl font-bold">{devolvidos}</Text>
                <Text className="text-success text-xs">Devolvidos</Text>
              </View>
            </View>

            {/* Status atual */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-muted text-xs mb-2">STATUS ATUAL DO ESTOQUE</Text>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-foreground text-lg font-semibold">
                    {material.quantidadeDisponivel} disponível(is)
                  </Text>
                  <Text className="text-muted text-sm">
                    {material.quantidadeEmUso || 0} em uso • {(material.quantidadeDisponivel || 0) + (material.quantidadeEmUso || 0)} total
                  </Text>
                </View>
                <View 
                  className="px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: material.quantidadeDisponivel > 0 ? '#22C55E20' : '#EF444420' 
                  }}
                >
                  <Text 
                    className="font-semibold"
                    style={{ 
                      color: material.quantidadeDisponivel > 0 ? '#22C55E' : '#EF4444' 
                    }}
                  >
                    {material.quantidadeDisponivel > 0 ? 'Disponível' : 'Indisponível'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Título da lista */}
            <Text className="text-foreground text-lg font-bold mb-3">
              📋 Movimentações ({movimentacoes.length})
            </Text>
          </View>

          {/* Lista de movimentações */}
          <View className="px-6 pb-6">
            {movimentacoes.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 border border-border items-center">
                <Text className="text-4xl mb-2">📦</Text>
                <Text className="text-foreground font-semibold">Nenhuma movimentação</Text>
                <Text className="text-muted text-sm text-center mt-1">
                  Este material ainda não foi emprestado.
                </Text>
              </View>
            ) : (
              movimentacoes.map((item, index) => (
                <View key={`${item.entrega.id}-${item.tipo}-${index}`}>
                  {renderMovimentacaoItem({ item })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
