import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const colors = useColors();

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Gestão da Escola
          </Text>
          <Text className="text-base text-muted mt-1">
            Bem-vindo ao painel administrativo
          </Text>
        </View>

        {/* Cards de Estatísticas */}
        <View className="px-6 gap-4">
          {/* Card: Blocos */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-muted text-sm font-medium mb-1">
                  Total de Blocos
                </Text>
                <Text className="text-foreground text-4xl font-bold">
                  8
                </Text>
              </View>
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
                <Text className="text-primary text-2xl">🎭</Text>
              </View>
            </View>
          </View>

          {/* Card: Integrantes */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-muted text-sm font-medium mb-1">
                  Total de Integrantes
                </Text>
                <Text className="text-foreground text-4xl font-bold">
                  245
                </Text>
              </View>
              <View className="w-16 h-16 bg-success/10 rounded-full items-center justify-center">
                <Text className="text-success text-2xl">👥</Text>
              </View>
            </View>
          </View>

          {/* Card: Próximo Ensaio */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground text-lg font-semibold">
                Próximo Ensaio
              </Text>
              <View className="bg-warning/20 px-3 py-1 rounded-full">
                <Text className="text-warning text-xs font-semibold">
                  HOJE
                </Text>
              </View>
            </View>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-muted text-sm">📅</Text>
                <Text className="text-foreground text-sm">
                  Sábado, 25 de Janeiro
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-muted text-sm">🕐</Text>
                <Text className="text-foreground text-sm">
                  19:00 - 22:00
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-muted text-sm">📍</Text>
                <Text className="text-foreground text-sm">
                  Quadra da Escola
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="mt-4 bg-primary rounded-xl py-3 items-center active:opacity-80"
            >
              <Text className="text-white font-semibold">
                Registrar Presença
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card: Alertas */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-2xl">⚠️</Text>
              <Text className="text-foreground text-lg font-semibold">
                Alertas
              </Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-start gap-3">
                <View className="w-2 h-2 bg-error rounded-full mt-2" />
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">
                    Materiais em falta
                  </Text>
                  <Text className="text-muted text-xs mt-0.5">
                    5 itens precisam ser repostos no almoxarifado
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start gap-3">
                <View className="w-2 h-2 bg-warning rounded-full mt-2" />
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">
                    Baixa frequência
                  </Text>
                  <Text className="text-muted text-xs mt-0.5">
                    Bloco das Baianas teve apenas 60% de presença no último ensaio
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card: Taxa de Presença Média */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-6">
            <Text className="text-foreground text-lg font-semibold mb-3">
              Taxa de Presença Média
            </Text>
            <View className="flex-row items-end gap-2">
              <Text className="text-foreground text-5xl font-bold">
                82
              </Text>
              <Text className="text-muted text-2xl font-semibold mb-1">
                %
              </Text>
            </View>
            <View className="mt-3 bg-border rounded-full h-2 overflow-hidden">
              <View className="bg-success h-full" style={{ width: '82%' }} />
            </View>
            <Text className="text-muted text-xs mt-2">
              Baseado nos últimos 10 ensaios
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
