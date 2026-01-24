import { Text, View, TouchableOpacity, FlatList, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import { useState } from "react";
import { TIPOS_EVENTO } from "@/lib/types";
import type { Evento } from "@/lib/types";
import * as Haptics from "expo-haptics";

type FilterStatus = 'todos' | 'agendado' | 'em_andamento' | 'realizado';

export default function EventosScreen() {
  const router = useRouter();
  const { eventos, isLoading } = useData();
  const { escola } = useEscola();
  const { showInfo } = useToast();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');

  const corPrimaria = escola?.corPrimaria || "#FF6B35";

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

  // Obter ícone do tipo
  const getTipoIcon = (tipo: Evento['tipo']) => {
    switch (tipo) {
      case 'ensaio': return '🥁';
      case 'feijoada': return '🍲';
      case 'reuniao': return '📋';
      case 'desfile': return '🎭';
      case 'outro': return '📌';
      default: return '📅';
    }
  };

  // Obter cor do status
  const getStatusColor = (status: Evento['status']) => {
    switch (status) {
      case 'agendado': return { bg: '#F59E0B20', text: '#F59E0B', label: 'Agendado' };
      case 'em_andamento': return { bg: '#22C55E20', text: '#22C55E', label: 'Em Andamento' };
      case 'realizado': return { bg: '#9BA1A620', text: '#9BA1A6', label: 'Realizado' };
      case 'cancelado': return { bg: '#EF444420', text: '#EF4444', label: 'Cancelado' };
      default: return { bg: '#9BA1A620', text: '#9BA1A6', label: status };
    }
  };

  const handleAddEvento = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    showInfo("Novo evento", "Preencha os dados do evento");
    router.push("/evento-form");
  };

  const handleEventoPress = (evento: Evento) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/evento-detalhes?id=${evento.id}`);
  };

  const handleFilterChange = (status: FilterStatus) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilterStatus(status);
    const labels = {
      todos: 'Todos os eventos',
      agendado: 'Eventos agendados',
      em_andamento: 'Eventos em andamento',
      realizado: 'Eventos realizados'
    };
    showInfo("Filtro aplicado", labels[status]);
  };

  const renderEvento = ({ item }: { item: Evento }) => {
    const statusInfo = getStatusColor(item.status);
    const tipoIcon = getTipoIcon(item.tipo);
    
    return (
      <TouchableOpacity
        onPress={() => handleEventoPress(item)}
        className="bg-surface rounded-2xl p-5 mb-4 border border-border"
        activeOpacity={0.7}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Header do Card */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${corPrimaria}20` }}
            >
              <Text className="text-3xl">{tipoIcon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-xl font-bold" numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text className="text-muted text-base mt-1">
                {getTipoLabel(item.tipo)}
              </Text>
            </View>
          </View>
          
          {item.checkInAberto && (
            <View className="bg-success px-3 py-2 rounded-xl">
              <Text className="text-white text-sm font-bold">📱 CHECK-IN</Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View 
          className="self-start px-3 py-1.5 rounded-lg mb-3"
          style={{ backgroundColor: statusInfo.bg }}
        >
          <Text className="text-sm font-bold" style={{ color: statusInfo.text }}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Informações */}
        <View className="bg-background rounded-xl p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">📅</Text>
            <View>
              <Text className="text-muted text-sm">Data</Text>
              <Text className="text-foreground text-lg font-semibold">{item.data}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">🕐</Text>
            <View>
              <Text className="text-muted text-sm">Horário</Text>
              <Text className="text-foreground text-lg font-semibold">{item.horario}</Text>
            </View>
          </View>

          {item.local && (
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">📍</Text>
              <View className="flex-1">
                <Text className="text-muted text-sm">Local</Text>
                <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
                  {item.local}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-end mt-3">
          <Text className="text-primary text-base font-semibold">
            Ver detalhes →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ status, label }: { status: FilterStatus; label: string }) => (
    <TouchableOpacity
      onPress={() => handleFilterChange(status)}
      className={`px-5 py-3 rounded-xl mr-3 ${
        filterStatus === status ? '' : 'bg-surface border border-border'
      }`}
      style={filterStatus === status ? { backgroundColor: corPrimaria } : {}}
      activeOpacity={0.8}
    >
      <Text
        className={`text-base font-bold ${
          filterStatus === status ? 'text-white' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-foreground text-3xl font-bold">📅 Eventos</Text>
              <Text className="text-muted text-base mt-1">
                {eventos.length} evento{eventos.length !== 1 ? 's' : ''} cadastrado{eventos.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleAddEvento}
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: corPrimaria }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-3xl font-light">+</Text>
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <FlatList
            horizontal
            data={[
              { status: 'todos' as FilterStatus, label: 'Todos' },
              { status: 'agendado' as FilterStatus, label: 'Agendados' },
              { status: 'em_andamento' as FilterStatus, label: 'Em Andamento' },
              { status: 'realizado' as FilterStatus, label: 'Realizados' },
            ]}
            renderItem={({ item }) => (
              <FilterButton status={item.status} label={item.label} />
            )}
            keyExtractor={(item) => item.status}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Lista de Eventos */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={corPrimaria} />
            <Text className="text-muted text-lg mt-4">Carregando eventos...</Text>
          </View>
        ) : eventosFiltrados.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: `${corPrimaria}20` }}
            >
              <Text className="text-5xl">📅</Text>
            </View>
            <Text className="text-foreground text-2xl font-bold mb-2 text-center">
              Nenhum evento
            </Text>
            <Text className="text-muted text-lg text-center mb-8 px-4">
              {filterStatus === 'todos' 
                ? 'Crie seu primeiro evento para começar a gerenciar a presença da escola.'
                : 'Nenhum evento encontrado com este filtro.'}
            </Text>
            {filterStatus === 'todos' && (
              <TouchableOpacity
                onPress={handleAddEvento}
                className="px-8 py-4 rounded-2xl"
                style={{ backgroundColor: corPrimaria }}
                activeOpacity={0.8}
              >
                <Text className="text-white text-lg font-bold">+ Criar Evento</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={eventosFiltrados}
            renderItem={renderEvento}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
