import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function BlocosScreen() {
  // Dados de exemplo (serão substituídos por dados reais posteriormente)
  const blocos = [
    { id: '1', nome: 'Bateria', responsavel: 'João Silva', membros: 45, cor: '#FF6B35' },
    { id: '2', nome: 'Passistas', responsavel: 'Maria Santos', membros: 28, cor: '#4ECDC4' },
    { id: '3', nome: 'Ala das Baianas', responsavel: 'Ana Costa', membros: 32, cor: '#FFE66D' },
    { id: '4', nome: 'Comissão de Frente', responsavel: 'Pedro Oliveira', membros: 15, cor: '#95E1D3' },
    { id: '5', nome: 'Mestre-Sala e Porta-Bandeira', responsavel: 'Carlos Souza', membros: 2, cor: '#F38181' },
    { id: '6', nome: 'Ala de Compositores', responsavel: 'Roberto Lima', membros: 12, cor: '#AA96DA' },
    { id: '7', nome: 'Velha Guarda', responsavel: 'José Pereira', membros: 18, cor: '#FCBAD3' },
    { id: '8', nome: 'Harmonia', responsavel: 'Lucas Ferreira', membros: 25, cor: '#A8D8EA' },
  ];

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Blocos
          </Text>
          <Text className="text-base text-muted mt-1">
            Gerencie os blocos da escola
          </Text>
        </View>

        {/* Lista de Blocos */}
        <ScrollView className="flex-1 px-6">
          <View className="gap-3 pb-24">
            {blocos.map((bloco) => (
              <TouchableOpacity
                key={bloco.id}
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
                    <View className="flex-row items-center gap-1 mt-1">
                      <Text className="text-muted text-xs">👥</Text>
                      <Text className="text-muted text-xs">
                        {bloco.membros} integrantes
                      </Text>
                    </View>
                  </View>

                  {/* Seta de navegação */}
                  <Text className="text-muted text-xl">›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Botão Flutuante para Adicionar Bloco */}
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
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
