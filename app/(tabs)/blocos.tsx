import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEffect, useState } from "react";
import { blocosStorage } from "@/lib/storage";
import type { Bloco } from "@/lib/types";

// Dados iniciais de exemplo (serão carregados apenas se não houver dados)
const BLOCOS_INICIAIS: Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>[] = [
  { nome: 'Bateria', responsavel: 'João Silva', descricao: 'Coração da escola', cor: '#FF6B35' },
  { nome: 'Passistas', responsavel: 'Maria Santos', descricao: 'Dança e samba no pé', cor: '#4ECDC4' },
  { nome: 'Ala das Baianas', responsavel: 'Ana Costa', descricao: 'Tradição e elegância', cor: '#FFE66D' },
  { nome: 'Comissão de Frente', responsavel: 'Pedro Oliveira', descricao: 'Abertura do desfile', cor: '#95E1D3' },
  { nome: 'Mestre-Sala e Porta-Bandeira', responsavel: 'Carlos Souza', descricao: 'Casal de destaque', cor: '#F38181' },
  { nome: 'Ala de Compositores', responsavel: 'Roberto Lima', descricao: 'Criadores do samba-enredo', cor: '#AA96DA' },
  { nome: 'Velha Guarda', responsavel: 'José Pereira', descricao: 'Guardiões da história', cor: '#FCBAD3' },
  { nome: 'Harmonia', responsavel: 'Lucas Ferreira', descricao: 'Organização do desfile', cor: '#A8D8EA' },
];

export default function BlocosScreen() {
  const router = useRouter();
  const { blocos, isLoading, addBloco } = useData();
  const [isInitializing, setIsInitializing] = useState(false);

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

  const handleAddBloco = () => {
    router.push("/bloco-form");
  };

  const handleBlocoPress = (blocoId: string) => {
    router.push({
      pathname: "/bloco-detalhes",
      params: { id: blocoId },
    });
  };

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
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Blocos
          </Text>
          <Text className="text-base text-muted mt-1">
            {blocos.length} {blocos.length === 1 ? 'bloco cadastrado' : 'blocos cadastrados'}
          </Text>
        </View>

        {/* Lista de Blocos */}
        {blocos.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-6xl mb-4">🎭</Text>
            <Text className="text-foreground text-xl font-semibold text-center mb-2">
              Nenhum bloco cadastrado
            </Text>
            <Text className="text-muted text-center mb-6">
              Comece adicionando os blocos da sua escola de samba.
            </Text>
            <TouchableOpacity
              onPress={handleAddBloco}
              className="bg-primary px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Adicionar Primeiro Bloco</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6">
            <View className="gap-3 pb-24">
              {blocos.map((bloco) => (
                <TouchableOpacity
                  key={bloco.id}
                  onPress={() => handleBlocoPress(bloco.id)}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
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
                      <Text className="text-foreground text-lg font-semibold">
                        {bloco.nome}
                      </Text>
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
              ))}
            </View>
          </ScrollView>
        )}

        {/* Botão Flutuante para Adicionar Bloco */}
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={handleAddBloco}
            className="bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg active:opacity-80"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
