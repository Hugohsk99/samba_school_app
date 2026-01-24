import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { CATEGORIAS_MATERIAL } from "@/lib/types";
import type { Material, CategoriaMaterial } from "@/lib/types";

type FilterCategoria = 'todos' | CategoriaMaterial;

export default function AlmoxarifadoScreen() {
  const router = useRouter();
  const { materiais, blocos, isLoading } = useData();
  const [filterCategoria, setFilterCategoria] = useState<FilterCategoria>('todos');
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar materiais
  const materiaisFiltrados = materiais.filter(m => {
    // Filtro por categoria
    if (filterCategoria !== 'todos' && m.categoria !== filterCategoria) {
      return false;
    }
    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return m.nome.toLowerCase().includes(query) || 
             m.descricao.toLowerCase().includes(query);
    }
    return true;
  });

  // Calcular estatísticas
  const totalItens = materiais.length;
  const itensEmFalta = materiais.filter(m => m.quantidadeDisponivel < m.quantidadeNecessaria).length;
  const fantasias = materiais.filter(m => m.categoria === 'fantasia').length;

  // Obter label da categoria
  const getCategoriaLabel = (categoria: CategoriaMaterial) => {
    const cat = CATEGORIAS_MATERIAL.find(c => c.value === categoria);
    return cat?.label || categoria;
  };

  // Obter nome do bloco
  const getBlocoNome = (blocoId?: string) => {
    if (!blocoId) return null;
    const bloco = blocos.find(b => b.id === blocoId);
    return bloco?.nome;
  };

  const handleAddMaterial = () => {
    router.push("/material-form");
  };

  const handleMaterialPress = (materialId: string) => {
    router.push(`/material-form?id=${materialId}`);
  };

  const renderMaterial = ({ item }: { item: Material }) => {
    const emFalta = item.quantidadeDisponivel < item.quantidadeNecessaria;
    const blocoNome = getBlocoNome(item.blocoId);
    
    return (
      <TouchableOpacity
        onPress={() => handleMaterialPress(item.id)}
        className="bg-surface rounded-2xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-foreground text-lg font-semibold">
              {item.nome}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="bg-primary/20 px-2 py-0.5 rounded">
                <Text className="text-primary text-xs font-medium">
                  {getCategoriaLabel(item.categoria)}
                </Text>
              </View>
              {item.tamanho && (
                <View className="bg-muted/20 px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs">
                    Tam: {item.tamanho}
                  </Text>
                </View>
              )}
              {blocoNome && (
                <View className="bg-muted/20 px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs" numberOfLines={1}>
                    {blocoNome}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {emFalta && (
            <View className="bg-error/20 px-2 py-1 rounded-full">
              <Text className="text-error text-xs font-bold">EM FALTA</Text>
            </View>
          )}
        </View>

        {/* Quantidades */}
        <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
          <View className="flex-1 items-center">
            <Text className="text-muted text-xs mb-1">Necessário</Text>
            <Text className="text-foreground text-lg font-bold">
              {item.quantidadeNecessaria}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-muted text-xs mb-1">Disponível</Text>
            <Text className={`text-lg font-bold ${emFalta ? 'text-error' : 'text-success'}`}>
              {item.quantidadeDisponivel}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-muted text-xs mb-1">Em Uso</Text>
            <Text className="text-foreground text-lg font-bold">
              {item.quantidadeEmUso}
            </Text>
          </View>
        </View>

        {item.localizacao && (
          <View className="flex-row items-center gap-1 mt-2">
            <Text className="text-muted text-xs">📍</Text>
            <Text className="text-muted text-xs">{item.localizacao}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground text-3xl font-bold">Estoque</Text>
            <TouchableOpacity
              onPress={handleAddMaterial}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-white text-2xl font-light">+</Text>
            </TouchableOpacity>
          </View>

          {/* Estatísticas */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
              <Text className="text-muted text-xs">Total</Text>
              <Text className="text-foreground text-xl font-bold">{totalItens}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
              <Text className="text-muted text-xs">Fantasias</Text>
              <Text className="text-foreground text-xl font-bold">{fantasias}</Text>
            </View>
            <View className={`flex-1 rounded-xl p-3 border ${itensEmFalta > 0 ? 'bg-error/10 border-error/30' : 'bg-surface border-border'}`}>
              <Text className={`text-xs ${itensEmFalta > 0 ? 'text-error' : 'text-muted'}`}>Em Falta</Text>
              <Text className={`text-xl font-bold ${itensEmFalta > 0 ? 'text-error' : 'text-foreground'}`}>{itensEmFalta}</Text>
            </View>
          </View>

          {/* Campo de Busca */}
          <View className="mb-4">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Buscar material..."
              placeholderTextColor="#687076"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setFilterCategoria('todos')}
                className={`px-4 py-2 rounded-full ${
                  filterCategoria === 'todos'
                    ? 'bg-primary'
                    : 'bg-surface border border-border'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filterCategoria === 'todos' ? 'text-white' : 'text-foreground'
                  }`}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {CATEGORIAS_MATERIAL.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setFilterCategoria(cat.value)}
                  className={`px-4 py-2 rounded-full ${
                    filterCategoria === cat.value
                      ? 'bg-primary'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filterCategoria === cat.value ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de Materiais */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Carregando...</Text>
          </View>
        ) : materiaisFiltrados.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-muted text-6xl mb-4">📦</Text>
            <Text className="text-foreground text-xl font-semibold mb-2">
              Nenhum item encontrado
            </Text>
            <Text className="text-muted text-center mb-6">
              {searchQuery || filterCategoria !== 'todos'
                ? 'Tente ajustar os filtros ou busca.'
                : 'Adicione itens ao estoque para começar a gerenciar.'}
            </Text>
            {!searchQuery && filterCategoria === 'todos' && (
              <TouchableOpacity
                onPress={handleAddMaterial}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Adicionar Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={materiaisFiltrados}
            renderItem={renderMaterial}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
