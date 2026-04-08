/**
 * Tela 02 - Login por CPF + Senha
 * Integrado ao banco de dados via tRPC
 * Fluxo: CPF não existe → cadastro; pendente → status; aprovado → home
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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

// Formatação de CPF
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Validação de CPF
function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits[10])) return false;

  return true;
}

export default function LoginCPFScreen() {
  const router = useRouter();
  const colors = useColors();
  const { loginCpf, loginComoAdmin } = useAuth();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errosCpf, setErrosCpf] = useState("");
  const [errosSenha, setErrosSenha] = useState("");

  const senhaRef = useRef<TextInput>(null);
  const corPrimaria = escola?.corPrimaria || colors.primary;

  const handleCpfChange = (text: string) => {
    const formatted = formatCPF(text);
    setCpf(formatted);
    setErrosCpf("");
  };

  // Login via banco de dados
  const handleLogin = async () => {
    setErrosCpf("");
    setErrosSenha("");

    const cpfLimpo = cpf.replace(/\D/g, "");

    if (!cpfLimpo || cpfLimpo.length < 11) {
      setErrosCpf("Informe o CPF completo");
      return;
    }

    if (!validarCPF(cpfLimpo)) {
      setErrosCpf("CPF inválido");
      return;
    }

    if (!senha.trim()) {
      setErrosSenha("Informe a senha");
      return;
    }

    if (senha.length < 4) {
      setErrosSenha("Senha deve ter pelo menos 4 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginCpf(cpfLimpo, senha);

      if (!result.success) {
        if (result.error === "cpf_nao_encontrado") {
          // CPF não existe → redirecionar para cadastro
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          showWarning(
            "CPF não encontrado",
            "Você será redirecionado para o cadastro."
          );
          router.push({
            pathname: "/cadastro-integrante" as any,
            params: { cpf: cpfLimpo },
          });
          return;
        }

        if (result.error === "senha_incorreta") {
          setErrosSenha("Senha incorreta");
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          return;
        }

        // Erro genérico
        showError("Erro", result.error || "Não foi possível fazer login.");
        return;
      }

      // Login bem-sucedido - verificar status
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess("Bem-vindo(a)!", "Login realizado com sucesso!");
      router.replace("/(tabs)");
    } catch (error) {
      showError("Erro", "Não foi possível fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Login como admin (para testes)
  const handleLoginAdmin = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loginComoAdmin();
      showSuccess("Modo Master", "Acesso total liberado para testes.");
      router.replace("/(tabs)");
    } catch (error) {
      showError("Erro", "Não foi possível fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trocar escola
  const handleTrocarEscola = async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.removeItem("@samba_escola_selecionada");
    router.replace("/landing" as any);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com logo da escola */}
          <View
            className="items-center pt-10 pb-8 px-6"
            style={{ backgroundColor: corPrimaria + "08" }}
          >
            {escola?.logo ? (
              <Image
                source={{ uri: escola.logo }}
                className="w-24 h-24 rounded-full mb-4"
                style={{ borderWidth: 3, borderColor: corPrimaria }}
              />
            ) : (
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                style={{
                  backgroundColor: corPrimaria + "20",
                  borderWidth: 3,
                  borderColor: corPrimaria,
                }}
              >
                <Text className="text-5xl">🎭</Text>
              </View>
            )}
            <Text className="text-foreground text-xl font-bold text-center">
              {escola?.nome || "Escola de Samba"}
            </Text>
            <Text className="text-muted text-sm mt-1">
              Faça login para continuar
            </Text>

            <TouchableOpacity
              onPress={handleTrocarEscola}
              activeOpacity={0.7}
              className="mt-3"
            >
              <Text style={{ color: corPrimaria }} className="text-sm font-medium">
                Trocar escola ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Formulário de Login */}
          <View className="px-6 pt-8">
            {/* Campo CPF */}
            <View className="mb-5">
              <Text className="text-foreground text-sm font-semibold mb-2">
                CPF
              </Text>
              <TextInput
                value={cpf}
                onChangeText={handleCpfChange}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={14}
                returnKeyType="next"
                onSubmitEditing={() => senhaRef.current?.focus()}
                className="bg-surface text-foreground rounded-xl px-4 py-4 text-lg border"
                style={{
                  borderColor: errosCpf ? colors.error : colors.border,
                  fontSize: 18,
                  letterSpacing: 1,
                }}
              />
              {errosCpf ? (
                <Text className="text-error text-xs mt-1">{errosCpf}</Text>
              ) : null}
            </View>

            {/* Campo Senha */}
            <View className="mb-6">
              <Text className="text-foreground text-sm font-semibold mb-2">
                Senha
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  ref={senhaRef}
                  value={senha}
                  onChangeText={(text) => {
                    setSenha(text);
                    setErrosSenha("");
                  }}
                  placeholder="Digite sua senha"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!mostrarSenha}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  className="flex-1 bg-surface text-foreground rounded-xl px-4 py-4 text-lg border"
                  style={{
                    borderColor: errosSenha ? colors.error : colors.border,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  activeOpacity={0.7}
                  style={{
                    position: "absolute",
                    right: 12,
                    padding: 8,
                  }}
                >
                  <Text className="text-muted text-xl">
                    {mostrarSenha ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errosSenha ? (
                <Text className="text-error text-xs mt-1">{errosSenha}</Text>
              ) : null}
            </View>

            {/* Botão Entrar */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
              className="rounded-xl py-4 items-center mb-4"
              style={{
                backgroundColor: isLoading ? colors.muted : corPrimaria,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Entrar
                </Text>
              )}
            </TouchableOpacity>

            {/* Link Primeiro Acesso */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/cadastro-integrante" as any,
                })
              }
              activeOpacity={0.7}
              className="items-center py-3"
            >
              <Text className="text-muted text-sm">
                Primeiro acesso?{" "}
                <Text style={{ color: corPrimaria }} className="font-semibold">
                  Cadastre-se
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="px-6 my-6">
            <View className="flex-row items-center">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-muted text-xs mx-4">ACESSO RÁPIDO</Text>
              <View className="flex-1 h-px bg-border" />
            </View>
          </View>

          {/* Acesso Admin (para testes) */}
          <View className="px-6 mb-4">
            <TouchableOpacity
              onPress={handleLoginAdmin}
              disabled={isLoading}
              activeOpacity={0.7}
              className="rounded-xl py-3 items-center border border-border"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-foreground text-sm font-medium">
                🔑 Acesso Master (Testes)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Continuar sem login */}
          <View className="px-6 mb-8">
            <TouchableOpacity
              onPress={() => {
                showWarning("Modo Visitante", "Funcionalidades limitadas.");
                router.replace("/(tabs)");
              }}
              activeOpacity={0.7}
              className="items-center py-3"
            >
              <Text className="text-muted text-sm">
                Continuar sem login ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="items-center pb-6 px-6">
            <Text className="text-muted text-xs text-center">
              100 Anos - Gestão do Samba
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
