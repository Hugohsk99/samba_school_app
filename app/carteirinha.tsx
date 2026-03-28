/**
 * Tela de Carteirinha Digital do Integrante
 * Exibe QR Code único para check-in em eventos
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import {
  CATEGORIAS_INTEGRANTE,
  TIPOS_DESFILANTE,
  TIPOS_SEGMENTO,
  CARGOS_DIRETORIA,
} from "@/lib/types";

// Função para gerar URL do QR Code via API externa
function generateQRCodeUrl(data: string, size: number = 200): string {
  // Usando QR Server API (gratuita e confiável)
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
}

export default function CarteirinhaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { integrantes, blocos } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false);
  const [qrCodeError, setQrCodeError] = useState(false);

  // Encontrar integrante
  const integrante = integrantes.find((i) => i.id === params.id);

  if (!integrante) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-6xl mb-4">❌</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Integrante não encontrado
          </Text>
          <Text className="text-muted text-base text-center mb-6">
            O integrante solicitado não existe ou foi removido.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Dados para o QR Code (JSON com informações do integrante)
  const qrCodeData = JSON.stringify({
    type: "SAMBA_SCHOOL_MEMBER",
    id: integrante.id,
    qrCodeId: integrante.qrCodeId,
    nome: integrante.nome,
    categoria: integrante.categoria,
    timestamp: Date.now(),
  });

  // URL do QR Code
  const qrCodeUrl = generateQRCodeUrl(qrCodeData, 280);

  // Obter label da categoria
  const getCategoriaLabel = () => {
    const cat = CATEGORIAS_INTEGRANTE.find((c) => c.value === integrante.categoria);
    return cat?.label || integrante.categoria;
  };

  // Obter label do tipo específico
  const getTipoLabel = () => {
    if (integrante.categoria === "desfilante" && integrante.tipoDesfilante) {
      const tipo = TIPOS_DESFILANTE.find((t) => t.value === integrante.tipoDesfilante);
      return tipo?.label;
    }
    if (integrante.categoria === "segmento" && integrante.tipoSegmento) {
      const tipo = TIPOS_SEGMENTO.find((t) => t.value === integrante.tipoSegmento);
      return tipo?.label;
    }
    if (integrante.categoria === "diretoria" && integrante.cargoDiretoria) {
      const cargo = CARGOS_DIRETORIA.find((c) => c.value === integrante.cargoDiretoria);
      return cargo?.label;
    }
    return null;
  };

  // Obter nomes dos blocos
  const getBlocosNomes = () => {
    return integrante.blocosIds
      .map((id) => blocos.find((b) => b.id === id)?.nome)
      .filter(Boolean)
      .join(", ");
  };

  // Compartilhar carteirinha
  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await Share.share({
        message: `Carteirinha Digital - ${escola?.nome || "Escola de Samba"}\n\nNome: ${integrante.nome}\nCategoria: ${getCategoriaLabel()}\nQR Code ID: ${integrante.qrCodeId}\n\nApresente este QR Code para registrar sua presença nos eventos.`,
        title: "Carteirinha Digital",
      });

      showSuccess("Compartilhado", "Informações da carteirinha compartilhadas!");
    } catch (error) {
      showError("Erro", "Não foi possível compartilhar.");
    }
  };

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";
  const corSecundaria = escola?.corSecundaria || "#4ECDC4";

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View 
          className="px-4 py-4 border-b border-border"
          style={{ backgroundColor: corPrimaria }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center px-3 py-2 rounded-xl bg-white/20"
              activeOpacity={0.7}
            >
              <Text className="text-white text-lg font-medium">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-white text-xl font-bold">
              🎫 Carteirinha
            </Text>

            <TouchableOpacity
              onPress={handleShare}
              className="px-3 py-2 rounded-xl bg-white/20"
              activeOpacity={0.7}
            >
              <Text className="text-white text-lg">📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conteúdo da Carteirinha */}
        <View className="flex-1 p-6 items-center justify-center">
          <View 
            className="w-full max-w-sm bg-surface rounded-3xl overflow-hidden border-4"
            style={{ borderColor: corPrimaria }}
          >
            {/* Cabeçalho da Carteirinha */}
            <View 
              className="p-4 items-center"
              style={{ backgroundColor: corPrimaria }}
            >
              {/* Logo da Escola */}
              {escola?.logo ? (
                <Image
                  source={{ uri: escola.logo }}
                  className="w-16 h-16 rounded-full mb-2"
                  style={{ borderWidth: 2, borderColor: "white" }}
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-2">
                  <Text className="text-3xl">🎭</Text>
                </View>
              )}
              <Text className="text-white text-xl font-bold text-center">
                {escola?.nome || "Escola de Samba"}
              </Text>
              <Text className="text-white/80 text-sm">
                Carteirinha Digital
              </Text>
            </View>

            {/* Foto e Dados */}
            <View className="p-6 items-center">
              {/* Foto do Integrante */}
              {integrante.foto ? (
                <Image
                  source={{ uri: integrante.foto }}
                  className="w-28 h-28 rounded-full mb-4"
                  style={{ borderWidth: 4, borderColor: corPrimaria }}
                />
              ) : (
                <View 
                  className="w-28 h-28 rounded-full bg-muted/30 items-center justify-center mb-4"
                  style={{ borderWidth: 4, borderColor: corPrimaria }}
                >
                  <Text className="text-5xl">👤</Text>
                </View>
              )}

              {/* Nome */}
              <Text className="text-foreground text-2xl font-bold text-center mb-1">
                {integrante.nome}
              </Text>

              {/* Categoria */}
              <View 
                className="px-4 py-1 rounded-full mb-2"
                style={{ backgroundColor: corSecundaria }}
              >
                <Text className="text-white font-semibold">
                  {getCategoriaLabel()}
                </Text>
              </View>

              {/* Tipo específico */}
              {getTipoLabel() && (
                <Text className="text-muted text-base mb-2">
                  {getTipoLabel()}
                </Text>
              )}

              {/* Segmentos */}
              {getBlocosNomes() && (
                <Text className="text-muted text-sm text-center mb-4">
                  {getBlocosNomes()}
                </Text>
              )}

              {/* QR Code */}
              <View className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                {!qrCodeLoaded && !qrCodeError && (
                  <View className="w-[280px] h-[280px] items-center justify-center">
                    <ActivityIndicator size="large" color={corPrimaria} />
                    <Text className="text-muted mt-2">Gerando QR Code...</Text>
                  </View>
                )}
                
                {qrCodeError && (
                  <View className="w-[280px] h-[280px] items-center justify-center bg-error/10 rounded-xl">
                    <Text className="text-4xl mb-2">⚠️</Text>
                    <Text className="text-error text-center">
                      Erro ao carregar QR Code
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setQrCodeError(false);
                        setQrCodeLoaded(false);
                      }}
                      className="mt-2 px-4 py-2 bg-primary rounded-lg"
                    >
                      <Text className="text-white">Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Image
                  source={{ uri: qrCodeUrl }}
                  className="w-[280px] h-[280px]"
                  style={{ display: qrCodeLoaded && !qrCodeError ? "flex" : "none" }}
                  onLoad={() => setQrCodeLoaded(true)}
                  onError={() => setQrCodeError(true)}
                  resizeMode="contain"
                />
              </View>

              {/* ID do QR Code */}
              <View className="bg-background rounded-xl px-4 py-2 border border-border">
                <Text className="text-muted text-xs text-center mb-1">
                  ID do QR Code
                </Text>
                <Text className="text-foreground font-mono text-lg text-center font-bold">
                  {integrante.qrCodeId}
                </Text>
              </View>
            </View>

            {/* Rodapé */}
            <View 
              className="p-3 items-center"
              style={{ backgroundColor: corPrimaria + "20" }}
            >
              <Text className="text-muted text-xs text-center">
                Apresente este QR Code para registrar sua presença
              </Text>
            </View>
          </View>
        </View>

        {/* Botão de Ação */}
        <View className="p-6 pt-0">
          <TouchableOpacity
            onPress={() => {
              showInfo("Dica", "Apresente o QR Code ao responsável pelo check-in do evento.");
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            className="py-4 rounded-xl flex-row items-center justify-center gap-2"
            style={{ backgroundColor: corPrimaria }}
            activeOpacity={0.8}
          >
            <Text className="text-2xl">📱</Text>
            <Text className="text-white text-lg font-bold">
              Como usar minha carteirinha
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
