/**
 * Tela de Perfil do Integrante
 * Exibe informações completas, foto, QR Code e link para carteirinha
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  Image,
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
function generateQRCodeUrl(data: string, size: number = 150): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
}

export default function IntegrantePerfilScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { integrantes, blocos, deleteIntegrante, checkIns, eventos } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const [qrCodeLoaded, setQrCodeLoaded] = useState(false);

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

  // Dados para o QR Code
  const qrCodeData = JSON.stringify({
    type: "SAMBA_SCHOOL_MEMBER",
    id: integrante.id,
    qrCodeId: integrante.qrCodeId,
    nome: integrante.nome,
    categoria: integrante.categoria,
  });
  const qrCodeUrl = generateQRCodeUrl(qrCodeData, 150);

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

  // Obter blocos do integrante
  const blocosDoIntegrante = blocos.filter((b) =>
    integrante.blocosIds.includes(b.id)
  );

  // Obter histórico de check-ins
  const checkInsDoIntegrante = checkIns.filter(
    (c) => c.integranteId === integrante.id
  );

  // Compartilhar QR Code
  const handleShareQRCode = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await Share.share({
        message: `Carteirinha Digital - ${escola?.nome || "Escola de Samba"}\n\nNome: ${integrante.nome}\nCategoria: ${getCategoriaLabel()}\nQR Code ID: ${integrante.qrCodeId}\n\nApresente este QR Code para registrar sua presença nos eventos.`,
        title: "Carteirinha Digital",
      });

      showSuccess("Compartilhado", "Informações compartilhadas com sucesso!");
    } catch (error) {
      showError("Erro", "Não foi possível compartilhar.");
    }
  };

  // Abrir carteirinha digital
  const handleOpenCarteirinha = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/carteirinha?id=${integrante.id}`);
  };

  // Excluir integrante
  const handleDelete = () => {
    Alert.alert(
      "⚠️ Excluir Integrante",
      `Tem certeza que deseja excluir ${integrante.nome}?\n\nEsta ação não pode ser desfeita.`,
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
            showSuccess("Excluído", `${integrante.nome} foi removido.`);
            router.back();
          },
        },
      ]
    );
  };

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center px-3 py-2 rounded-xl bg-background"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-lg font-medium">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-xl font-bold">👤 Perfil</Text>

          <TouchableOpacity
            onPress={handleDelete}
            className="px-3 py-2 rounded-xl bg-error/10"
            activeOpacity={0.7}
          >
            <Text className="text-error text-lg">🗑️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cabeçalho do Perfil */}
          <View
            className="items-center py-8 border-b border-border"
            style={{ backgroundColor: corPrimaria + "10" }}
          >
            {/* Foto */}
            {integrante.foto ? (
              <Image
                source={{ uri: integrante.foto }}
                className="w-32 h-32 rounded-full mb-4"
                style={{ borderWidth: 4, borderColor: corPrimaria }}
              />
            ) : (
              <View
                className="w-32 h-32 rounded-full bg-muted/30 items-center justify-center mb-4"
                style={{ borderWidth: 4, borderColor: corPrimaria }}
              >
                <Text className="text-5xl">👤</Text>
              </View>
            )}

            <Text className="text-foreground text-2xl font-bold text-center px-4">
              {integrante.nome}
            </Text>

            <View className="flex-row items-center gap-2 mt-3">
              <View
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: corPrimaria }}
              >
                <Text className="text-white font-semibold">
                  {getCategoriaLabel()}
                </Text>
              </View>
              {getTipoLabel() && (
                <View className="bg-muted/20 px-4 py-2 rounded-full">
                  <Text className="text-muted font-medium">{getTipoLabel()}</Text>
                </View>
              )}
            </View>

            {!integrante.ativo && (
              <View className="bg-error/20 px-4 py-2 rounded-full mt-3">
                <Text className="text-error font-semibold">⚠️ Inativo</Text>
              </View>
            )}
          </View>

          {/* Botão da Carteirinha Digital */}
          <View className="p-6">
            <TouchableOpacity
              onPress={handleOpenCarteirinha}
              className="py-4 rounded-2xl flex-row items-center justify-center gap-3 border-2"
              style={{ backgroundColor: corPrimaria + "10", borderColor: corPrimaria }}
              activeOpacity={0.8}
            >
              <Text className="text-3xl">🎫</Text>
              <View>
                <Text
                  className="text-xl font-bold"
                  style={{ color: corPrimaria }}
                >
                  Abrir Carteirinha Digital
                </Text>
                <Text className="text-muted text-sm">
                  QR Code para check-in em eventos
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* QR Code Preview */}
          <View className="px-6 pb-6">
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-lg font-bold mb-4 text-center">
                📱 QR Code de Check-in
              </Text>

              <View className="items-center">
                <View className="bg-white p-3 rounded-xl shadow-sm">
                  {!qrCodeLoaded && (
                    <View className="w-[150px] h-[150px] items-center justify-center">
                      <ActivityIndicator size="small" color={corPrimaria} />
                    </View>
                  )}
                  <Image
                    source={{ uri: qrCodeUrl }}
                    className="w-[150px] h-[150px]"
                    style={{ display: qrCodeLoaded ? "flex" : "none" }}
                    onLoad={() => setQrCodeLoaded(true)}
                    resizeMode="contain"
                  />
                </View>

                <View className="bg-background rounded-xl px-4 py-2 mt-3 border border-border">
                  <Text className="text-muted text-xs text-center">ID</Text>
                  <Text className="text-foreground font-mono text-sm font-bold">
                    {integrante.qrCodeId}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleShareQRCode}
                  className="mt-4 px-6 py-3 rounded-xl flex-row items-center gap-2"
                  style={{ backgroundColor: corPrimaria }}
                  activeOpacity={0.8}
                >
                  <Text className="text-xl">📤</Text>
                  <Text className="text-white font-bold">Compartilhar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Informações de Contato */}
          <View className="px-6 pb-6">
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-lg font-bold mb-4">
                📋 Informações
              </Text>

              {integrante.telefone && (
                <View className="flex-row items-center gap-3 mb-3">
                  <Text className="text-2xl">📱</Text>
                  <View>
                    <Text className="text-muted text-sm">Telefone</Text>
                    <Text className="text-foreground text-base font-medium">
                      {integrante.telefone}
                    </Text>
                  </View>
                </View>
              )}

              {integrante.email && (
                <View className="flex-row items-center gap-3 mb-3">
                  <Text className="text-2xl">✉️</Text>
                  <View>
                    <Text className="text-muted text-sm">E-mail</Text>
                    <Text className="text-foreground text-base font-medium">
                      {integrante.email}
                    </Text>
                  </View>
                </View>
              )}

              {integrante.cpf && (
                <View className="flex-row items-center gap-3 mb-3">
                  <Text className="text-2xl">🪪</Text>
                  <View>
                    <Text className="text-muted text-sm">CPF</Text>
                    <Text className="text-foreground text-base font-medium">
                      {integrante.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                    </Text>
                  </View>
                </View>
              )}

              {integrante.dataNascimento && (
                <View className="flex-row items-center gap-3 mb-3">
                  <Text className="text-2xl">🎂</Text>
                  <View>
                    <Text className="text-muted text-sm">Data de Nascimento</Text>
                    <Text className="text-foreground text-base font-medium">
                      {integrante.dataNascimento}
                    </Text>
                  </View>
                </View>
              )}

              {integrante.endereco && (
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">🏠</Text>
                  <View className="flex-1">
                    <Text className="text-muted text-sm">Endereço</Text>
                    <Text className="text-foreground text-base font-medium">
                      {integrante.endereco}
                      {integrante.bairro && `, ${integrante.bairro}`}
                      {integrante.cidade && ` - ${integrante.cidade}`}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Blocos */}
          {blocosDoIntegrante.length > 0 && (
            <View className="px-6 pb-6">
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-foreground text-lg font-bold mb-4">
                  🎪 Blocos/Alas
                </Text>

                <View className="gap-2">
                  {blocosDoIntegrante.map((bloco) => (
                    <View
                      key={bloco.id}
                      className="flex-row items-center gap-3 p-3 bg-background rounded-xl"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: bloco.cor || corPrimaria }}
                      >
                        <Text className="text-white font-bold">
                          {bloco.nome.charAt(0)}
                        </Text>
                      </View>
                      <Text className="text-foreground font-medium flex-1">
                        {bloco.nome}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Contato de Emergência */}
          {integrante.contatoEmergenciaNome && (
            <View className="px-6 pb-6">
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-foreground text-lg font-bold mb-4">
                  🆘 Contato de Emergência
                </Text>

                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">👤</Text>
                  <View>
                    <Text className="text-foreground text-base font-medium">
                      {integrante.contatoEmergenciaNome}
                    </Text>
                    {integrante.contatoEmergenciaTelefone && (
                      <Text className="text-muted text-sm">
                        {integrante.contatoEmergenciaTelefone}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Histórico de Presenças */}
          <View className="px-6 pb-6">
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-lg font-bold mb-4">
                📊 Histórico de Presenças
              </Text>

              {checkInsDoIntegrante.length > 0 ? (
                <View className="gap-2">
                  {checkInsDoIntegrante.slice(0, 5).map((checkIn) => {
                    const evento = eventos.find((e) => e.id === checkIn.eventoId);
                    return (
                      <View
                        key={checkIn.id}
                        className="flex-row items-center justify-between p-3 bg-background rounded-xl"
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="text-success text-xl">✓</Text>
                          <Text className="text-foreground font-medium">
                            {evento?.titulo || "Evento"}
                          </Text>
                        </View>
                        <Text className="text-muted text-sm">
                          {new Date(checkIn.horarioCheckIn).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                    );
                  })}

                  <View className="items-center mt-2">
                    <Text className="text-primary font-semibold">
                      {checkInsDoIntegrante.length} presenças registradas
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="items-center py-4">
                  <Text className="text-4xl mb-2">📭</Text>
                  <Text className="text-muted text-center">
                    Nenhuma presença registrada ainda
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Espaço extra no final */}
          <View className="h-8" />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
