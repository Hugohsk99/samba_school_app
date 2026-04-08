/**
 * Tela de Registro do Diretor de Carnaval
 * Primeiro acesso: quando uma escola não tem Diretor de Carnaval,
 * o primeiro usuário pode se registrar como tal.
 * Este é o ponto de entrada para a gestão da escola.
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";

// Formatação de CPF
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
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
  if (resto === 10) resto = 0;
  if (resto !== parseInt(digits[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(digits[10]);
}

interface FormData {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

export default function RegistroDiretorCarnavalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ escolaId?: string; escolaNome?: string }>();
  const colors = useColors();
  const { registrarDiretorCarnaval, loginCpf } = useAuth();
  const { showSuccess, showError } = useToast();

  const escolaId = params.escolaId ? parseInt(params.escolaId) : 1;
  const escolaNome = params.escolaNome || "Estácio de Sá";

  const [isLoading, setIsLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });

  const updateForm = (field: keyof FormData, value: string) => {
    if (field === "cpf") {
      setForm((prev) => ({ ...prev, [field]: formatCPF(value) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    setErros((prev) => ({ ...prev, [field]: "" }));
  };

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!form.nome.trim()) novosErros.nome = "Nome completo é obrigatório";
    if (form.nome.trim().split(" ").length < 2)
      novosErros.nome = "Informe nome e sobrenome";

    const cpfLimpo = form.cpf.replace(/\D/g, "");
    if (!cpfLimpo || cpfLimpo.length < 11) novosErros.cpf = "CPF completo é obrigatório";
    else if (!validarCPF(cpfLimpo)) novosErros.cpf = "CPF inválido";

    if (!form.email.trim()) novosErros.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      novosErros.email = "E-mail inválido";

    if (!form.senha.trim()) novosErros.senha = "Crie uma senha";
    else if (form.senha.length < 6)
      novosErros.senha = "Mínimo 6 caracteres";

    if (form.senha !== form.confirmarSenha)
      novosErros.confirmarSenha = "Senhas não conferem";

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleRegistrar = async () => {
    if (!validar()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);

    try {
      const cpfLimpo = form.cpf.replace(/\D/g, "");

      // Registrar como Diretor de Carnaval via tRPC
      const result = await registrarDiretorCarnaval({
        cpf: cpfLimpo,
        senha: form.senha,
        nome: form.nome,
        email: form.email || undefined,
        telefone: form.telefone.replace(/\D/g, "") || undefined,
        escolaId: escolaId,
      });

      if (!result.success) {
        if (result.error === "cpf_ja_cadastrado") {
          showError(
            "CPF já cadastrado",
            "Este CPF já está registrado. Tente fazer login."
          );
          router.replace("/login-cpf" as any);
          return;
        }
        showError("Erro", result.error || "Não foi possível completar o registro.");
        return;
      }

      // Fazer login automaticamente
      const loginResult = await loginCpf(cpfLimpo, form.senha);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess(
        "Registro concluído!",
        `Você é o Diretor de Carnaval da ${escolaNome}. Bem-vindo!`
      );

      // Ir direto para o app
      router.replace("/(tabs)" as any);
    } catch (error) {
      showError("Erro", "Não foi possível completar o registro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
      secureTextEntry?: boolean;
      autoCapitalize?: "none" | "sentences" | "words";
    }
  ) => (
    <View className="mb-4">
      <Text className="text-foreground text-sm font-medium mb-1.5">{label}</Text>
      <TextInput
        value={form[field]}
        onChangeText={(v) => updateForm(field, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={options?.keyboardType || "default"}
        secureTextEntry={options?.secureTextEntry}
        autoCapitalize={options?.autoCapitalize || "sentences"}
        className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
      />
      {erros[field] ? (
        <Text className="text-error text-xs mt-1">{erros[field]}</Text>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center pt-8 pb-4 px-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#CC0000" + "20" }}
            >
              <Text className="text-4xl">👑</Text>
            </View>
            <Text className="text-foreground text-2xl font-bold text-center">
              Primeiro Acesso
            </Text>
            <Text className="text-foreground text-lg font-semibold text-center mt-1">
              Diretor de Carnaval
            </Text>
            <Text className="text-muted text-sm text-center mt-2 px-4">
              Esta escola ainda não tem um Diretor de Carnaval cadastrado.
              Registre-se como o primeiro gestor da{" "}
              <Text className="font-semibold text-foreground">{escolaNome}</Text>.
            </Text>
          </View>

          {/* Info Box */}
          <View className="mx-6 mb-6 p-4 rounded-xl" style={{ backgroundColor: "#CC0000" + "10" }}>
            <Text className="text-foreground text-sm font-semibold mb-2">
              O que é o Diretor de Carnaval?
            </Text>
            <Text className="text-muted text-xs leading-5">
              O Diretor de Carnaval é o responsável máximo pela gestão operacional
              da escola no app. Ele pode:{"\n"}
              {"\n"}• Aprovar ou rejeitar novos integrantes
              {"\n"}• Criar e gerenciar alas e segmentos
              {"\n"}• Nomear Diretores de Ala e Segmento
              {"\n"}• Gerenciar eventos, ensaios e materiais
              {"\n"}• Acessar o painel financeiro
              {"\n"}• Controlar todas as funcionalidades da escola
            </Text>
          </View>

          {/* Formulário */}
          <View className="px-6 pb-8">
            <Text className="text-foreground text-base font-semibold mb-4">
              Seus Dados
            </Text>

            {renderInput("Nome Completo *", "nome", "Ex: João da Silva Santos", {
              autoCapitalize: "words",
            })}

            {renderInput("CPF *", "cpf", "000.000.000-00", {
              keyboardType: "numeric",
            })}

            {renderInput("E-mail *", "email", "seu@email.com", {
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}

            {renderInput("Telefone", "telefone", "(21) 99999-9999", {
              keyboardType: "phone-pad",
            })}

            <View className="h-px bg-border my-4" />

            <Text className="text-foreground text-base font-semibold mb-4">
              Criar Senha de Acesso
            </Text>

            {renderInput("Senha *", "senha", "Mínimo 6 caracteres", {
              secureTextEntry: true,
              autoCapitalize: "none",
            })}

            {renderInput("Confirmar Senha *", "confirmarSenha", "Repita a senha", {
              secureTextEntry: true,
              autoCapitalize: "none",
            })}

            {/* Botão Registrar */}
            <TouchableOpacity
              onPress={handleRegistrar}
              disabled={isLoading}
              activeOpacity={0.8}
              className="mt-4 rounded-xl py-4 items-center"
              style={{
                backgroundColor: "#CC0000",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Registrar como Diretor de Carnaval
                </Text>
              )}
            </TouchableOpacity>

            {/* Voltar */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-muted text-sm">Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
