import { useState } from "react";
import { Text, View, TouchableOpacity, TextInput, FlatList, Platform, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { CATEGORIAS_INTEGRANTE, TIPOS_SEGMENTO } from "@/lib/types";
import type { Integrante, CategoriaIntegrante } from "@/lib/types";
import * as Haptics from "expo-haptics";

type FilterCategoria = 'todos' | CategoriaIntegrante;

export default function IntegrantesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ blocoId?: string }>();
  const { integrantes, blocos, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<FilterCategoria>('todos');

  // Filtrar por bloco se especificado
  const integrantesDoBloco = params.blocoId
    ? integrantes.filter(i => i.blocosIds.includes(params.blocoId!))
    : integrantes;

  // Aplicar filtros
  const integrantesFiltrados = integrantesDoBloco.filter(i => {
    // Filtro por categoria
    if (filterCategoria !== 'todos' && i.categoria !== filterCategoria) {
      return false;
    }
    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return i.nome.toLowerCase().includes(query) || 
             i.telefone.includes(query) ||
             i.email.toLowerCase().includes(query);
    }
    return true;
  });

  // Obter nome do bloco
  const getBlocoNome = (blocoId: string) => {
    const bloco = blocos.find(b => b.id === blocoId);
    return bloco?.nome || 'Bloco';
  };

  // Obter label da categoria
  const getCategoriaLabel = (categoria: CategoriaIntegrante) => {
    const cat = CATEGORIAS_INTEGRANTE.find(c => c.value === categoria);
    return cat?.label || categoria;
  };

  // Obter label do tipo de segmento
  const getSegmentoLabel = (tipoSegmento?: string) => {
    if (!tipoSegmento) return null;
    const seg = TIPOS_SEGMENTO.find(s => s.value === tipoSegmento);
    return seg?.label || tipoSegmento;
  };

  const handleAddIntegrante = () => {
    if (params.blocoId) {
      router.push(`/integrante-form?blocoId=${params.blocoId}`);
    } else {
      router.push("/integrante-form");
    }
  };

  const handleIntegrantePress = (integranteId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/integrante-perfil?id=${integranteId}`);
  };

  const renderIntegrante = ({ item }: { item: Integrante }) => {
    const segmentoLabel = getSegmentoLabel(item.tipoSegmento);
    
    return (
      <TouchableOpacity
        onPress={() => handleIntegrantePress(item.id)}
        className="bg-surface rounded-2xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-4">
          {/* Avatar */}
          {item.foto ? (
            <Image
              source={{ uri: item.foto }}
              className="w-14 h-14 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary/20 items-center justify-center">
              <Text className="text-primary text-xl font-bold">
                {item.nome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Informações */}
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
              {segmentoLabel && (
                <View className="bg-muted/20 px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs">
                    {segmentoLabel}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-muted text-sm mt-1">
              {item.telefone}
            </Text>
          </View>

          {/* Status */}
          <View className={`w-3 h-3 rounded-full ${item.ativo ? 'bg-success' : 'bg-muted'}`} />
        </View>
      </TouchableOpacity>
    );
  };

  const blocoNome = params.blocoId ? getBlocoNome(params.blocoId) : null;

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center gap-4 mb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Text className="text-primary text-base">← Voltar</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-3xl font-bold text-foreground">
                Integrantes
              </Text>
              {blocoNome && (
                <Text className="text-muted text-base">
                  {blocoNome}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleAddIntegrante}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-white text-2xl font-light">+</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-muted mb-4">
            {integrantesFiltrados.length} {integrantesFiltrados.length === 1 ? 'integrante' : 'integrantes'}
          </Text>

          {/* Campo de Busca */}
          <View className="mb-4">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Buscar por nome, telefone ou email..."
              placeholderTextColor="#687076"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filtros */}
          <View className="flex-row flex-wrap gap-2">
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
            {CATEGORIAS_INTEGRANTE.map((cat) => (
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
        </View>

        {/* Lista de Integrantes */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Carregando...</Text>
          </View>
        ) : integrantesFiltrados.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-muted text-6xl mb-4">👥</Text>
            <Text className="text-foreground text-xl font-semibold mb-2">
              {searchQuery || filterCategoria !== 'todos'
                ? 'Nenhum integrante encontrado'
                : 'Nenhum integrante cadastrado'}
            </Text>
            <Text className="text-muted text-center mb-6">
              {searchQuery || filterCategoria !== 'todos'
                ? 'Tente ajustar os filtros ou busca.'
                : 'Adicione integrantes para começar a gerenciar.'}
            </Text>
            {!searchQuery && filterCategoria === 'todos' && (
              <TouchableOpacity
                onPress={handleAddIntegrante}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Adicionar Integrante</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={integrantesFiltrados}
            renderItem={renderIntegrante}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
