import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function RelatoriosScreen() {
  // Dados de exemplo para relatórios
  const estatisticasBlocos = [
    { nome: 'Bateria', presenca: 88, cor: '#FF6B35' },
    { nome: 'Passistas', presenca: 92, cor: '#4ECDC4' },
    { nome: 'Ala das Baianas', presenca: 75, cor: '#FFE66D' },
    { nome: 'Comissão de Frente', presenca: 95, cor: '#95E1D3' },
    { nome: 'Harmonia', presenca: 82, cor: '#A8D8EA' },
  ];

  const inventarioResumo = [
    { categoria: 'Fantasias', total: 245, emFalta: 5, cor: '#FF6B35' },
    { categoria: 'Adereços', total: 1850, emFalta: 2, cor: '#4ECDC4' },
    { categoria: 'Instrumentos', total: 65, emFalta: 0, cor: '#FFE66D' },
    { categoria: 'Tecidos', total: 120, emFalta: 3, cor: '#95E1D3' },
  ];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Relatórios
          </Text>
          <Text className="text-base text-muted mt-1">
            Visualize estatísticas e dados consolidados
          </Text>
        </View>

        <View className="px-6 gap-4 pb-6">
          {/* Card: Resumo Geral */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              Resumo Geral
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Total de Ensaios</Text>
                <Text className="text-foreground text-2xl font-bold">24</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Presença Média</Text>
                <Text className="text-success text-2xl font-bold">82%</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Total de Integrantes</Text>
                <Text className="text-foreground text-2xl font-bold">245</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Itens no Almoxarifado</Text>
                <Text className="text-foreground text-2xl font-bold">2.280</Text>
              </View>
            </View>
          </View>

          {/* Card: Presença por Bloco */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              Presença por Bloco
            </Text>
            <Text className="text-muted text-xs mb-4">
              Últimos 10 ensaios
            </Text>
            <View className="gap-4">
              {estatisticasBlocos.map((bloco, index) => (
                <View key={index}>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bloco.cor }}
                      />
                      <Text className="text-foreground text-sm font-medium">
                        {bloco.nome}
                      </Text>
                    </View>
                    <Text className="text-foreground text-sm font-semibold">
                      {bloco.presenca}%
                    </Text>
                  </View>
                  <View className="bg-border rounded-full h-2 overflow-hidden">
                    <View
                      className="h-full"
                      style={{
                        backgroundColor: bloco.cor,
                        width: `${bloco.presenca}%`,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Card: Inventário por Categoria */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              Inventário por Categoria
            </Text>
            <View className="gap-4">
              {inventarioResumo.map((item, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-3 bg-background rounded-xl"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${item.cor}20` }}
                    >
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.cor }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-sm font-semibold">
                        {item.categoria}
                      </Text>
                      <Text className="text-muted text-xs mt-0.5">
                        {item.total} itens cadastrados
                      </Text>
                    </View>
                  </View>
                  {item.emFalta > 0 ? (
                    <View className="bg-error/20 px-2 py-1 rounded-full">
                      <Text className="text-error text-xs font-semibold">
                        {item.emFalta} em falta
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-success/20 px-2 py-1 rounded-full">
                      <Text className="text-success text-xs font-semibold">
                        OK
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Card: Tendência de Presença */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              Tendência de Presença
            </Text>
            <Text className="text-muted text-xs mb-4">
              Últimas 8 semanas
            </Text>
            {/* Gráfico simplificado com barras */}
            <View className="flex-row items-end justify-between h-32 gap-2">
              {[75, 82, 78, 85, 88, 84, 86, 82].map((valor, index) => (
                <View key={index} className="flex-1 items-center gap-2">
                  <View className="flex-1 w-full justify-end">
                    <View
                      className="bg-primary rounded-t-lg w-full"
                      style={{ height: `${valor}%` }}
                    />
                  </View>
                  <Text className="text-muted text-xs">{valor}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card: Alertas e Recomendações */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              Alertas e Recomendações
            </Text>
            <View className="gap-3">
              <View className="flex-row items-start gap-3 p-3 bg-warning/10 rounded-xl">
                <Text className="text-warning text-xl">⚠️</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    Atenção à Ala das Baianas
                  </Text>
                  <Text className="text-muted text-xs mt-1">
                    Presença abaixo da média (75%). Considere conversar com o responsável.
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start gap-3 p-3 bg-error/10 rounded-xl">
                <Text className="text-error text-xl">🚨</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    Materiais em Falta
                  </Text>
                  <Text className="text-muted text-xs mt-1">
                    10 itens precisam ser repostos urgentemente no almoxarifado.
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start gap-3 p-3 bg-success/10 rounded-xl">
                <Text className="text-success text-xl">✅</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    Ótimo Desempenho
                  </Text>
                  <Text className="text-muted text-xs mt-1">
                    Comissão de Frente mantém 95% de presença. Continue assim!
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
