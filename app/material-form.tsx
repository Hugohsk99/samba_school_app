import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import { CATEGORIAS_MATERIAL, TAMANHOS_FANTASIA } from "@/lib/types";
import type { Material, TamanhoFantasia } from "@/lib/types";

export default function MaterialFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { materiais, blocos, addMaterial, updateMaterial } = useData();

  const isEditing = !!params.id;
  const materialExistente = isEditing ? materiais.find(m => m.id === params.id) : null;

  // Estado do formulário
  const [nome, setNome] = useState(materialExistente?.nome || "");
  const [categoria, setCategoria] = useState<Material['categoria']>(materialExistente?.categoria || "fantasia");
  const [descricao, setDescricao] = useState(materialExistente?.descricao || "");
  const [quantidadeNecessaria, setQuantidadeNecessaria] = useState(materialExistente?.quantidadeNecessaria?.toString() || "1");
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(materialExistente?.quantidadeDisponivel?.toString() || "1");
  const [quantidadeEmUso, setQuantidadeEmUso] = useState(materialExistente?.quantidadeEmUso?.toString() || "0");
  const [tamanho, setTamanho] = useState<TamanhoFantasia | "">(materialExistente?.tamanho || "");
  const [blocoId, setBlocoId] = useState(materialExistente?.blocoId || "");
  const [localizacao, setLocalizacao] = useState(materialExistente?.localizacao || "");
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = nome.trim().length > 0 && parseInt(quantidadeNecessaria) > 0;

  // Salvar material
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Erro", "Preencha o nome e quantidade válida.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const materialData = {
        nome: nome.trim(),
        categoria,
        descricao: descricao.trim(),
        quantidadeDisponivel: parseInt(quantidadeDisponivel) || 1,
        quantidadeEmUso: parseInt(quantidadeEmUso) || 0,
        quantidadeNecessaria: parseInt(quantidadeNecessaria) || 1,
        tamanho: tamanho || undefined,
        blocoId: blocoId || undefined,
        localizacao: localizacao.trim() || undefined,
      };

      if (isEditing && params.id) {
        await updateMaterial(params.id, materialData);
      } else {
        await addMaterial(materialData);
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar material:", error);
      Alert.alert("Erro", "Não foi possível salvar o material. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
            disabled={isSaving}
          >
            <Text className="text-primary text-base">Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            {isEditing ? "Editar Item" : "Novo Item"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="p-2"
            style={{ opacity: isValid && !isSaving ? 1 : 0.5 }}
            disabled={!isValid || isSaving}
          >
            <Text className="text-primary text-base font-semibold">
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <ScrollView className="flex-1 p-6">
          <View className="gap-6">
            {/* Campo: Nome */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Nome do Item *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: Fantasia Ala das Baianas, Surdo..."
                placeholderTextColor="#687076"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Categoria */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Categoria
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIAS_MATERIAL.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => {
                      setCategoria(cat.value);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className={`px-4 py-2 rounded-full ${
                      categoria === cat.value
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        categoria === cat.value ? "text-white" : "text-foreground"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Campo: Descrição */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Descrição
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Detalhes sobre o item"
                placeholderTextColor="#687076"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={2}
                style={{ minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            {/* Seção: Quantidades */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-foreground text-base font-semibold mb-4">
                Controle de Estoque
              </Text>

              <View className="flex-row gap-3">
                {/* Quantidade Necessária */}
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Necessário *
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base text-center"
                    placeholder="0"
                    placeholderTextColor="#687076"
                    value={quantidadeNecessaria}
                    onChangeText={setQuantidadeNecessaria}
                    keyboardType="numeric"
                  />
                </View>

                {/* Quantidade Disponível */}
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Disponível
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base text-center"
                    placeholder="0"
                    placeholderTextColor="#687076"
                    value={quantidadeDisponivel}
                    onChangeText={setQuantidadeDisponivel}
                    keyboardType="numeric"
                  />
                </View>

                {/* Quantidade Em Uso */}
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Em Uso
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base text-center"
                    placeholder="0"
                    placeholderTextColor="#687076"
                    value={quantidadeEmUso}
                    onChangeText={setQuantidadeEmUso}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Campos específicos para Fantasia */}
            {categoria === 'fantasia' && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-foreground text-base font-semibold mb-4">
                  Detalhes da Fantasia
                </Text>

                {/* Tamanho */}
                <View className="mb-4">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Tamanho
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {TAMANHOS_FANTASIA.map((tam) => (
                      <TouchableOpacity
                        key={tam.value}
                        onPress={() => {
                          setTamanho(tam.value);
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        className={`px-4 py-2 rounded-full ${
                          tamanho === tam.value
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            tamanho === tam.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {tam.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bloco/Ala */}
                <View>
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Bloco/Ala Associado
                  </Text>
                  <View className="gap-2">
                    <TouchableOpacity
                      onPress={() => setBlocoId("")}
                      className={`p-3 rounded-xl border ${
                        !blocoId
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border"
                      }`}
                    >
                      <Text className={`text-sm ${!blocoId ? "text-primary font-medium" : "text-foreground"}`}>
                        Nenhum (Item geral)
                      </Text>
                    </TouchableOpacity>
                    {blocos.map((bloco) => (
                      <TouchableOpacity
                        key={bloco.id}
                        onPress={() => setBlocoId(bloco.id)}
                        className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                          blocoId === bloco.id
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border"
                        }`}
                      >
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bloco.cor }}
                        />
                        <Text className={`text-sm flex-1 ${
                          blocoId === bloco.id ? "text-primary font-medium" : "text-foreground"
                        }`}>
                          {bloco.nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Campo: Localização */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Localização no Almoxarifado
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Ex: Prateleira A3, Caixa 5..."
                placeholderTextColor="#687076"
                value={localizacao}
                onChangeText={setLocalizacao}
                autoCapitalize="characters"
              />
            </View>

            {/* Espaço extra no final */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
