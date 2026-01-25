/**
 * Galeria de Fotos do Evento
 * Upload e visualização de fotos de eventos
 */

import { useState, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinanceiro } from "@/lib/financeiro-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import type { FotoEvento } from "@/lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 16) / 3; // 3 colunas com padding

export default function GaleriaEventoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventoId: string }>();
  const { fotos, addFoto, deleteFoto, getFotosByEvento } = useFinanceiro();
  const { eventos } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError } = useToast();
  const { sessao, temPermissao } = useAuth();

  // Estados
  const [selectedPhoto, setSelectedPhoto] = useState<FotoEvento | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Evento atual
  const evento = eventos.find(e => e.id === params.eventoId);

  // Fotos do evento
  const fotosEvento = getFotosByEvento(params.eventoId || "");

  // Selecionar foto da galeria
  const handlePickImage = async () => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showError("Permissão Negada", "Precisamos de acesso à galeria para adicionar fotos.");
        return;
      }

      // Abrir seletor
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsUploading(true);

        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Adicionar cada foto
        for (const asset of result.assets) {
          await addFoto({
            eventoId: params.eventoId || "",
            uri: asset.uri,
            uploadPor: sessao?.nome || "Usuário",
          });
        }

        showSuccess("Sucesso", `${result.assets.length} foto(s) adicionada(s)!`);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      showError("Erro", "Não foi possível adicionar a foto.");
      setIsUploading(false);
    }
  };

  // Tirar foto com câmera
  const handleTakePhoto = async () => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showError("Permissão Negada", "Precisamos de acesso à câmera para tirar fotos.");
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsUploading(true);

        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        await addFoto({
          eventoId: params.eventoId || "",
          uri: result.assets[0].uri,
          uploadPor: sessao?.nome || "Usuário",
        });

        showSuccess("Sucesso", "Foto adicionada!");
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      showError("Erro", "Não foi possível tirar a foto.");
      setIsUploading(false);
    }
  };

  // Excluir foto
  const handleDeletePhoto = (foto: FotoEvento) => {
    Alert.alert(
      "Excluir Foto",
      "Deseja excluir esta foto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteFoto(foto.id);
            setSelectedPhoto(null);
            showSuccess("Sucesso", "Foto excluída!");
          },
        },
      ]
    );
  };

  // Abrir foto em tela cheia
  const handlePhotoPress = (foto: FotoEvento) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPhoto(foto);
  };

  const handleVoltar = () => {
    router.back();
  };

  // Renderizar foto
  const renderPhoto = ({ item }: { item: FotoEvento }) => (
    <TouchableOpacity
      onPress={() => handlePhotoPress(item)}
      activeOpacity={0.8}
      style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 8 }}
    >
      <Image
        source={{ uri: item.uri }}
        style={{ width: "100%", height: "100%", borderRadius: 8 }}
        contentFit="cover"
        transition={200}
      />
    </TouchableOpacity>
  );

  // Formatar data
  const formatarData = (dataStr: string) => {
    return new Date(dataStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: corPrimaria }}
        >
          <View className="flex-row items-center gap-4 mb-2">
            <TouchableOpacity
              onPress={handleVoltar}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Galeria</Text>
              {evento && (
                <Text className="text-white/80 text-sm" numberOfLines={1}>
                  {evento.titulo}
                </Text>
              )}
            </View>
          </View>

          {/* Contador */}
          <View className="bg-white/20 rounded-xl p-3 mt-2">
            <Text className="text-white text-center">
              📷 {fotosEvento.length} foto{fotosEvento.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Botões de Upload */}
        {temPermissao("editarEvento") && (
          <View className="flex-row gap-3 px-6 py-4">
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isUploading}
              className="flex-1 bg-surface border border-border rounded-xl p-3 flex-row items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Text className="text-xl">🖼️</Text>
              <Text className="text-foreground font-medium">
                {isUploading ? "Enviando..." : "Galeria"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={isUploading}
              className="flex-1 rounded-xl p-3 flex-row items-center justify-center gap-2"
              style={{ backgroundColor: corPrimaria }}
              activeOpacity={0.8}
            >
              <Text className="text-xl">📷</Text>
              <Text className="text-white font-bold">Câmera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid de Fotos */}
        {fotosEvento.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-muted text-6xl mb-4">📷</Text>
            <Text className="text-foreground text-xl font-semibold mb-2">
              Nenhuma foto
            </Text>
            <Text className="text-muted text-center mb-6">
              Adicione fotos para criar a galeria deste evento.
            </Text>
            {temPermissao("editarEvento") && (
              <TouchableOpacity
                onPress={handlePickImage}
                className="px-6 py-3 rounded-full"
                style={{ backgroundColor: corPrimaria }}
              >
                <Text className="text-white font-bold">+ Adicionar Fotos</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={fotosEvento}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Modal de Visualização */}
        <Modal
          visible={selectedPhoto !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View className="flex-1 bg-black">
            {/* Header do Modal */}
            <View className="flex-row items-center justify-between p-4 pt-12">
              <TouchableOpacity
                onPress={() => setSelectedPhoto(null)}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              >
                <Text className="text-white text-xl">✕</Text>
              </TouchableOpacity>
              {temPermissao("editarEvento") && selectedPhoto && (
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                  className="w-10 h-10 rounded-full bg-error/50 items-center justify-center"
                >
                  <Text className="text-white text-xl">🗑️</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Imagem */}
            {selectedPhoto && (
              <View className="flex-1 items-center justify-center">
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                  contentFit="contain"
                />
              </View>
            )}

            {/* Info da Foto */}
            {selectedPhoto && (
              <View className="p-4 pb-8">
                <Text className="text-white/80 text-center text-sm">
                  Enviada por {selectedPhoto.uploadPor}
                </Text>
                <Text className="text-white/60 text-center text-xs mt-1">
                  {formatarData(selectedPhoto.criadoEm)}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
