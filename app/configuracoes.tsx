import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useEscola } from "@/lib/escola-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CORES_PREDEFINIDAS } from "@/lib/types";

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { escola, updateEscola, resetConfig, isLoading } = useEscola();

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [logo, setLogo] = useState<string | undefined>();
  const [corPrimaria, setCorPrimaria] = useState("#FF6B35");
  const [corSecundaria, setCorSecundaria] = useState("#4ECDC4");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados existentes
  useEffect(() => {
    if (escola) {
      setNome(escola.nome || "");
      setNomeCompleto(escola.nomeCompleto || "");
      setLogo(escola.logo);
      setCorPrimaria(escola.corPrimaria || "#FF6B35");
      setCorSecundaria(escola.corSecundaria || "#4ECDC4");
      setCidade(escola.cidade || "");
      setBairro(escola.bairro || "");
      setTelefone(escola.telefone || "");
      setEmail(escola.email || "");
      setInstagram(escola.instagram || "");
    }
  }, [escola]);

  // Selecionar logo
  const handleSelectLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à galeria para selecionar a logo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLogo(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem.");
    }
  };

  // Remover logo
  const handleRemoveLogo = () => {
    setLogo(undefined);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Selecionar cor
  const handleSelectCor = (cor: string, tipo: "primaria" | "secundaria") => {
    if (tipo === "primaria") {
      setCorPrimaria(cor);
    } else {
      setCorSecundaria(cor);
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Salvar configurações
  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Digite o nome da escola de samba.");
      return;
    }

    setIsSaving(true);

    try {
      await updateEscola({
        nome: nome.trim(),
        nomeCompleto: nomeCompleto.trim() || undefined,
        logo,
        corPrimaria,
        corSecundaria,
        cidade: cidade.trim() || undefined,
        bairro: bairro.trim() || undefined,
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
        instagram: instagram.trim() || undefined,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Sucesso", "Configurações salvas com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  // Resetar configurações
  const handleReset = () => {
    Alert.alert(
      "Resetar Configurações",
      "Isso irá apagar todas as configurações da escola. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resetar",
          style: "destructive",
          onPress: async () => {
            try {
              await resetConfig();
              Alert.alert("Sucesso", "Configurações resetadas.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível resetar.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-lg">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-primary text-lg">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-xl font-bold">
            Configurações
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="p-2"
            style={{ opacity: isSaving ? 0.5 : 1 }}
            disabled={isSaving}
          >
            <Text className="text-primary text-lg font-semibold">
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-8">
            {/* Seção: Logo da Escola */}
            <View>
              <Text className="text-foreground text-xl font-bold mb-4">
                🎭 Logo da Escola
              </Text>
              <Text className="text-muted text-base mb-4">
                A logo aparecerá no topo do aplicativo e identificará sua escola.
              </Text>

              <View className="items-center">
                {logo ? (
                  <View className="items-center gap-4">
                    <View
                      className="w-32 h-32 rounded-2xl overflow-hidden border-4"
                      style={{ borderColor: corPrimaria }}
                    >
                      <Image
                        source={{ uri: logo }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={handleSelectLogo}
                        className="bg-primary px-5 py-3 rounded-xl"
                      >
                        <Text className="text-white font-semibold text-base">
                          Trocar Logo
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleRemoveLogo}
                        className="bg-error/20 px-5 py-3 rounded-xl"
                      >
                        <Text className="text-error font-semibold text-base">
                          Remover
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleSelectLogo}
                    className="w-32 h-32 rounded-2xl bg-surface border-2 border-dashed border-border items-center justify-center"
                  >
                    <Text className="text-4xl mb-2">📷</Text>
                    <Text className="text-muted text-sm text-center">
                      Adicionar{"\n"}Logo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Seção: Informações da Escola */}
            <View>
              <Text className="text-foreground text-xl font-bold mb-4">
                📋 Informações da Escola
              </Text>

              <View className="gap-4">
                <View>
                  <Text className="text-foreground text-base font-medium mb-2">
                    Nome da Escola *
                  </Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: Unidos do Samba"
                    placeholderTextColor="#687076"
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                  />
                </View>

                <View>
                  <Text className="text-foreground text-base font-medium mb-2">
                    Nome Completo (opcional)
                  </Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: Grêmio Recreativo Escola de Samba Unidos do Samba"
                    placeholderTextColor="#687076"
                    value={nomeCompleto}
                    onChangeText={setNomeCompleto}
                    autoCapitalize="words"
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-medium mb-2">
                      Cidade
                    </Text>
                    <TextInput
                      className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                      placeholder="Ex: Rio de Janeiro"
                      placeholderTextColor="#687076"
                      value={cidade}
                      onChangeText={setCidade}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-medium mb-2">
                      Bairro
                    </Text>
                    <TextInput
                      className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                      placeholder="Ex: Madureira"
                      placeholderTextColor="#687076"
                      value={bairro}
                      onChangeText={setBairro}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Seção: Cores da Escola */}
            <View>
              <Text className="text-foreground text-xl font-bold mb-4">
                🎨 Cores da Escola
              </Text>
              <Text className="text-muted text-base mb-4">
                Escolha as cores que representam sua escola. Elas serão aplicadas em todo o aplicativo.
              </Text>

              {/* Cor Primária */}
              <View className="mb-6">
                <Text className="text-foreground text-base font-medium mb-3">
                  Cor Primária (principal)
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {CORES_PREDEFINIDAS.map((item) => (
                    <TouchableOpacity
                      key={item.cor}
                      onPress={() => handleSelectCor(item.cor, "primaria")}
                      className={`w-14 h-14 rounded-xl items-center justify-center ${
                        corPrimaria === item.cor ? "border-4 border-foreground" : ""
                      }`}
                      style={{ backgroundColor: item.cor }}
                    >
                      {corPrimaria === item.cor && (
                        <Text className="text-white text-xl">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View
                  className="mt-3 p-4 rounded-xl"
                  style={{ backgroundColor: corPrimaria }}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    Cor Primária Selecionada
                  </Text>
                </View>
              </View>

              {/* Cor Secundária */}
              <View>
                <Text className="text-foreground text-base font-medium mb-3">
                  Cor Secundária (destaque)
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {CORES_PREDEFINIDAS.map((item) => (
                    <TouchableOpacity
                      key={item.cor}
                      onPress={() => handleSelectCor(item.cor, "secundaria")}
                      className={`w-14 h-14 rounded-xl items-center justify-center ${
                        corSecundaria === item.cor ? "border-4 border-foreground" : ""
                      }`}
                      style={{ backgroundColor: item.cor }}
                    >
                      {corSecundaria === item.cor && (
                        <Text className="text-white text-xl">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View
                  className="mt-3 p-4 rounded-xl"
                  style={{ backgroundColor: corSecundaria }}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    Cor Secundária Selecionada
                  </Text>
                </View>
              </View>
            </View>

            {/* Seção: Contato */}
            <View>
              <Text className="text-foreground text-xl font-bold mb-4">
                📞 Contato (opcional)
              </Text>

              <View className="gap-4">
                <View>
                  <Text className="text-foreground text-base font-medium mb-2">
                    Telefone
                  </Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="(21) 99999-9999"
                    placeholderTextColor="#687076"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text className="text-foreground text-base font-medium mb-2">
                    E-mail
                  </Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="contato@escola.com.br"
                    placeholderTextColor="#687076"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text className="text-foreground text-base font-medium mb-2">
                    Instagram
                  </Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="@suaescola"
                    placeholderTextColor="#687076"
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* Botão Resetar */}
            <View className="pt-4 pb-8">
              <TouchableOpacity
                onPress={handleReset}
                className="bg-error/10 p-4 rounded-xl"
              >
                <Text className="text-error text-center font-semibold text-lg">
                  Resetar Todas as Configurações
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
