import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaskedInput, TextInputWithCounter } from "@/components/masked-input";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import type { 
  CategoriaIntegrante, 
  TipoDesfilante, 
  TipoSegmento, 
  CargoDiretoria 
} from "@/lib/types";
import {
  CATEGORIAS_INTEGRANTE,
  TIPOS_DESFILANTE,
  TIPOS_SEGMENTO,
  CARGOS_DIRETORIA,
} from "@/lib/types";

export default function IntegranteFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ blocoId?: string }>();
  const { blocos, addIntegrante } = useData();
  const { showSuccess, showError, showWarning } = useToast();

  // Estado do formulário - Dados básicos
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState<string | undefined>();
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  
  // Estado - Endereço
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  
  // Estado - Categorização
  const [categoria, setCategoria] = useState<CategoriaIntegrante>("desfilante");
  const [tipoDesfilante, setTipoDesfilante] = useState<TipoDesfilante>("ala_comunidade");
  const [tipoSegmento, setTipoSegmento] = useState<TipoSegmento>("bateria");
  const [cargoDiretoria, setCargoDiretoria] = useState<CargoDiretoria>("staff");
  
  // Estado - Associações
  const [blocosIds, setBlocosIds] = useState<string[]>(
    params.blocoId ? [params.blocoId] : []
  );
  
  // Estado - Contato de emergência
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
  
  // Estado - Controle
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingImage, setIsSelectingImage] = useState(false);

  // Validação
  const isValid = nome.trim().length > 0;

  // Selecionar foto
  const handleSelectFoto = async () => {
    setIsSelectingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showWarning("Permissão necessária", "Permita acesso à galeria para selecionar foto.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFoto(result.assets[0].uri);
        showSuccess("Foto selecionada", "A foto foi adicionada com sucesso.");
      }
    } catch (error) {
      showError("Erro", "Não foi possível selecionar a foto.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Tirar foto com câmera
  const handleTakeFoto = async () => {
    // Verificar se estamos na web (câmera não funciona na web)
    if (Platform.OS === "web") {
      showWarning(
        "Câmera indisponível", 
        "A câmera não está disponível na versão web. Por favor, use a opção Galeria ou teste no aplicativo Expo Go no seu celular."
      );
      return;
    }

    setIsSelectingImage(true);
    try {
      // Solicitar permissão da câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        showWarning(
          "Permissão necessária", 
          "Para tirar fotos, você precisa permitir o acesso à câmera nas configurações do seu dispositivo."
        );
        setIsSelectingImage(false);
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front, // Câmera frontal para selfie
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFoto(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess("Foto capturada!", "A foto foi adicionada com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao capturar foto:", error);
      showError(
        "Erro ao abrir câmera", 
        "Não foi possível acessar a câmera. Verifique as permissões do aplicativo."
      );
    } finally {
      setIsSelectingImage(false);
    }
  };

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
      showWarning("Campo obrigatório", "Preencha o nome do integrante.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addIntegrante({
        nome: nome.trim(),
        foto,
        cpf: cpf.replace(/\D/g, "") || undefined,
        rg: rg.trim() || undefined,
        dataNascimento: dataNascimento || undefined,
        telefone: telefone.trim(),
        email: email.trim(),
        cep: cep.replace(/\D/g, "") || undefined,
        endereco: endereco.trim() || undefined,
        bairro: bairro.trim() || undefined,
        cidade: cidade.trim() || undefined,
        categoria,
        tipoDesfilante: categoria === "desfilante" ? tipoDesfilante : undefined,
        tipoSegmento: categoria === "segmento" ? tipoSegmento : undefined,
        cargoDiretoria: categoria === "diretoria" ? cargoDiretoria : undefined,
        blocosIds,
        contatoEmergenciaNome: contatoEmergenciaNome.trim() || undefined,
        contatoEmergenciaTelefone: contatoEmergenciaTelefone.trim() || undefined,
        ativo: true,
      });

      showSuccess("Integrante cadastrado", `${nome} foi adicionado com sucesso!`);
      router.back();
    } catch (error) {
      console.error("Erro ao salvar integrante:", error);
      showError("Erro ao salvar", "Não foi possível salvar o integrante. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center px-3 py-2 rounded-xl bg-background"
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-lg font-medium">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-xl font-bold">
            👤 Novo Integrante
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="px-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: isValid && !isSaving ? "#22C55E" : "#ccc",
              opacity: isValid && !isSaving ? 1 : 0.7 
            }}
            disabled={!isValid || isSaving}
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

        {/* Formulário */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 gap-6 pb-32">
            
            {/* Seção: Foto */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                📷 Foto do Integrante
              </Text>
              <Text className="text-muted text-base mb-4">
                A foto aparecerá na carteirinha digital e no QR Code.
              </Text>

              <View className="items-center">
                {foto ? (
                  <View className="items-center gap-4">
                    <View className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
                      <Image
                        source={{ uri: foto }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={handleSelectFoto}
                        className="bg-primary px-4 py-3 rounded-xl flex-row items-center gap-2"
                        disabled={isSelectingImage}
                        activeOpacity={0.8}
                      >
                        <Text className="text-xl">🖼️</Text>
                        <Text className="text-white font-bold">Galeria</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleTakeFoto}
                        className="bg-primary px-4 py-3 rounded-xl flex-row items-center gap-2"
                        disabled={isSelectingImage}
                        activeOpacity={0.8}
                      >
                        <Text className="text-xl">📸</Text>
                        <Text className="text-white font-bold">Câmera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFoto(undefined)}
                        className="bg-error/20 px-4 py-3 rounded-xl"
                        activeOpacity={0.8}
                      >
                        <Text className="text-error text-xl">🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="items-center gap-4">
                    <View className="w-32 h-32 rounded-full bg-muted/30 items-center justify-center border-2 border-dashed border-muted">
                      <Text className="text-5xl">👤</Text>
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={handleSelectFoto}
                        className="bg-primary px-5 py-3 rounded-xl flex-row items-center gap-2"
                        disabled={isSelectingImage}
                        activeOpacity={0.8}
                      >
                        {isSelectingImage ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-xl">🖼️</Text>
                        )}
                        <Text className="text-white font-bold">Galeria</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleTakeFoto}
                        className="bg-primary px-5 py-3 rounded-xl flex-row items-center gap-2"
                        disabled={isSelectingImage}
                        activeOpacity={0.8}
                      >
                        <Text className="text-xl">📸</Text>
                        <Text className="text-white font-bold">Câmera</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Seção: Dados Pessoais */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                📋 Dados Pessoais
              </Text>
              <Text className="text-muted text-base mb-4">
                Informações básicas do integrante.
              </Text>
              
              <TextInputWithCounter
                label="Nome Completo"
                value={nome}
                onChangeText={setNome}
                placeholder="Digite o nome completo"
                maxLength={100}
                required
                helpText="Digite o nome completo do integrante como aparece no documento."
              />

              <MaskedInput
                label="CPF"
                value={cpf}
                onChangeText={setCpf}
                maskType="cpf"
                helpText="Digite os 11 dígitos do CPF. Será usado para identificação única."
              />

              <TextInputWithCounter
                label="RG"
                value={rg}
                onChangeText={setRg}
                placeholder="Digite o RG"
                maxLength={20}
                helpText="Digite o número do RG com o órgão emissor."
              />

              <MaskedInput
                label="Data de Nascimento"
                value={dataNascimento}
                onChangeText={setDataNascimento}
                maskType="data"
                helpText="Digite a data de nascimento no formato DD/MM/AAAA."
              />
            </View>

            {/* Seção: Contato */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                📱 Contato
              </Text>
              <Text className="text-muted text-base mb-4">
                Informações para contato com o integrante.
              </Text>

              <MaskedInput
                label="Telefone/WhatsApp"
                value={telefone}
                onChangeText={setTelefone}
                maskType="telefone"
                helpText="Digite o número com DDD. Ex: (11) 99999-9999"
              />

              <MaskedInput
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                maskType="email"
                helpText="Digite um e-mail válido para comunicações da escola."
              />
            </View>

            {/* Seção: Endereço */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🏠 Endereço
              </Text>
              <Text className="text-muted text-base mb-4">
                Endereço residencial do integrante.
              </Text>

              <MaskedInput
                label="CEP"
                value={cep}
                onChangeText={setCep}
                maskType="cep"
                helpText="Digite os 8 dígitos do CEP."
              />

              <TextInputWithCounter
                label="Endereço"
                value={endereco}
                onChangeText={setEndereco}
                placeholder="Rua, número, complemento"
                maxLength={150}
                helpText="Digite o endereço completo com número e complemento."
              />

              <TextInputWithCounter
                label="Bairro"
                value={bairro}
                onChangeText={setBairro}
                placeholder="Nome do bairro"
                maxLength={50}
              />

              <TextInputWithCounter
                label="Cidade"
                value={cidade}
                onChangeText={setCidade}
                placeholder="Nome da cidade"
                maxLength={50}
              />
            </View>

            {/* Seção: Categorização */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🏷️ Categorização
              </Text>
              <Text className="text-muted text-base mb-4">
                Define o tipo de participação e nível de acesso no app.
              </Text>
              
              {/* Campo: Categoria */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-foreground text-base font-semibold">
                    Categoria
                  </Text>
                  <Text className="text-error text-lg">*</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Categorias",
                        "• Desfilante: Participa do desfile em alas\n• Segmento: Faz parte de grupo específico (Bateria, Passistas, etc.)\n• Diretoria/Staff: Equipe administrativa com acesso privilegiado"
                      );
                    }}
                    className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center"
                  >
                    <Text className="text-primary text-sm font-bold">?</Text>
                  </TouchableOpacity>
                </View>
                <View className="gap-3">
                  {CATEGORIAS_INTEGRANTE.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => {
                        setCategoria(cat.value);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 ${
                        categoria === cat.value
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border"
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center gap-3">
                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          categoria === cat.value ? "border-primary bg-primary" : "border-muted"
                        }`}>
                          {categoria === cat.value && (
                            <Text className="text-white text-sm">✓</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`text-lg font-semibold ${
                            categoria === cat.value ? "text-primary" : "text-foreground"
                          }`}>
                            {cat.label}
                          </Text>
                          <Text className="text-muted text-sm">
                            {cat.value === "desfilante" && "Participa do desfile em alas"}
                            {cat.value === "segmento" && "Bateria, Passistas, Baianas, etc."}
                            {cat.value === "diretoria" && "Acesso administrativo completo"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Subcategoria: Desfilante */}
              {categoria === "desfilante" && (
                <View className="mb-4">
                  <Text className="text-foreground text-base font-semibold mb-3">
                    Tipo de Desfilante
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {TIPOS_DESFILANTE.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.value}
                        onPress={() => {
                          setTipoDesfilante(tipo.value);
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        className={`px-4 py-3 rounded-xl ${
                          tipoDesfilante === tipo.value
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text
                          className={`text-base font-medium ${
                            tipoDesfilante === tipo.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Subcategoria: Segmento */}
              {categoria === "segmento" && (
                <View className="mb-4">
                  <Text className="text-foreground text-base font-semibold mb-3">
                    Tipo de Segmento
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {TIPOS_SEGMENTO.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.value}
                        onPress={() => {
                          setTipoSegmento(tipo.value);
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        className={`px-4 py-3 rounded-xl ${
                          tipoSegmento === tipo.value
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text
                          className={`text-base font-medium ${
                            tipoSegmento === tipo.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Subcategoria: Diretoria */}
              {categoria === "diretoria" && (
                <View className="mb-4">
                  <Text className="text-foreground text-base font-semibold mb-3">
                    Cargo na Diretoria
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {CARGOS_DIRETORIA.map((cargo) => (
                      <TouchableOpacity
                        key={cargo.value}
                        onPress={() => {
                          setCargoDiretoria(cargo.value);
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        className={`px-4 py-3 rounded-xl ${
                          cargoDiretoria === cargo.value
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text
                          className={`text-base font-medium ${
                            cargoDiretoria === cargo.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {cargo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Seção: Blocos */}
            {blocos.length > 0 && (
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-foreground text-xl font-bold mb-2">
                  🎪 Blocos/Alas
                </Text>
                <Text className="text-muted text-base mb-4">
                  Selecione os blocos que o integrante participa.
                </Text>
                
                <View className="gap-2">
                  {blocos.map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => toggleBloco(bloco.id)}
                      className={`p-4 rounded-xl border-2 flex-row items-center gap-3 ${
                        blocosIds.includes(bloco.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border"
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className={`w-6 h-6 rounded border-2 items-center justify-center ${
                        blocosIds.includes(bloco.id) ? "border-primary bg-primary" : "border-muted"
                      }`}>
                        {blocosIds.includes(bloco.id) && (
                          <Text className="text-white text-sm">✓</Text>
                        )}
                      </View>
                      <Text className={`text-lg ${
                        blocosIds.includes(bloco.id) ? "text-primary font-semibold" : "text-foreground"
                      }`}>
                        {bloco.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Seção: Contato de Emergência */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-foreground text-xl font-bold mb-2">
                🆘 Contato de Emergência
              </Text>
              <Text className="text-muted text-base mb-4">
                Pessoa para contato em caso de emergência.
              </Text>

              <TextInputWithCounter
                label="Nome do Contato"
                value={contatoEmergenciaNome}
                onChangeText={setContatoEmergenciaNome}
                placeholder="Nome da pessoa"
                maxLength={100}
                helpText="Nome da pessoa para contato em emergências."
              />

              <MaskedInput
                label="Telefone de Emergência"
                value={contatoEmergenciaTelefone}
                onChangeText={setContatoEmergenciaTelefone}
                maskType="telefone"
                helpText="Telefone para contato em caso de emergência."
              />
            </View>

          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
