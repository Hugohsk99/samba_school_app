/**
 * Formulário de Material/Fantasia
 * Com feedback visual e design consistente
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import * as Haptics from "expo-haptics";
import { CATEGORIAS_MATERIAL, TAMANHOS_FANTASIA } from "@/lib/types";
import type { Material, TamanhoFantasia } from "@/lib/types";

export default function MaterialFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { materiais, blocos, addMaterial, updateMaterial } = useData();
  const { showSuccess, showError, showWarning } = useToast();
  const { escola } = useEscola();

  const isEditing = !!params.id;
  const materialExistente = isEditing ? materiais.find(m => m.id === params.id) : null;

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

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
    if (!nome.trim()) {
      showError("Erro", "Informe o nome do item.");
      return;
    }

    if (!parseInt(quantidadeNecessaria) || parseInt(quantidadeNecessaria) <= 0) {
      showError("Erro", "A quantidade necessária deve ser maior que zero.");
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
        showSuccess("Atualizado!", "Item atualizado com sucesso.");
      } else {
        await addMaterial(materialData);
        showSuccess("Cadastrado!", `${nome} foi adicionado ao almoxarifado.`);
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar material:", error);
      showError("Erro", "Não foi possível salvar o item. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-3 py-2 rounded-xl bg-background"
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-base font-medium">← Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-bold">
            {isEditing ? "✏️ Editar Item" : "📦 Novo Item"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="px-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: isValid && !isSaving ? corPrimaria : "#ccc",
              opacity: isValid && !isSaving ? 1 : 0.6 
            }}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">
              {isSaving ? "..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-6">
            {/* Campo: Nome */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-foreground text-base font-semibold">
                  Nome do Item
                </Text>
                <Text className="text-error">*</Text>
              </View>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Ex: Fantasia Ala das Baianas, Surdo..."
                placeholderTextColor="#9BA1A6"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Categoria */}
            <View>
              <Text className="text-foreground text-base font-semibold mb-3">
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
                    className={`px-5 py-3 rounded-xl ${
                      categoria === cat.value
                        ? ""
                        : "bg-surface border border-border"
                    }`}
                    style={categoria === cat.value ? { backgroundColor: corPrimaria } : {}}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-base font-semibold ${
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
              <Text className="text-foreground text-base font-semibold mb-2">
                📝 Descrição
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Detalhes sobre o item"
                placeholderTextColor="#9BA1A6"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={2}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Seção: Quantidades */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-lg font-bold mb-4">
                📊 Controle de Estoque
              </Text>

              <View className="flex-row gap-3">
                {/* Quantidade Necessária */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-1 mb-2">
                    <Text className="text-foreground text-sm font-medium">
                      Necessário
                    </Text>
                    <Text className="text-error">*</Text>
                  </View>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg text-center font-bold"
                    placeholder="0"
                    placeholderTextColor="#9BA1A6"
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
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg text-center font-bold"
                    placeholder="0"
                    placeholderTextColor="#9BA1A6"
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
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg text-center font-bold"
                    placeholder="0"
                    placeholderTextColor="#9BA1A6"
                    value={quantidadeEmUso}
                    onChangeText={setQuantidadeEmUso}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Campos específicos para Fantasia */}
            {categoria === 'fantasia' && (
              <View className="bg-surface rounded-2xl p-5 border border-border">
                <Text className="text-foreground text-lg font-bold mb-4">
                  👗 Detalhes da Fantasia
                </Text>

                {/* Tamanho */}
                <View className="mb-4">
                  <Text className="text-foreground text-base font-semibold mb-3">
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
                        className={`px-5 py-3 rounded-xl ${
                          tamanho === tam.value
                            ? ""
                            : "bg-background border border-border"
                        }`}
                        style={tamanho === tam.value ? { backgroundColor: corPrimaria } : {}}
                        activeOpacity={0.8}
                      >
                        <Text
                          className={`text-base font-semibold ${
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
                  <Text className="text-foreground text-base font-semibold mb-3">
                    Bloco/Ala Associado
                  </Text>
                  <View className="gap-2">
                    <TouchableOpacity
                      onPress={() => setBlocoId("")}
                      className={`p-4 rounded-xl border ${
                        !blocoId
                          ? "border-2"
                          : "bg-background border-border"
                      }`}
                      style={!blocoId ? { 
                        backgroundColor: corPrimaria + "15",
                        borderColor: corPrimaria 
                      } : {}}
                      activeOpacity={0.8}
                    >
                      <Text className={`text-base font-medium ${!blocoId ? "text-primary" : "text-foreground"}`}>
                        Nenhum (Item geral)
                      </Text>
                    </TouchableOpacity>
                    {blocos.map((bloco) => (
                      <TouchableOpacity
                        key={bloco.id}
                        onPress={() => setBlocoId(bloco.id)}
                        className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                          blocoId === bloco.id
                            ? "border-2"
                            : "bg-background border-border"
                        }`}
                        style={blocoId === bloco.id ? { 
                          backgroundColor: corPrimaria + "15",
                          borderColor: corPrimaria 
                        } : {}}
                        activeOpacity={0.8}
                      >
                        <View
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: bloco.cor || corPrimaria }}
                        />
                        <Text className={`text-base font-medium flex-1 ${
                          blocoId === bloco.id ? "text-primary" : "text-foreground"
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
              <Text className="text-foreground text-base font-semibold mb-2">
                📍 Localização no Almoxarifado
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                placeholder="Ex: Prateleira A3, Caixa 5..."
                placeholderTextColor="#9BA1A6"
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
