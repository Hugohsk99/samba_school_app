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

export default function IntegranteFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ blocoId?: string }>();
  const { blocos, addIntegrante } = useData();

  // Estado do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [blocosIds, setBlocosIds] = useState<string[]>(
    params.blocoId ? [params.blocoId] : []
  );
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = nome.trim().length > 0 && blocosIds.length > 0;

  // Toggle bloco selecionado
  const toggleBloco = (blocoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setBlocosIds((prev) => {
      if (prev.includes(blocoId)) {
        return prev.filter((id) => id !== blocoId);
      }
      return [...prev, blocoId];
    });
  };

  // Salvar integrante
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Erro", "Preencha o nome e selecione pelo menos um bloco.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addIntegrante({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        blocosIds,
      });

      router.back();
    } catch (error) {
      console.error("Erro ao salvar integrante:", error);
      Alert.alert("Erro", "Não foi possível salvar o integrante. Tente novamente.");
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
            Novo Integrante
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
                Nome Completo *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Nome do integrante"
                placeholderTextColor="#687076"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Telefone */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                Telefone
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="(00) 00000-0000"
                placeholderTextColor="#687076"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            {/* Campo: Email */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-2">
                E-mail
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="email@exemplo.com"
                placeholderTextColor="#687076"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>

            {/* Campo: Blocos */}
            <View>
              <Text className="text-foreground text-sm font-medium mb-3">
                Blocos *
              </Text>
              <Text className="text-muted text-xs mb-3">
                Selecione os blocos que o integrante participa
              </Text>
              
              {blocos.length === 0 ? (
                <View className="bg-surface border border-border rounded-xl p-4 items-center">
                  <Text className="text-muted text-center">
                    Nenhum bloco cadastrado. Cadastre um bloco primeiro.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {blocos.map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => toggleBloco(bloco.id)}
                      className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                        blocosIds.includes(bloco.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      {/* Checkbox */}
                      <View
                        className={`w-6 h-6 rounded-md items-center justify-center ${
                          blocosIds.includes(bloco.id)
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                      >
                        {blocosIds.includes(bloco.id) && (
                          <Text className="text-white text-sm font-bold">✓</Text>
                        )}
                      </View>

                      {/* Cor do bloco */}
                      <View
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: bloco.cor }}
                      />

                      {/* Nome do bloco */}
                      <Text className="text-foreground text-base font-medium flex-1">
                        {bloco.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
