import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";

export default function ScannerCheckInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventoId: string }>();
  const { 
    eventos, 
    integrantes, 
    realizarCheckIn, 
    verificarCheckIn,
    getIntegranteByQRCode,
  } = useData();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [checkInCount, setCheckInCount] = useState(0);

  const evento = eventos.find(e => e.id === params.eventoId);

  // Processar QR Code escaneado
  const processQRCode = async (qrCodeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Buscar integrante pelo QR Code
    const integrante = getIntegranteByQRCode(qrCodeId);

    if (!integrante) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        "QR Code Inválido",
        "Este QR Code não corresponde a nenhum integrante cadastrado.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
      return;
    }

    // Verificar se já fez check-in
    const jaFezCheckIn = verificarCheckIn(params.eventoId!, integrante.id);
    
    if (jaFezCheckIn) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert(
        "Check-in Duplicado",
        `${integrante.nome} já realizou check-in neste evento.`,
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
      return;
    }

    // Realizar check-in
    try {
      await realizarCheckIn(
        params.eventoId!,
        integrante.id,
        qrCodeId,
        showManualInput ? 'manual' : 'qr_code'
      );

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setCheckInCount(prev => prev + 1);

      Alert.alert(
        "Check-in Realizado! ✓",
        `${integrante.nome}\n${integrante.categoria === 'desfilante' ? 'Desfilante' : integrante.categoria === 'segmento' ? 'Segmento' : 'Diretoria'}`,
        [{ text: "Próximo", onPress: () => {
          setScanned(false);
          setManualCode("");
          setShowManualInput(false);
        }}]
      );
    } catch (error) {
      console.error("Erro ao realizar check-in:", error);
      Alert.alert("Erro", "Não foi possível realizar o check-in.");
      setScanned(false);
    }
  };

  // Handler para código escaneado
  const handleBarcodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    setLastScannedCode(data);
    processQRCode(data);
  };

  // Handler para entrada manual
  const handleManualCheckIn = () => {
    if (!manualCode.trim()) {
      Alert.alert("Erro", "Digite o código do QR Code.");
      return;
    }
    setScanned(true);
    processQRCode(manualCode.trim());
  };

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

  // Tela de permissão
  if (!permission) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Carregando câmera...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-lg text-center mb-4">
            Precisamos de permissão para acessar a câmera
          </Text>
          <Text className="text-muted text-center mb-6">
            A câmera é necessária para escanear os QR Codes dos integrantes.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-primary px-6 py-3 rounded-full mb-4"
          >
            <Text className="text-white font-semibold">Permitir Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowManualInput(true)}
            className="px-6 py-3"
          >
            <Text className="text-primary font-medium">Entrada Manual</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Text className="text-white text-base">Fechar</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-white text-lg font-semibold">
                Check-in
              </Text>
              <Text className="text-white/70 text-sm">
                {evento.titulo}
              </Text>
            </View>

            <View className="bg-primary px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{checkInCount}</Text>
            </View>
          </View>
        </View>

        {/* Câmera ou Entrada Manual */}
        {showManualInput ? (
          <View className="flex-1 bg-background items-center justify-center p-6">
            <Text className="text-foreground text-xl font-semibold mb-6">
              Entrada Manual
            </Text>
            
            <TextInput
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg text-center mb-4"
              placeholder="Digite o código do QR"
              placeholderTextColor="#687076"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={handleManualCheckIn}
              className="bg-primary px-8 py-4 rounded-full mb-4"
              disabled={!manualCode.trim()}
              style={{ opacity: manualCode.trim() ? 1 : 0.5 }}
            >
              <Text className="text-white font-semibold text-lg">Confirmar Check-in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowManualInput(false);
                setManualCode("");
              }}
              className="px-6 py-3"
            >
              <Text className="text-primary font-medium">Usar Câmera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Câmera */}
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Overlay com guia de escaneamento */}
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-64 h-64 border-2 border-white rounded-3xl" />
              <Text className="text-white text-center mt-4 text-lg">
                Aponte para o QR Code
              </Text>
            </View>

            {/* Botão de entrada manual */}
            <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-6 pb-10">
              <TouchableOpacity
                onPress={() => setShowManualInput(true)}
                className="bg-white/20 px-6 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-medium">
                  Digitar código manualmente
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
