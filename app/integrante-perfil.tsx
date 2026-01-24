import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import type { Integrante } from "@/lib/types";
import {
  CATEGORIAS_INTEGRANTE,
  TIPOS_DESFILANTE,
  TIPOS_SEGMENTO,
  CARGOS_DIRETORIA,
} from "@/lib/types";

// Componente de QR Code visual (representação simplificada)
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  // Gera um padrão visual baseado no valor do QR Code
  const generatePattern = (str: string) => {
    const hash = str.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return Math.abs(hash);
  };

  const pattern = generatePattern(value);
  const gridSize = 7;
  const cellSize = size / gridSize;

  // Gera células do QR Code baseado no hash
  const cells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Cantos sempre preenchidos (padrão de posição)
      const isCorner = 
        (row < 2 && col < 2) ||
        (row < 2 && col >= gridSize - 2) ||
        (row >= gridSize - 2 && col < 2);
      
      // Células internas baseadas no hash
      const cellIndex = row * gridSize + col;
      const isFilled = isCorner || ((pattern >> (cellIndex % 30)) & 1);
      
      cells.push(
        <View
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: col * cellSize,
            top: row * cellSize,
            width: cellSize - 2,
            height: cellSize - 2,
            backgroundColor: isFilled ? '#000' : '#fff',
            borderRadius: 2,
          }}
        />
      );
    }
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 12,
      }}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        {cells}
      </View>
      <Text style={{ 
        textAlign: 'center', 
        marginTop: 8, 
        fontSize: 10, 
        fontFamily: 'monospace',
        color: '#666'
      }}>
        {value}
      </Text>
    </View>
  );
}

export default function IntegrantePerfilScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { integrantes, blocos, deleteIntegrante, checkIns, eventos } = useData();

  const integrante = integrantes.find(i => i.id === params.id);

  if (!integrante) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-lg">Integrante não encontrado</Text>
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

  // Obter label da categoria
  const getCategoriaLabel = () => {
    const cat = CATEGORIAS_INTEGRANTE.find(c => c.value === integrante.categoria);
    return cat?.label || integrante.categoria;
  };

  // Obter label do tipo específico
  const getTipoLabel = () => {
    if (integrante.categoria === 'desfilante' && integrante.tipoDesfilante) {
      const tipo = TIPOS_DESFILANTE.find(t => t.value === integrante.tipoDesfilante);
      return tipo?.label;
    }
    if (integrante.categoria === 'segmento' && integrante.tipoSegmento) {
      const tipo = TIPOS_SEGMENTO.find(t => t.value === integrante.tipoSegmento);
      return tipo?.label;
    }
    if (integrante.categoria === 'diretoria' && integrante.cargoDiretoria) {
      const cargo = CARGOS_DIRETORIA.find(c => c.value === integrante.cargoDiretoria);
      return cargo?.label;
    }
    return null;
  };

  // Obter blocos do integrante
  const blocosDoIntegrante = blocos.filter(b => integrante.blocosIds.includes(b.id));

  // Obter histórico de check-ins
  const checkInsDoIntegrante = checkIns.filter(c => c.integranteId === integrante.id);

  // Compartilhar QR Code
  const handleShareQRCode = async () => {
    try {
      await Share.share({
        message: `QR Code do integrante ${integrante.nome}: ${integrante.qrCodeId}`,
        title: 'QR Code de Check-in',
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  // Excluir integrante
  const handleDelete = () => {
    Alert.alert(
      "Excluir Integrante",
      `Tem certeza que deseja excluir ${integrante.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteIntegrante(integrante.id);
            router.back();
          },
        },
      ]
    );
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
            Perfil
          </Text>

          <TouchableOpacity onPress={handleDelete} className="p-2">
            <Text className="text-error text-base">Excluir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Cabeçalho do Perfil */}
          <View className="items-center py-6 bg-surface border-b border-border">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-4">
              <Text className="text-primary text-3xl font-bold">
                {integrante.nome.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text className="text-foreground text-2xl font-bold text-center px-4">
              {integrante.nome}
            </Text>

            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-sm font-medium">
                  {getCategoriaLabel()}
                </Text>
              </View>
              {getTipoLabel() && (
                <View className="bg-muted/20 px-3 py-1 rounded-full">
                  <Text className="text-muted text-sm">
                    {getTipoLabel()}
                  </Text>
                </View>
              )}
            </View>

            {!integrante.ativo && (
              <View className="bg-error/20 px-3 py-1 rounded-full mt-2">
                <Text className="text-error text-sm font-medium">Inativo</Text>
              </View>
            )}
          </View>

          {/* QR Code para Check-in */}
          <View className="p-6">
            <Text className="text-foreground text-lg font-semibold mb-4 text-center">
              QR Code para Check-in
            </Text>
            
            <View className="items-center bg-surface rounded-2xl p-6 border border-border">
              <QRCodeDisplay value={integrante.qrCodeId} size={180} />
              
              <TouchableOpacity
                onPress={handleShareQRCode}
                className="mt-4 bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Compartilhar QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Informações de Contato */}
          <View className="px-6 pb-6">
            <Text className="text-foreground text-lg font-semibold mb-4">
              Informações de Contato
            </Text>
            
            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              {integrante.telefone && (
                <View className="p-4 border-b border-border">
                  <Text className="text-muted text-xs mb-1">Telefone</Text>
                  <Text className="text-foreground text-base">{integrante.telefone}</Text>
                </View>
              )}
              
              {integrante.email && (
                <View className="p-4 border-b border-border">
                  <Text className="text-muted text-xs mb-1">E-mail</Text>
                  <Text className="text-foreground text-base">{integrante.email}</Text>
                </View>
              )}

              {integrante.contatoEmergenciaNome && (
                <View className="p-4">
                  <Text className="text-muted text-xs mb-1">Contato de Emergência</Text>
                  <Text className="text-foreground text-base">
                    {integrante.contatoEmergenciaNome}
                    {integrante.contatoEmergenciaTelefone && ` - ${integrante.contatoEmergenciaTelefone}`}
                  </Text>
                </View>
              )}

              {!integrante.telefone && !integrante.email && !integrante.contatoEmergenciaNome && (
                <View className="p-4">
                  <Text className="text-muted text-center">Nenhuma informação de contato</Text>
                </View>
              )}
            </View>
          </View>

          {/* Blocos Associados */}
          {blocosDoIntegrante.length > 0 && (
            <View className="px-6 pb-6">
              <Text className="text-foreground text-lg font-semibold mb-4">
                Blocos/Alas
              </Text>
              
              <View className="gap-2">
                {blocosDoIntegrante.map(bloco => (
                  <View
                    key={bloco.id}
                    className="flex-row items-center gap-3 bg-surface p-4 rounded-xl border border-border"
                  >
                    <View
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: bloco.cor }}
                    />
                    <Text className="text-foreground text-base font-medium flex-1">
                      {bloco.nome}
                    </Text>
                    <Text className="text-muted text-xs">
                      {bloco.tipo === 'ala' ? 'Ala' : 'Segmento'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Histórico de Presenças */}
          <View className="px-6 pb-8">
            <Text className="text-foreground text-lg font-semibold mb-4">
              Histórico de Check-ins
            </Text>
            
            {checkInsDoIntegrante.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-muted text-center">
                  Nenhum check-in registrado
                </Text>
              </View>
            ) : (
              <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                {checkInsDoIntegrante.slice(0, 5).map((checkIn, index) => {
                  const evento = eventos.find(e => e.id === checkIn.eventoId);
                  return (
                    <View
                      key={checkIn.id}
                      className={`p-4 ${index < checkInsDoIntegrante.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <Text className="text-foreground text-base font-medium">
                        {evento?.titulo || 'Evento'}
                      </Text>
                      <Text className="text-muted text-sm">
                        {new Date(checkIn.horarioCheckIn).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(checkIn.horarioCheckIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
