/**
 * Tela de Login para Integrantes
 * Login prático usando CPF + Data de Nascimento
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaskedInput } from "@/components/masked-input";
import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";

export default function LoginIntegranteScreen() {
  const router = useRouter();
  const { integrantes } = useData();
  const { login, loginComoAdmin } = useAuth();
  const { escola } = useEscola();
  const { showSuccess, showError } = useToast();

  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Formatar CPF para comparação (apenas números)
  const formatarCPF = (valor: string) => {
    return valor.replace(/\D/g, "");
  };

  // Converter data DD/MM/AAAA para AAAA-MM-DD
  const converterData = (dataBR: string) => {
    const partes = dataBR.split("/");
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return "";
  };

  // Validar login
  const handleLogin = async () => {
    if (!cpf.trim() || cpf.length < 14) {
      showError("Por favor, digite seu CPF completo");
      return;
    }

    if (!dataNascimento.trim() || dataNascimento.length < 10) {
      showError("Por favor, digite sua data de nascimento");
      return;
    }

    setIsLoading(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Buscar integrante pelo CPF
      const cpfLimpo = formatarCPF(cpf);
      const dataConvertida = converterData(dataNascimento);

      const integrante = integrantes.find(i => {
        const cpfIntegrante = formatarCPF(i.cpf || "");
        return cpfIntegrante === cpfLimpo;
      });

      if (!integrante) {
        showError("CPF não encontrado", "Verifique se você está cadastrado.");
        setIsLoading(false);
        return;
      }

      // Verificar data de nascimento
      if (integrante.dataNascimento !== dataConvertida) {
        showError("Data de nascimento incorreta", "Tente novamente.");
        setIsLoading(false);
        return;
      }

      // Login bem-sucedido
      await login(integrante);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      showSuccess(`Bem-vindo(a), ${integrante.nome.split(" ")[0]}!`);
      
      // Redirecionar para área do integrante
      router.replace("/area-integrante");
    } catch (error) {
      console.error("Erro no login:", error);
      showError("Erro ao fazer login", "Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Login como gestor (para desenvolvimento)
  const handleLoginGestor = async () => {
    setIsLoading(true);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await loginComoAdmin();
      showSuccess("Logado como Administrador");
      router.replace("/");
    } catch (error) {
      showError("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com logo */}
          <View 
            className="items-center pt-12 pb-8 px-6"
            style={{ backgroundColor: corPrimaria }}
          >
            {escola?.logo ? (
              <Image
                source={{ uri: escola.logo }}
                className="w-24 h-24 rounded-full mb-4"
                style={{ backgroundColor: "white" }}
                resizeMode="cover"
              />
            ) : (
              <View 
                className="w-24 h-24 rounded-full mb-4 items-center justify-center"
                style={{ backgroundColor: "white" }}
              >
                <Text className="text-5xl">🎭</Text>
              </View>
            )}
            <Text className="text-white text-2xl font-bold text-center">
              {escola?.nome || "Escola de Samba"}
            </Text>
            <Text className="text-white/80 text-base mt-1">
              Acesso do Integrante
            </Text>
          </View>

          {/* Formulário de login */}
          <View className="flex-1 px-6 pt-8">
            <Text className="text-foreground text-lg font-semibold mb-6 text-center">
              Entre com seus dados cadastrados
            </Text>

            {/* Campo CPF */}
            <MaskedInput
              label="CPF"
              value={cpf}
              onChangeText={setCpf}
              maskType="cpf"
              placeholder="000.000.000-00"
              helpText="Digite o CPF cadastrado na escola"
              editable={!isLoading}
              required
            />

            {/* Campo Data de Nascimento */}
            <MaskedInput
              label="Data de Nascimento"
              value={dataNascimento}
              onChangeText={setDataNascimento}
              maskType="data"
              placeholder="DD/MM/AAAA"
              helpText="Sua data de nascimento para confirmação"
              editable={!isLoading}
              required
            />

            {/* Botão de Login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="py-4 rounded-xl items-center mb-4"
              style={{ 
                backgroundColor: isLoading ? corPrimaria + "80" : corPrimaria 
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-bold">
                {isLoading ? "Entrando..." : "Entrar"}
              </Text>
            </TouchableOpacity>

            {/* Dica */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-6">
              <Text className="text-muted text-sm text-center">
                💡 Se você ainda não está cadastrado, procure a diretoria da escola para realizar seu cadastro.
              </Text>
            </View>

            {/* Separador */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-muted text-sm mx-4">ou</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Botão de acesso como gestor */}
            <TouchableOpacity
              onPress={handleLoginGestor}
              disabled={isLoading}
              className="py-4 rounded-xl items-center border-2 mb-8"
              style={{ borderColor: corPrimaria }}
              activeOpacity={0.8}
            >
              <Text style={{ color: corPrimaria }} className="text-lg font-bold">
                Acessar como Gestor
              </Text>
            </TouchableOpacity>

            {/* Voltar */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="items-center py-4"
              activeOpacity={0.7}
            >
              <Text className="text-muted text-base">← Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
