/**
 * Tela 03 - Cadastro de Integrante (Auto-cadastro)
 * Formulário completo com upload de comprovante PIX
 * Após cadastro, fica pendente de aprovação pela diretoria
 */

import { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

const STATUS_CADASTRO_KEY = "@samba_status_cadastro";
const SENHAS_SALVAS_KEY = "@samba_senhas_usuarios";

// Formatação de CPF
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Formatação de telefone
function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Dados PIX da escola (Estácio S.A.)
const DADOS_PIX = {
  chave: "100anosgestaodosamba@gmail.com",
  valor: "R$ 10,00",
  beneficiario: "100 Anos - Gestão do Samba",
  descricao: "Anuidade - Integrante",
};

interface FormData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  senha: string;
  confirmarSenha: string;
  comprovantePix: string | null;
  alaPreferencia: string;
  observacoes: string;
}

export default function CadastroIntegranteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cpf?: string }>();
  const colors = useColors();
  const { addIntegrante, blocos } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const corPrimaria = escola?.corPrimaria || colors.primary;

  const [step, setStep] = useState(1); // 1: Dados, 2: Contato, 3: PIX, 4: Senha
  const [isLoading, setIsLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    nome: "",
    cpf: params.cpf ? formatCPF(params.cpf) : "",
    telefone: "",
    email: "",
    dataNascimento: "",
    endereco: "",
    bairro: "",
    cidade: "",
    cep: "",
    contatoEmergenciaNome: "",
    contatoEmergenciaTelefone: "",
    senha: "",
    confirmarSenha: "",
    comprovantePix: null,
    alaPreferencia: "",
    observacoes: "",
  });

  const updateForm = (field: keyof FormData, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErros((prev) => ({ ...prev, [field]: "" }));
  };

  // Selecionar imagem do comprovante
  const handleSelecionarComprovante = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showWarning("Permissão necessária", "Permita o acesso à galeria para enviar o comprovante.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateForm("comprovantePix", result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      showError("Erro", "Não foi possível selecionar a imagem.");
    }
  };

  // Tirar foto do comprovante
  const handleTirarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showWarning("Permissão necessária", "Permita o acesso à câmera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateForm("comprovantePix", result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      showError("Erro", "Não foi possível tirar a foto.");
    }
  };

  // Validação por step
  const validarStep = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (step === 1) {
      if (!form.nome.trim()) novosErros.nome = "Nome é obrigatório";
      const cpfLimpo = form.cpf.replace(/\D/g, "");
      if (!cpfLimpo || cpfLimpo.length < 11) novosErros.cpf = "CPF completo é obrigatório";
      if (!form.telefone.trim()) novosErros.telefone = "Telefone é obrigatório";
    }

    if (step === 2) {
      // Contato de emergência e endereço são opcionais mas recomendados
    }

    if (step === 3) {
      // Comprovante PIX é obrigatório
      if (!form.comprovantePix) novosErros.comprovantePix = "Envie o comprovante de pagamento PIX";
    }

    if (step === 4) {
      if (!form.senha.trim()) novosErros.senha = "Crie uma senha";
      if (form.senha.length < 4) novosErros.senha = "Mínimo 4 caracteres";
      if (form.senha !== form.confirmarSenha) novosErros.confirmarSenha = "Senhas não conferem";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Avançar step
  const handleProximo = () => {
    if (!validarStep()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleCadastrar();
    }
  };

  // Cadastrar
  const handleCadastrar = async () => {
    if (!validarStep()) return;

    setIsLoading(true);

    try {
      const cpfLimpo = form.cpf.replace(/\D/g, "");

      // Salvar cadastro como pendente
      const cadastroPendente = {
        ...form,
        cpf: cpfLimpo,
        status: "pendente",
        dataCadastro: new Date().toISOString(),
        escolaId: escola?.id || "estacio-sa",
      };

      await AsyncStorage.setItem(
        `${STATUS_CADASTRO_KEY}_${cpfLimpo}`,
        JSON.stringify(cadastroPendente)
      );

      // Salvar senha
      const senhasSalvas = await AsyncStorage.getItem(SENHAS_SALVAS_KEY);
      const senhas = senhasSalvas ? JSON.parse(senhasSalvas) : {};
      senhas[cpfLimpo] = form.senha;
      await AsyncStorage.setItem(SENHAS_SALVAS_KEY, JSON.stringify(senhas));

      // Adicionar como integrante com status pendente
      const novoIntegrante = {
        nome: form.nome,
        telefone: form.telefone.replace(/\D/g, ""),
        email: form.email,
        cpf: cpfLimpo,
        dataNascimento: form.dataNascimento,
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        cep: form.cep,
        contatoEmergenciaNome: form.contatoEmergenciaNome,
        contatoEmergenciaTelefone: form.contatoEmergenciaTelefone,
        categoria: "desfilante" as const,
        tipoDesfilante: "ala_comunidade" as const,
        blocosIds: [] as string[],
        ativo: false, // Pendente de aprovação
        observacoes: `Cadastro pendente de aprovação. Comprovante PIX enviado. ${form.observacoes}`,
        foto: form.comprovantePix || undefined,
      };

      addIntegrante(novoIntegrante);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess(
        "Cadastro enviado!",
        "Seu cadastro foi enviado para aprovação da diretoria."
      );

      // Redirecionar para tela de status
      router.replace({
        pathname: "/status-cadastro" as any,
        params: { cpf: cpfLimpo },
      });
    } catch (error) {
      showError("Erro", "Não foi possível completar o cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  // Indicador de progresso
  const renderProgress = () => (
    <View className="flex-row items-center justify-center px-6 py-4">
      {[1, 2, 3, 4].map((s) => (
        <View key={s} className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{
              backgroundColor: s <= step ? corPrimaria : colors.surface,
              borderWidth: s === step ? 2 : 1,
              borderColor: s <= step ? corPrimaria : colors.border,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: s <= step ? "#FFF" : colors.muted }}
            >
              {s}
            </Text>
          </View>
          {s < 4 && (
            <View
              className="w-8 h-0.5"
              style={{
                backgroundColor: s < step ? corPrimaria : colors.border,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );

  // Labels dos steps
  const stepLabels = ["Dados Pessoais", "Endereço e Contato", "Pagamento PIX", "Criar Senha"];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => {
              if (step > 1) setStep(step - 1);
              else router.back();
            }}
            activeOpacity={0.7}
            className="mr-3 p-2"
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-lg font-bold">
              Cadastro de Integrante
            </Text>
            <Text className="text-muted text-xs">
              Passo {step} de 4 - {stepLabels[step - 1]}
            </Text>
          </View>
        </View>

        {/* Progress */}
        {renderProgress()}

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <View className="px-6 pt-4">
              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Nome Completo *
                </Text>
                <TextInput
                  value={form.nome}
                  onChangeText={(t) => updateForm("nome", t)}
                  placeholder="Seu nome completo"
                  placeholderTextColor={colors.muted}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  style={erros.nome ? { borderColor: colors.error } : undefined}
                />
                {erros.nome ? <Text className="text-error text-xs mt-1">{erros.nome}</Text> : null}
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  CPF *
                </Text>
                <TextInput
                  value={form.cpf}
                  onChangeText={(t) => updateForm("cpf", formatCPF(t))}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={14}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  style={erros.cpf ? { borderColor: colors.error } : undefined}
                />
                {erros.cpf ? <Text className="text-error text-xs mt-1">{erros.cpf}</Text> : null}
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Telefone / WhatsApp *
                </Text>
                <TextInput
                  value={form.telefone}
                  onChangeText={(t) => updateForm("telefone", formatTelefone(t))}
                  placeholder="(21) 99999-9999"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  maxLength={15}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  style={erros.telefone ? { borderColor: colors.error } : undefined}
                />
                {erros.telefone ? <Text className="text-error text-xs mt-1">{erros.telefone}</Text> : null}
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  E-mail
                </Text>
                <TextInput
                  value={form.email}
                  onChangeText={(t) => updateForm("email", t)}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Data de Nascimento
                </Text>
                <TextInput
                  value={form.dataNascimento}
                  onChangeText={(t) => updateForm("dataNascimento", t)}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={10}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>
            </View>
          )}

          {/* Step 2: Endereço e Contato de Emergência */}
          {step === 2 && (
            <View className="px-6 pt-4">
              <Text className="text-foreground text-base font-semibold mb-3">
                Endereço
              </Text>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">CEP</Text>
                <TextInput
                  value={form.cep}
                  onChangeText={(t) => updateForm("cep", t)}
                  placeholder="00000-000"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={9}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">Endereço</Text>
                <TextInput
                  value={form.endereco}
                  onChangeText={(t) => updateForm("endereco", t)}
                  placeholder="Rua, número, complemento"
                  placeholderTextColor={colors.muted}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold mb-1">Bairro</Text>
                  <TextInput
                    value={form.bairro}
                    onChangeText={(t) => updateForm("bairro", t)}
                    placeholder="Bairro"
                    placeholderTextColor={colors.muted}
                    className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold mb-1">Cidade</Text>
                  <TextInput
                    value={form.cidade}
                    onChangeText={(t) => updateForm("cidade", t)}
                    placeholder="Cidade"
                    placeholderTextColor={colors.muted}
                    className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  />
                </View>
              </View>

              <View className="h-px bg-border my-4" />

              <Text className="text-foreground text-base font-semibold mb-3">
                Contato de Emergência
              </Text>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Nome do Contato
                </Text>
                <TextInput
                  value={form.contatoEmergenciaNome}
                  onChangeText={(t) => updateForm("contatoEmergenciaNome", t)}
                  placeholder="Nome do familiar/amigo"
                  placeholderTextColor={colors.muted}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Telefone do Contato
                </Text>
                <TextInput
                  value={form.contatoEmergenciaTelefone}
                  onChangeText={(t) => updateForm("contatoEmergenciaTelefone", formatTelefone(t))}
                  placeholder="(21) 99999-9999"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  maxLength={15}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Preferência de Ala/Segmento
                </Text>
                <TextInput
                  value={form.alaPreferencia}
                  onChangeText={(t) => updateForm("alaPreferencia", t)}
                  placeholder="Ex: Bateria, Passistas, Ala Comercial..."
                  placeholderTextColor={colors.muted}
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                />
              </View>
            </View>
          )}

          {/* Step 3: Pagamento PIX */}
          {step === 3 && (
            <View className="px-6 pt-4">
              {/* Informações PIX */}
              <View
                className="rounded-2xl p-5 mb-6"
                style={{ backgroundColor: corPrimaria + "10" }}
              >
                <Text className="text-foreground text-lg font-bold mb-3 text-center">
                  Pagamento via PIX
                </Text>
                <Text className="text-muted text-sm text-center mb-4">
                  Para concluir seu cadastro, realize o pagamento da anuidade via PIX
                  e envie o comprovante abaixo.
                </Text>

                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="mb-3">
                    <Text className="text-muted text-xs">Chave PIX (E-mail)</Text>
                    <Text className="text-foreground text-base font-semibold" selectable>
                      {DADOS_PIX.chave}
                    </Text>
                  </View>
                  <View className="mb-3">
                    <Text className="text-muted text-xs">Valor</Text>
                    <Text className="text-foreground text-xl font-bold" style={{ color: corPrimaria }}>
                      {DADOS_PIX.valor}
                    </Text>
                  </View>
                  <View className="mb-3">
                    <Text className="text-muted text-xs">Beneficiário</Text>
                    <Text className="text-foreground text-sm font-medium">
                      {DADOS_PIX.beneficiario}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-muted text-xs">Descrição</Text>
                    <Text className="text-foreground text-sm">
                      {DADOS_PIX.descricao}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Upload do comprovante */}
              <Text className="text-foreground text-base font-semibold mb-3">
                Comprovante de Pagamento *
              </Text>

              {form.comprovantePix ? (
                <View className="mb-4">
                  <Image
                    source={{ uri: form.comprovantePix }}
                    className="w-full rounded-xl"
                    style={{ height: 200 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => updateForm("comprovantePix", null)}
                    activeOpacity={0.7}
                    className="mt-2 items-center py-2"
                  >
                    <Text className="text-error text-sm font-medium">
                      Remover comprovante
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mb-4">
                  <TouchableOpacity
                    onPress={handleSelecionarComprovante}
                    activeOpacity={0.7}
                    className="rounded-xl py-4 items-center border-2 mb-3"
                    style={{
                      borderColor: erros.comprovantePix ? colors.error : colors.border,
                      borderStyle: "dashed",
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Text className="text-3xl mb-2">📎</Text>
                    <Text className="text-foreground text-sm font-medium">
                      Selecionar da Galeria
                    </Text>
                    <Text className="text-muted text-xs mt-1">
                      Escolha a imagem do comprovante
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleTirarFoto}
                    activeOpacity={0.7}
                    className="rounded-xl py-3 items-center border border-border"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Text className="text-foreground text-sm font-medium">
                      📷 Tirar Foto do Comprovante
                    </Text>
                  </TouchableOpacity>

                  {erros.comprovantePix ? (
                    <Text className="text-error text-xs mt-2">{erros.comprovantePix}</Text>
                  ) : null}
                </View>
              )}

              {/* Observações */}
              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Observações (opcional)
                </Text>
                <TextInput
                  value={form.observacoes}
                  onChangeText={(t) => updateForm("observacoes", t)}
                  placeholder="Alguma informação adicional..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  style={{ minHeight: 80 }}
                />
              </View>
            </View>
          )}

          {/* Step 4: Criar Senha */}
          {step === 4 && (
            <View className="px-6 pt-4">
              <View
                className="rounded-2xl p-5 mb-6"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-foreground text-base font-semibold mb-2">
                  Crie sua senha de acesso
                </Text>
                <Text className="text-muted text-sm leading-5">
                  Esta senha será usada para acessar o app. Guarde-a em um lugar seguro.
                  Você poderá usar seu CPF + senha para fazer login.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Senha *
                </Text>
                <TextInput
                  value={form.senha}
                  onChangeText={(t) => updateForm("senha", t)}
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  style={erros.senha ? { borderColor: colors.error } : undefined}
                />
                {erros.senha ? <Text className="text-error text-xs mt-1">{erros.senha}</Text> : null}
              </View>

              <View className="mb-6">
                <Text className="text-foreground text-sm font-semibold mb-1">
                  Confirmar Senha *
                </Text>
                <TextInput
                  value={form.confirmarSenha}
                  onChangeText={(t) => updateForm("confirmarSenha", t)}
                  placeholder="Repita a senha"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  returnKeyType="done"
                  className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                  style={erros.confirmarSenha ? { borderColor: colors.error } : undefined}
                />
                {erros.confirmarSenha ? (
                  <Text className="text-error text-xs mt-1">{erros.confirmarSenha}</Text>
                ) : null}
              </View>

              {/* Resumo */}
              <View className="rounded-xl p-4 border border-border mb-4" style={{ backgroundColor: colors.surface }}>
                <Text className="text-foreground text-sm font-semibold mb-2">
                  Resumo do Cadastro
                </Text>
                <Text className="text-muted text-sm">Nome: {form.nome}</Text>
                <Text className="text-muted text-sm">CPF: {form.cpf}</Text>
                <Text className="text-muted text-sm">Telefone: {form.telefone}</Text>
                {form.email ? <Text className="text-muted text-sm">E-mail: {form.email}</Text> : null}
                <Text className="text-muted text-sm mt-1">
                  Comprovante PIX: {form.comprovantePix ? "Enviado ✓" : "Não enviado ✗"}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Botões de navegação */}
        <View className="px-6 pb-6 pt-3 border-t border-border">
          <TouchableOpacity
            onPress={handleProximo}
            disabled={isLoading}
            activeOpacity={0.8}
            className="rounded-xl py-4 items-center"
            style={{
              backgroundColor: isLoading ? colors.muted : corPrimaria,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white text-base font-bold">
                {step < 4 ? "Próximo →" : "Finalizar Cadastro"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
