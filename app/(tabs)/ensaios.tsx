import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import type { Ensaio } from "@/lib/types";

// Dados iniciais de exemplo
const ENSAIOS_INICIAIS: Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>[] = [
  {
    data: '25 Jan 2026',
    horario: '19:00 - 22:00',
    local: 'Quadra da Escola',
    blocosIds: ['todos'],
    descricao: 'Ensaio geral',
    status: 'agendado',
  },
  {
    data: '28 Jan 2026',
    horario: '20:00 - 22:00',
    local: 'Quadra da Escola',
    blocosIds: ['todos'],
    descricao: 'Ensaio de bateria e harmonia',
    status: 'agendado',
  },
  {
    data: '01 Fev 2026',
    horario: '19:00 - 23:00',
    local: 'Quadra da Escola',
    blocosIds: ['todos'],
    descricao: 'Ensaio técnico completo',
    status: 'agendado',
  },
  {
    data: '22 Jan 2026',
    horario: '20:00 - 22:00',
    local: 'Quadra da Escola',
    blocosIds: ['todos'],
    descricao: 'Ensaio de passistas',
    status: 'realizado',
  },
  {
    data: '18 Jan 2026',
    horario: '19:00 - 22:00',
    local: 'Quadra da Escola',
    blocosIds: ['todos'],
    descricao: 'Ensaio geral',
    status: 'realizado',
  },
];

export default function EnsaiosScreen() {
  const router = useRouter();
  const { ensaios, isLoading, addEnsaio, getPresencaByEnsaio, integrantes } = useData();
  const [isInitializing, setIsInitializing] = useState(false);

  // Carregar dados iniciais se não houver ensaios
  useEffect(() => {
    const initializeData = async () => {
      if (!isLoading && ensaios.length === 0 && !isInitializing) {
        setIsInitializing(true);
        try {
          for (const ensaio of ENSAIOS_INICIAIS) {
            await addEnsaio(ensaio);
          }
        } catch (error) {
          console.error('Erro ao inicializar ensaios:', error);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeData();
  }, [isLoading, ensaios.length, addEnsaio, isInitializing]);

  // Calcular taxa de presença para um ensaio
  const calcularTaxaPresenca = (ensaioId: string): number | null => {
    const registros = getPresencaByEnsaio(ensaioId);
    if (registros.length === 0) return null;
    
    const presentes = registros.filter(r => r.status === 'presente' || r.status === 'justificado').length;
    return Math.round((presentes / registros.length) * 100);
  };

  const handleRegistrarPresenca = (ensaioId: string) => {
    router.push({
      pathname: "/registro-presenca",
      params: { ensaioId },
    });
  };

  const handleAddEnsaio = () => {
    router.push("/ensaio-form");
  };

  const getStatusColor = (status: string) => {
    if (status === 'agendado') return 'bg-primary';
    if (status === 'realizado') return 'bg-success';
    return 'bg-muted';
  };

  const getStatusText = (status: string) => {
    if (status === 'agendado') return 'AGENDADO';
    if (status === 'realizado') return 'REALIZADO';
    return 'CANCELADO';
  };

  // Verificar se o ensaio é "hoje" (simplificado)
  const isHoje = (data: string) => {
    const hoje = new Date();
    const dataEnsaio = data.toLowerCase();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    
    return dataEnsaio.includes(String(diaHoje)) && dataEnsaio.includes(mesHoje);
  };

  if (isLoading || isInitializing) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-muted mt-4">Carregando ensaios...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Separar ensaios por status
  const ensaiosAgendados = ensaios.filter(e => e.status === 'agendado');
  const ensaiosRealizados = ensaios.filter(e => e.status === 'realizado');

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Ensaios
          </Text>
          <Text className="text-base text-muted mt-1">
            {ensaios.length} {ensaios.length === 1 ? 'ensaio' : 'ensaios'} cadastrados
          </Text>
        </View>

        {/* Lista de Ensaios */}
        <ScrollView className="flex-1 px-6">
          <View className="gap-4 pb-24">
            {/* Ensaios Agendados */}
            {ensaiosAgendados.length > 0 && (
              <View>
                <Text className="text-foreground text-lg font-semibold mb-3">
                  Próximos Ensaios
                </Text>
                <View className="gap-3">
                  {ensaiosAgendados.map((ensaio) => {
                    const taxaPresenca = calcularTaxaPresenca(ensaio.id);
                    
                    return (
                      <View
                        key={ensaio.id}
                        className="bg-surface rounded-2xl p-4 border border-border"
                      >
                        {/* Header do Card */}
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center gap-3">
                            <View className="items-center">
                              <Text className="text-foreground text-2xl font-bold">
                                {ensaio.data.split(' ')[0]}
                              </Text>
                              <Text className="text-muted text-xs font-medium">
                                {ensaio.data.split(' ')[1]}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-foreground text-lg font-semibold">
                                {ensaio.descricao || 'Ensaio'}
                              </Text>
                              <Text className="text-muted text-sm">
                                {ensaio.horario}
                              </Text>
                            </View>
                          </View>
                          <View className={`${getStatusColor(ensaio.status)} px-3 py-1 rounded-full`}>
                            <Text className="text-white text-xs font-semibold">
                              {getStatusText(ensaio.status)}
                            </Text>
                          </View>
                        </View>

                        {/* Informações */}
                        <View className="gap-2 mb-3">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-muted text-sm">📍</Text>
                            <Text className="text-foreground text-sm">
                              {ensaio.local}
                            </Text>
                          </View>
                        </View>

                        {/* Botão de Registrar Presença */}
                        <TouchableOpacity
                          onPress={() => handleRegistrarPresenca(ensaio.id)}
                          className="bg-primary rounded-xl py-3 items-center active:opacity-80"
                        >
                          <Text className="text-white text-sm font-semibold">
                            Registrar Presença
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Ensaios Realizados */}
            {ensaiosRealizados.length > 0 && (
              <View className="mt-4">
                <Text className="text-foreground text-lg font-semibold mb-3">
                  Ensaios Realizados
                </Text>
                <View className="gap-3">
                  {ensaiosRealizados.map((ensaio) => {
                    const taxaPresenca = calcularTaxaPresenca(ensaio.id);
                    
                    return (
                      <TouchableOpacity
                        key={ensaio.id}
                        onPress={() => handleRegistrarPresenca(ensaio.id)}
                        className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                      >
                        {/* Header do Card */}
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center gap-3">
                            <View className="items-center">
                              <Text className="text-foreground text-2xl font-bold">
                                {ensaio.data.split(' ')[0]}
                              </Text>
                              <Text className="text-muted text-xs font-medium">
                                {ensaio.data.split(' ')[1]}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-foreground text-lg font-semibold">
                                {ensaio.descricao || 'Ensaio'}
                              </Text>
                              <Text className="text-muted text-sm">
                                {ensaio.horario}
                              </Text>
                            </View>
                          </View>
                          <View className={`${getStatusColor(ensaio.status)} px-3 py-1 rounded-full`}>
                            <Text className="text-white text-xs font-semibold">
                              {getStatusText(ensaio.status)}
                            </Text>
                          </View>
                        </View>

                        {/* Taxa de Presença */}
                        {taxaPresenca !== null && (
                          <View className="mt-2 pt-3 border-t border-border">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-muted text-xs">
                                Taxa de Presença
                              </Text>
                              <Text className="text-foreground text-sm font-semibold">
                                {taxaPresenca}%
                              </Text>
                            </View>
                            <View className="mt-2 bg-border rounded-full h-1.5 overflow-hidden">
                              <View
                                className="bg-success h-full"
                                style={{ width: `${taxaPresenca}%` }}
                              />
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Estado vazio */}
            {ensaios.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-6xl mb-4">📅</Text>
                <Text className="text-foreground text-xl font-semibold text-center mb-2">
                  Nenhum ensaio cadastrado
                </Text>
                <Text className="text-muted text-center mb-6">
                  Comece agendando os ensaios da escola.
                </Text>
                <TouchableOpacity
                  onPress={handleAddEnsaio}
                  className="bg-primary px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Agendar Primeiro Ensaio</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Botão Flutuante para Adicionar Ensaio */}
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={handleAddEnsaio}
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
