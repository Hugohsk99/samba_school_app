import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import type { Bloco } from "@/lib/types";

// Dados iniciais de exemplo (serão carregados apenas se não houver dados)
const BLOCOS_INICIAIS: Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>[] = [
  { nome: 'Bateria', responsavel: 'João Silva', descricao: 'Coração da escola', cor: '#FF6B35', tipo: 'segmento' },
  { nome: 'Passistas', responsavel: 'Maria Santos', descricao: 'Dança e samba no pé', cor: '#4ECDC4', tipo: 'segmento' },
  { nome: 'Ala das Baianas', responsavel: 'Ana Costa', descricao: 'Tradição e elegância', cor: '#FFE66D', tipo: 'segmento' },
  { nome: 'Comissão de Frente', responsavel: 'Pedro Oliveira', descricao: 'Abertura do desfile', cor: '#95E1D3', tipo: 'segmento' },
  { nome: 'Mestre-Sala e Porta-Bandeira', responsavel: 'Carlos Souza', descricao: 'Casal de destaque', cor: '#F38181', tipo: 'segmento' },
  { nome: 'Ala de Compositores', responsavel: 'Roberto Lima', descricao: 'Criadores do samba-enredo', cor: '#AA96DA', tipo: 'ala' },
  { nome: 'Velha Guarda', responsavel: 'José Pereira', descricao: 'Guardiões da história', cor: '#FCBAD3', tipo: 'segmento' },
  { nome: 'Harmonia', responsavel: 'Lucas Ferreira', descricao: 'Organização do desfile', cor: '#A8D8EA', tipo: 'segmento' },
];

type FilterTipo = 'todos' | 'ala' | 'segmento';

export default function BlocosScreen() {
  const router = useRouter();
  const { blocos, isLoading, addBloco } = useData();
  const [isInitializing, setIsInitializing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos');

  // Carregar dados iniciais se não houver blocos
  useEffect(() => {
    const initializeData = async () => {
      if (!isLoading && blocos.length === 0 && !isInitializing) {
        setIsInitializing(true);
        try {
          for (const bloco of BLOCOS_INICIAIS) {
            await addBloco(bloco);
          }
        } catch (error) {
          console.error('Erro ao inicializar dados:', error);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeData();
  }, [isLoading, blocos.length, addBloco, isInitializing]);

  // Filtrar blocos
  const blocosFiltrados = blocos.filter(b => {
    // Filtro por tipo
    if (filterTipo !== 'todos' && b.tipo !== filterTipo) {
      return false;
    }
    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return b.nome.toLowerCase().includes(query) || 
             b.responsavel.toLowerCase().includes(query) ||
             b.descricao.toLowerCase().includes(query);
    }
    return true;
  });

  const handleAddBloco = () => {
    router.push("/bloco-form");
  };

  const handleBlocoPress = (blocoId: string) => {
    router.push({
      pathname: "/bloco-detalhes",
      params: { id: blocoId },
    });
  };

  const renderBloco = ({ item: bloco }: { item: Bloco }) => (
    <TouchableOpacity
      onPress={() => handleBlocoPress(bloco.id)}
      className="bg-surface rounded-2xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row items-center gap-4">
        {/* Ícone do Bloco */}
        <View
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: `${bloco.cor}20` }}
        >
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: bloco.cor }}
          />
        </View>

        {/* Informações do Bloco */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground text-lg font-semibold">
              {bloco.nome}
            </Text>
            <View className="bg-primary/20 px-2 py-0.5 rounded">
              <Text className="text-primary text-xs font-medium capitalize">
                {bloco.tipo}
              </Text>
            </View>
          </View>
          <Text className="text-muted text-sm mt-0.5">
            Responsável: {bloco.responsavel}
          </Text>
          {bloco.descricao && (
            <Text className="text-muted text-xs mt-1" numberOfLines={1}>
              {bloco.descricao}
            </Text>
          )}
        </View>

        {/* Seta de navegação */}
        <Text className="text-muted text-xl">›</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading || isInitializing) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-muted mt-4">Carregando blocos...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-bold text-foreground">
              Blocos
            </Text>
            <TouchableOpacity
              onPress={handleAddBloco}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-white text-2xl font-light">+</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-base text-muted mb-4">
            {blocos.length} {blocos.length === 1 ? 'bloco cadastrado' : 'blocos cadastrados'}
          </Text>

          {/* Campo de Busca */}
          <View className="mb-4">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Buscar bloco..."
              placeholderTextColor="#687076"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filtros */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setFilterTipo('todos')}
              className={`px-4 py-2 rounded-full ${
                filterTipo === 'todos'
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filterTipo === 'todos' ? 'text-white' : 'text-foreground'
                }`}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterTipo('segmento')}
              className={`px-4 py-2 rounded-full ${
                filterTipo === 'segmento'
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filterTipo === 'segmento' ? 'text-white' : 'text-foreground'
                }`}
              >
                Segmentos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterTipo('ala')}
              className={`px-4 py-2 rounded-full ${
                filterTipo === 'ala'
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filterTipo === 'ala' ? 'text-white' : 'text-foreground'
                }`}
              >
                Alas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Blocos */}
        {blocosFiltrados.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-6xl mb-4">🎭</Text>
            <Text className="text-foreground text-xl font-semibold text-center mb-2">
              {searchQuery || filterTipo !== 'todos' 
                ? 'Nenhum bloco encontrado'
                : 'Nenhum bloco cadastrado'}
            </Text>
            <Text className="text-muted text-center mb-6">
              {searchQuery || filterTipo !== 'todos'
                ? 'Tente ajustar os filtros ou busca.'
                : 'Comece adicionando os blocos da sua escola de samba.'}
            </Text>
            {!searchQuery && filterTipo === 'todos' && (
              <TouchableOpacity
                onPress={handleAddBloco}
                className="bg-primary px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Adicionar Primeiro Bloco</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={blocosFiltrados}
            renderItem={renderBloco}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
