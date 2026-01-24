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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CORES_PREDEFINIDAS } from "@/lib/types";

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { escola, updateEscola, resetConfig, isLoading } = useEscola();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

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
  const [isSelectingImage, setIsSelectingImage] = useState(false);

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
    setIsSelectingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showWarning(
          "Permissão necessária",
          "Precisamos de acesso à galeria para selecionar a logo."
        );
        setIsSelectingImage(false);
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
        showSuccess("Logo selecionada!", "Clique em Salvar para confirmar a alteração.");
      } else {
        showInfo("Seleção cancelada", "Nenhuma imagem foi selecionada.");
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      showError("Erro ao selecionar", "Não foi possível selecionar a imagem.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Remover logo
  const handleRemoveLogo = () => {
    setLogo(undefined);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    showInfo("Logo removida", "Clique em Salvar para confirmar a remoção.");
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
    showInfo(
      `Cor ${tipo === "primaria" ? "primária" : "secundária"} selecionada`,
      "Clique em Salvar para aplicar."
    );
  };

  // Salvar configurações
  const handleSave = async () => {
    if (!nome.trim()) {
      showWarning("Campo obrigatório", "Digite o nome da escola de samba.");
      return;
    }

    setIsSaving(true);
    showInfo("Salvando...", "Aguarde enquanto salvamos as configurações.");

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

      showSuccess(
        "Configurações salvas!",
        "Todas as alterações foram aplicadas com sucesso."
      );

      // Aguardar um pouco para o usuário ver a mensagem
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showError(
        "Erro ao salvar",
        "Não foi possível salvar as configurações. Tente novamente."
      );
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
              showSuccess("Configurações resetadas", "Todas as configurações foram removidas.");
            } catch (error) {
              showError("Erro ao resetar", "Não foi possível resetar as configurações.");
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
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-muted text-lg mt-4">Carregando configurações...</Text>
        </View>
      </ScreenContainer>
    );
  }

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

          <Text className="text-foreground text-xl font-bold">
            ⚙️ Configurações
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="px-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: isSaving ? "#ccc" : "#22C55E",
              opacity: isSaving ? 0.7 : 1 
            }}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white text-lg font-bold">Salvando...</Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-bold">✓ Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-8 pb-32">
            {/* Seção: Logo da Escola */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🎭 Logo da Escola
              </Text>
              <Text className="text-muted text-base mb-6">
                A logo aparecerá no topo do aplicativo e identificará sua escola.
              </Text>

              <View className="items-center">
                {logo ? (
                  <View className="items-center gap-4">
                    <View
                      className="w-36 h-36 rounded-2xl overflow-hidden border-4"
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
                        className="bg-primary px-6 py-4 rounded-xl flex-row items-center gap-2"
                        disabled={isSelectingImage}
                        activeOpacity={0.8}
                      >
                        {isSelectingImage ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-2xl">📷</Text>
                        )}
                        <Text className="text-white font-bold text-base">
                          {isSelectingImage ? "Abrindo..." : "Trocar Logo"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleRemoveLogo}
                        className="bg-error/20 px-6 py-4 rounded-xl flex-row items-center gap-2"
                        activeOpacity={0.8}
                      >
                        <Text className="text-2xl">🗑️</Text>
                        <Text className="text-error font-bold text-base">
                          Remover
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleSelectLogo}
                    className="w-36 h-36 rounded-2xl bg-background border-2 border-dashed border-border items-center justify-center"
                    disabled={isSelectingImage}
                    activeOpacity={0.8}
                  >
                    {isSelectingImage ? (
                      <ActivityIndicator size="large" color="#FF6B35" />
                    ) : (
                      <>
                        <Text className="text-5xl mb-2">📷</Text>
                        <Text className="text-muted text-base text-center font-medium">
                          Adicionar{"\n"}Logo
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Seção: Informações da Escola */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-6">
                📋 Informações da Escola
              </Text>

              <View className="gap-5">
                <View>
                  <Text className="text-foreground text-base font-bold mb-2">
                    Nome da Escola *
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: Unidos do Samba"
                    placeholderTextColor="#9BA1A6"
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                  />
                </View>

                <View>
                  <Text className="text-foreground text-base font-bold mb-2">
                    Nome Completo (opcional)
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: G.R.E.S. Unidos do Samba"
                    placeholderTextColor="#9BA1A6"
                    value={nomeCompleto}
                    onChangeText={setNomeCompleto}
                    autoCapitalize="words"
                  />
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-bold mb-2">
                      Cidade
                    </Text>
                    <TextInput
                      className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                      placeholder="Ex: Rio de Janeiro"
                      placeholderTextColor="#9BA1A6"
                      value={cidade}
                      onChangeText={setCidade}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-bold mb-2">
                      Bairro
                    </Text>
                    <TextInput
                      className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                      placeholder="Ex: Centro"
                      placeholderTextColor="#9BA1A6"
                      value={bairro}
                      onChangeText={setBairro}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-foreground text-base font-bold mb-2">
                    Telefone
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: (21) 99999-9999"
                    placeholderTextColor="#9BA1A6"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text className="text-foreground text-base font-bold mb-2">
                    E-mail
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: contato@escola.com.br"
                    placeholderTextColor="#9BA1A6"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text className="text-foreground text-base font-bold mb-2">
                    Instagram
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-4 text-foreground text-lg"
                    placeholder="Ex: @unidosdosamba"
                    placeholderTextColor="#9BA1A6"
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* Seção: Cores da Escola */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🎨 Cores da Escola
              </Text>
              <Text className="text-muted text-base mb-6">
                Escolha as cores que representam sua escola. Elas serão aplicadas em todo o aplicativo.
              </Text>

              {/* Cor Primária */}
              <View className="mb-6">
                <Text className="text-foreground text-base font-bold mb-3">
                  Cor Primária (principal)
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {CORES_PREDEFINIDAS.map((cor) => (
                    <TouchableOpacity
                      key={`primaria-${cor.cor}`}
                      onPress={() => handleSelectCor(cor.cor, "primaria")}
                      className={`w-14 h-14 rounded-xl items-center justify-center ${
                        corPrimaria === cor.cor ? "border-4 border-foreground" : "border-2 border-border"
                      }`}
                      style={{ backgroundColor: cor.cor }}
                      activeOpacity={0.8}
                    >
                      {corPrimaria === cor.cor && (
                        <Text className="text-white text-xl">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row items-center gap-3 mt-3">
                  <Text className="text-muted text-base">Selecionada:</Text>
                  <View
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: corPrimaria }}
                  />
                  <Text className="text-foreground font-mono text-base">{corPrimaria}</Text>
                </View>
              </View>

              {/* Cor Secundária */}
              <View>
                <Text className="text-foreground text-base font-bold mb-3">
                  Cor Secundária (destaque)
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {CORES_PREDEFINIDAS.map((cor) => (
                    <TouchableOpacity
                      key={`secundaria-${cor.cor}`}
                      onPress={() => handleSelectCor(cor.cor, "secundaria")}
                      className={`w-14 h-14 rounded-xl items-center justify-center ${
                        corSecundaria === cor.cor ? "border-4 border-foreground" : "border-2 border-border"
                      }`}
                      style={{ backgroundColor: cor.cor }}
                      activeOpacity={0.8}
                    >
                      {corSecundaria === cor.cor && (
                        <Text className="text-white text-xl">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row items-center gap-3 mt-3">
                  <Text className="text-muted text-base">Selecionada:</Text>
                  <View
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: corSecundaria }}
                  />
                  <Text className="text-foreground font-mono text-base">{corSecundaria}</Text>
                </View>
              </View>

              {/* Preview das Cores */}
              <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: corPrimaria }}>
                <Text className="text-white text-lg font-bold text-center mb-2">
                  Preview das Cores
                </Text>
                <View className="flex-row gap-2 justify-center">
                  <View
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: corSecundaria }}
                  >
                    <Text className="text-white font-semibold">Botão Secundário</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Seção: Gestão de Dados */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🗄️ Gestão de Dados
              </Text>
              <Text className="text-muted text-base mb-4">
                Gerencie os dados do aplicativo, carregue dados de exemplo ou limpe tudo.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/gestao-dados")}
                className="rounded-xl p-4 flex-row items-center gap-3"
                style={{ backgroundColor: corPrimaria }}
                activeOpacity={0.8}
              >
                <Text className="text-3xl">🗄️</Text>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">
                    Abrir Gestão de Dados
                  </Text>
                  <Text className="text-white/80 text-base">
                    Carregar dados de exemplo, limpar dados, etc.
                  </Text>
                </View>
                <Text className="text-white text-2xl">›</Text>
              </TouchableOpacity>
            </View>

            {/* Seção: Ações */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-4">
                ⚡ Ações
              </Text>

              <TouchableOpacity
                onPress={handleReset}
                className="bg-error/10 border border-error/30 rounded-xl p-4 flex-row items-center gap-3"
                activeOpacity={0.8}
              >
                <Text className="text-3xl">🗑️</Text>
                <View className="flex-1">
                  <Text className="text-error font-bold text-lg">
                    Resetar Configurações
                  </Text>
                  <Text className="text-error/70 text-base">
                    Remove todas as configurações da escola
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
