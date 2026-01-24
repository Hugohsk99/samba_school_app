/**
 * Tela de Edição de Dados Pessoais do Integrante
 * Permite atualizar dados de contato (telefone, email, endereço)
 * Campos sensíveis (CPF, nome) são bloqueados para edição
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaskedInput } from "@/components/masked-input";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";

export default function EditarMeusDadosScreen() {
  const router = useRouter();
  const { sessao } = useAuth();
  const { integrantes, updateIntegrante } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Dados do formulário
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Carregar dados do integrante
  useEffect(() => {
    if (sessao?.integranteId) {
      const integrante = integrantes.find(i => i.id === sessao.integranteId);
      if (integrante) {
        setTelefone(integrante.telefone || "");
        setEmail(integrante.email || "");
        setEndereco(integrante.endereco || "");
        setCep(integrante.cep || "");
        setContatoEmergenciaNome(integrante.contatoEmergenciaNome || "");
        setContatoEmergenciaTelefone(integrante.contatoEmergenciaTelefone || "");
      }
    }
  }, [sessao, integrantes]);

  // Dados do integrante atual
  const meusDados = integrantes.find(i => i.id === sessao?.integranteId);

  // Salvar alterações
  const handleSalvar = async () => {
    if (!sessao?.integranteId) return;

    setIsLoading(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await updateIntegrante(sessao.integranteId, {
        telefone,
        email,
        endereco,
        cep,
        contatoEmergenciaNome,
        contatoEmergenciaTelefone,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess("Dados atualizados com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      showError("Erro ao atualizar dados", "Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!meusDados) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground text-lg">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View 
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: corPrimaria }}
        >
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-white text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Meus Dados</Text>
          <Text className="text-white/80">Atualize suas informações de contato</Text>
        </View>

        <ScrollView 
          className="flex-1 px-6 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Dados não editáveis */}
          <View className="bg-surface rounded-xl p-4 border border-border mb-6">
            <Text className="text-muted text-sm mb-2">🔒 Dados não editáveis</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted">Nome:</Text>
                <Text className="text-foreground font-medium">{meusDados.nome}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">CPF:</Text>
                <Text className="text-foreground font-medium">{meusDados.cpf || "Não informado"}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Categoria:</Text>
                <Text className="text-foreground font-medium">
                  {meusDados.categoria === "desfilante" ? "Desfilante" :
                   meusDados.categoria === "segmento" ? "Segmento" : "Diretoria/Staff"}
                </Text>
              </View>
            </View>
            <Text className="text-muted text-xs mt-3">
              Para alterar esses dados, entre em contato com a diretoria.
            </Text>
          </View>

          {/* Dados editáveis */}
          <Text className="text-foreground text-lg font-bold mb-4">✏️ Dados de Contato</Text>

          <MaskedInput
            label="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            maskType="telefone"
            placeholder="(00) 00000-0000"
            helpText="Seu número de celular para contato"
            editable={!isLoading}
          />

          <MaskedInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            maskType="email"
            placeholder="seu@email.com"
            helpText="Seu e-mail para receber comunicados"
            editable={!isLoading}
          />

          <MaskedInput
            label="CEP"
            value={cep}
            onChangeText={setCep}
            maskType="cep"
            placeholder="00000-000"
            helpText="CEP do seu endereço"
            editable={!isLoading}
          />

          <MaskedInput
            label="Endereço"
            value={endereco}
            onChangeText={setEndereco}
            maskType="texto"
            placeholder="Rua, número, bairro, cidade"
            helpText="Seu endereço completo"
            editable={!isLoading}
            maxLength={200}
          />

          {/* Contato de Emergência */}
          <Text className="text-foreground text-lg font-bold mt-6 mb-4">🆘 Contato de Emergência</Text>

          <MaskedInput
            label="Nome do Contato"
            value={contatoEmergenciaNome}
            onChangeText={setContatoEmergenciaNome}
            maskType="texto"
            placeholder="Nome completo"
            helpText="Pessoa para contato em caso de emergência"
            editable={!isLoading}
            maxLength={100}
          />

          <MaskedInput
            label="Telefone do Contato"
            value={contatoEmergenciaTelefone}
            onChangeText={setContatoEmergenciaTelefone}
            maskType="telefone"
            placeholder="(00) 00000-0000"
            helpText="Telefone do contato de emergência"
            editable={!isLoading}
          />

          {/* Botão Salvar */}
          <TouchableOpacity
            onPress={handleSalvar}
            disabled={isLoading}
            className="py-4 rounded-xl items-center mt-6 mb-8"
            style={{ 
              backgroundColor: isLoading ? corPrimaria + "80" : corPrimaria 
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
