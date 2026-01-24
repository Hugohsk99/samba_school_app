import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function EnsaiosScreen() {
  // Dados de exemplo
  const ensaios = [
    {
      id: '1',
      data: '25 Jan',
      diaSemana: 'Sábado',
      horario: '19:00 - 22:00',
      local: 'Quadra da Escola',
      blocos: ['Bateria', 'Passistas', 'Harmonia'],
      status: 'hoje',
      presenca: 85,
    },
    {
      id: '2',
      data: '28 Jan',
      diaSemana: 'Terça',
      horario: '20:00 - 22:00',
      local: 'Quadra da Escola',
      blocos: ['Ala das Baianas', 'Velha Guarda'],
      status: 'proximo',
      presenca: null,
    },
    {
      id: '3',
      data: '01 Fev',
      diaSemana: 'Sábado',
      horario: '19:00 - 23:00',
      local: 'Quadra da Escola',
      blocos: ['Todos os blocos'],
      status: 'proximo',
      presenca: null,
    },
    {
      id: '4',
      data: '22 Jan',
      diaSemana: 'Quinta',
      horario: '20:00 - 22:00',
      local: 'Quadra da Escola',
      blocos: ['Bateria', 'Harmonia'],
      status: 'realizado',
      presenca: 78,
    },
    {
      id: '5',
      data: '18 Jan',
      diaSemana: 'Sábado',
      horario: '19:00 - 22:00',
      local: 'Quadra da Escola',
      blocos: ['Todos os blocos'],
      status: 'realizado',
      presenca: 82,
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'hoje') return 'bg-warning';
    if (status === 'proximo') return 'bg-primary';
    return 'bg-muted';
  };

  const getStatusText = (status: string) => {
    if (status === 'hoje') return 'HOJE';
    if (status === 'proximo') return 'PRÓXIMO';
    return 'REALIZADO';
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Ensaios
          </Text>
          <Text className="text-base text-muted mt-1">
            Gerencie os ensaios da escola
          </Text>
        </View>

        {/* Lista de Ensaios */}
        <ScrollView className="flex-1 px-6">
          <View className="gap-4 pb-24">
            {ensaios.map((ensaio) => (
              <TouchableOpacity
                key={ensaio.id}
                className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
              >
                {/* Header do Card */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    {/* Data */}
                    <View className="items-center">
                      <Text className="text-foreground text-2xl font-bold">
                        {ensaio.data.split(' ')[0]}
                      </Text>
                      <Text className="text-muted text-xs font-medium">
                        {ensaio.data.split(' ')[1]}
                      </Text>
                    </View>
                    {/* Dia da Semana */}
                    <View>
                      <Text className="text-foreground text-lg font-semibold">
                        {ensaio.diaSemana}
                      </Text>
                      <Text className="text-muted text-sm">
                        {ensaio.horario}
                      </Text>
                    </View>
                  </View>
                  {/* Badge de Status */}
                  <View className={`${getStatusColor(ensaio.status)} px-3 py-1 rounded-full`}>
                    <Text className="text-white text-xs font-semibold">
                      {getStatusText(ensaio.status)}
                    </Text>
                  </View>
                </View>

                {/* Informações do Ensaio */}
                <View className="gap-2 mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-muted text-sm">📍</Text>
                    <Text className="text-foreground text-sm">
                      {ensaio.local}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-muted text-sm">👥</Text>
                    <Text className="text-foreground text-sm">
                      {ensaio.blocos.join(', ')}
                    </Text>
                  </View>
                </View>

                {/* Taxa de Presença (se disponível) */}
                {ensaio.presenca !== null && (
                  <View className="mt-2 pt-3 border-t border-border">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-muted text-xs">
                        Taxa de Presença
                      </Text>
                      <Text className="text-foreground text-sm font-semibold">
                        {ensaio.presenca}%
                      </Text>
                    </View>
                    <View className="mt-2 bg-border rounded-full h-1.5 overflow-hidden">
                      <View
                        className="bg-success h-full"
                        style={{ width: `${ensaio.presenca}%` }}
                      />
                    </View>
                  </View>
                )}

                {/* Botão de Ação */}
                {ensaio.status === 'hoje' && (
                  <TouchableOpacity className="mt-3 bg-primary rounded-xl py-2.5 items-center active:opacity-80">
                    <Text className="text-white text-sm font-semibold">
                      Registrar Presença
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Botão Flutuante para Adicionar Ensaio */}
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
