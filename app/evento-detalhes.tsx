import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import { TIPOS_EVENTO } from "@/lib/types";
import { useFinanceiro } from "@/lib/financeiro-context";

export default function EventoDetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { 
    eventos, 
    blocos, 
    integrantes,
    updateEvento, 
    deleteEvento,
    getCheckInsByEvento,
  } = useData();

  const evento = eventos.find(e => e.id === params.id);
  const checkIns = evento ? getCheckInsByEvento(evento.id) : [];
  const { getFotosByEvento } = useFinanceiro();
  const fotosEvento = evento ? getFotosByEvento(evento.id) : [];

  if (!evento) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-lg">Evento não encontrado</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Obter label do tipo
  const getTipoLabel = () => {
    const tipo = TIPOS_EVENTO.find(t => t.value === evento.tipo);
    return tipo?.label || evento.tipo;
  };

  // Obter blocos do evento
  const blocosDoEvento = blocos.filter(b => evento.blocosIds.includes(b.id));

  // Obter integrantes que fizeram check-in
  const integrantesCheckIn = checkIns.map(c => {
    const integrante = integrantes.find(i => i.id === c.integranteId);
    return { ...c, integrante };
  }).filter(c => c.integrante);

  // Abrir/Fechar check-in
  const toggleCheckIn = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await updateEvento(evento.id, {
      checkInAberto: !evento.checkInAberto,
      status: !evento.checkInAberto ? 'em_andamento' : evento.status,
    });
  };

  // Abrir galeria
  const handleAbrirGaleria = () => {
    router.push(`/galeria-evento?eventoId=${evento.id}`);
  };

  // Iniciar scanner
  const handleIniciarScanner = () => {
    if (!evento.checkInAberto) {
      Alert.alert(
        "Check-in Fechado",
        "Abra o check-in antes de escanear QR Codes.",
        [{ text: "OK" }]
      );
      return;
    }
    router.push(`/scanner-checkin?eventoId=${evento.id}`);
  };

  // Editar evento
  const handleEditar = () => {
    router.push(`/evento-form?id=${evento.id}`);
  };

  // Excluir evento
  const handleExcluir = () => {
    Alert.alert(
      "Excluir Evento",
      `Tem certeza que deseja excluir "${evento.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteEvento(evento.id);
            router.back();
          },
        },
      ]
    );
  };

  // Finalizar evento
  const handleFinalizar = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateEvento(evento.id, {
      status: 'realizado',
      checkInAberto: false,
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-primary text-base">Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            Detalhes
          </Text>

          <TouchableOpacity onPress={handleEditar} className="p-2">
            <Text className="text-primary text-base">Editar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Cabeçalho do Evento */}
          <View className="p-6 bg-surface border-b border-border">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-sm font-medium">
                  {getTipoLabel()}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                evento.status === 'agendado' ? 'bg-warning/20' :
                evento.status === 'em_andamento' ? 'bg-success/20' :
                evento.status === 'realizado' ? 'bg-muted/20' :
                'bg-error/20'
              }`}>
                <Text className={`text-sm font-medium ${
                  evento.status === 'agendado' ? 'text-warning' :
                  evento.status === 'em_andamento' ? 'text-success' :
                  evento.status === 'realizado' ? 'text-muted' :
                  'text-error'
                }`}>
                  {evento.status === 'agendado' ? 'Agendado' :
                   evento.status === 'em_andamento' ? 'Em Andamento' :
                   evento.status === 'realizado' ? 'Realizado' :
                   'Cancelado'}
                </Text>
              </View>
            </View>

            <Text className="text-foreground text-2xl font-bold mb-2">
              {evento.titulo}
            </Text>

            <View className="flex-row items-center gap-4 mt-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-muted">📅</Text>
                <Text className="text-foreground">{evento.data}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-muted">🕐</Text>
                <Text className="text-foreground">{evento.horario}</Text>
              </View>
            </View>

            {evento.local && (
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="text-muted">📍</Text>
                <Text className="text-foreground">{evento.local}</Text>
              </View>
            )}
          </View>

          {/* Controle de Check-in */}
          <View className="p-6">
            <Text className="text-foreground text-lg font-semibold mb-4">
              Controle de Presença
            </Text>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-foreground text-base font-medium">
                    Check-in
                  </Text>
                  <Text className="text-muted text-sm">
                    {evento.checkInAberto ? 'Aberto para registro' : 'Fechado'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={toggleCheckIn}
                  className={`px-4 py-2 rounded-full ${
                    evento.checkInAberto ? 'bg-error' : 'bg-success'
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {evento.checkInAberto ? 'Fechar' : 'Abrir'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleIniciarScanner}
                  className={`flex-1 py-4 rounded-xl items-center ${
                    evento.checkInAberto ? 'bg-primary' : 'bg-muted/30'
                  }`}
                  disabled={!evento.checkInAberto}
                >
                  <Text className={`font-semibold text-lg ${
                    evento.checkInAberto ? 'text-white' : 'text-muted'
                  }`}>
                    📷 Escanear QR
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Contador de presenças */}
              <View className="mt-4 pt-4 border-t border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground text-base">
                    Presenças registradas
                  </Text>
                  <Text className="text-primary text-2xl font-bold">
                    {checkIns.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Lista de Check-ins */}
          {integrantesCheckIn.length > 0 && (
            <View className="px-6 pb-6">
              <Text className="text-foreground text-lg font-semibold mb-4">
                Presenças Confirmadas
              </Text>
              
              <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                {integrantesCheckIn.map((item, index) => (
                  <View
                    key={item.id}
                    className={`flex-row items-center gap-3 p-4 ${
                      index < integrantesCheckIn.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-primary font-bold">
                        {item.integrante?.nome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-base font-medium">
                        {item.integrante?.nome}
                      </Text>
                      <Text className="text-muted text-xs">
                        {new Date(item.horarioCheckIn).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - {item.metodo === 'qr_code' ? 'QR Code' : 'Manual'}
                      </Text>
                    </View>
                    <Text className="text-success text-lg">✓</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Blocos Participantes */}
          {blocosDoEvento.length > 0 && (
            <View className="px-6 pb-6">
              <Text className="text-foreground text-lg font-semibold mb-4">
                Blocos Participantes
              </Text>
              
              <View className="flex-row flex-wrap gap-2">
                {blocosDoEvento.map(bloco => (
                  <View
                    key={bloco.id}
                    className="flex-row items-center gap-2 bg-surface px-3 py-2 rounded-full border border-border"
                  >
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bloco.cor }}
                    />
                    <Text className="text-foreground text-sm">{bloco.nome}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Galeria de Fotos */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground text-lg font-semibold">
                Galeria de Fotos
              </Text>
              <TouchableOpacity onPress={handleAbrirGaleria}>
                <Text className="text-primary text-base font-medium">
                  Ver todas →
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={handleAbrirGaleria}
              className="bg-surface rounded-2xl p-6 border border-border items-center"
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">📷</Text>
              <Text className="text-foreground text-lg font-semibold">
                {fotosEvento.length} foto{fotosEvento.length !== 1 ? 's' : ''}
              </Text>
              <Text className="text-muted text-sm mt-1">
                Toque para ver ou adicionar fotos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Descrição */}
          {evento.descricao && (
            <View className="px-6 pb-6">
              <Text className="text-foreground text-lg font-semibold mb-4">
                Descrição
              </Text>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-foreground text-base leading-relaxed">
                  {evento.descricao}
                </Text>
              </View>
            </View>
          )}

          {/* Ações */}
          <View className="px-6 pb-8">
            <View className="gap-3">
              {evento.status !== 'realizado' && evento.status !== 'cancelado' && (
                <TouchableOpacity
                  onPress={handleFinalizar}
                  className="bg-success py-4 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold text-lg">
                    Finalizar Evento
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleExcluir}
                className="bg-error/10 py-4 rounded-xl items-center"
              >
                <Text className="text-error font-semibold">
                  Excluir Evento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
