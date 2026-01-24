import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useState } from "react";
import { TIPOS_EVENTO } from "@/lib/types";
import type { Evento } from "@/lib/types";

type FilterStatus = 'todos' | 'agendado' | 'em_andamento' | 'realizado';

export default function EventosScreen() {
  const router = useRouter();
  const { eventos, isLoading } = useData();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(e => {
    if (filterStatus === 'todos') return true;
    return e.status === filterStatus;
  }).sort((a, b) => {
    // Ordenar por data (mais recentes primeiro)
    return new Date(b.data.split('/').reverse().join('-')).getTime() - 
           new Date(a.data.split('/').reverse().join('-')).getTime();
  });

  // Obter label do tipo
  const getTipoLabel = (tipo: Evento['tipo']) => {
    const t = TIPOS_EVENTO.find(x => x.value === tipo);
    return t?.label || tipo;
  };

  // Obter cor do status
  const getStatusColor = (status: Evento['status']) => {
    switch (status) {
      case 'agendado': return { bg: 'bg-warning/20', text: 'text-warning' };
      case 'em_andamento': return { bg: 'bg-success/20', text: 'text-success' };
      case 'realizado': return { bg: 'bg-muted/20', text: 'text-muted' };
      case 'cancelado': return { bg: 'bg-error/20', text: 'text-error' };
      default: return { bg: 'bg-muted/20', text: 'text-muted' };
    }
  };

  // Obter label do status
  const getStatusLabel = (status: Evento['status']) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'em_andamento': return 'Em Andamento';
      case 'realizado': return 'Realizado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const handleAddEvento = () => {
    router.push("/evento-form");
  };

  const handleEventoPress = (eventoId: string) => {
    router.push(`/evento-detalhes?id=${eventoId}`);
  };

  const renderEvento = ({ item }: { item: Evento }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        onPress={() => handleEventoPress(item.id)}
        className="bg-surface rounded-2xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-foreground text-lg font-semibold">
              {item.titulo}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="bg-primary/20 px-2 py-0.5 rounded">
                <Text className="text-primary text-xs font-medium">
                  {getTipoLabel(item.tipo)}
                </Text>
              </View>
              <View className={`px-2 py-0.5 rounded ${statusColor.bg}`}>
                <Text className={`text-xs font-medium ${statusColor.text}`}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>
          
          {item.checkInAberto && (
            <View className="bg-success px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">CHECK-IN</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-4 mt-2">
          <View className="flex-row items-center gap-1">
            <Text className="text-muted text-sm">📅</Text>
            <Text className="text-foreground text-sm">{item.data}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-muted text-sm">🕐</Text>
            <Text className="text-foreground text-sm">{item.horario}</Text>
          </View>
        </View>

        {item.local && (
          <View className="flex-row items-center gap-1 mt-1">
            <Text className="text-muted text-sm">📍</Text>
            <Text className="text-muted text-sm" numberOfLines={1}>
              {item.local}
            </Text>
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
            <Text className="text-foreground text-3xl font-bold">Eventos</Text>
            <TouchableOpacity
              onPress={handleAddEvento}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-white text-2xl font-light">+</Text>
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(['todos', 'agendado', 'em_andamento', 'realizado'] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full ${
                    filterStatus === status
                      ? 'bg-primary'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filterStatus === status ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {status === 'todos' ? 'Todos' :
                     status === 'agendado' ? 'Agendados' :
                     status === 'em_andamento' ? 'Em Andamento' :
                     'Realizados'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de Eventos */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Carregando...</Text>
          </View>
        ) : eventosFiltrados.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-muted text-6xl mb-4">📅</Text>
            <Text className="text-foreground text-xl font-semibold mb-2">
              Nenhum evento
            </Text>
            <Text className="text-muted text-center mb-6">
              {filterStatus === 'todos' 
                ? 'Crie seu primeiro evento para começar a gerenciar a presença.'
                : 'Nenhum evento encontrado com este filtro.'}
            </Text>
            {filterStatus === 'todos' && (
              <TouchableOpacity
                onPress={handleAddEvento}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Criar Evento</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={eventosFiltrados}
            renderItem={renderEvento}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
