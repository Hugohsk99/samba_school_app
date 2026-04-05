/**
 * Tela 17 - Contato para Associação
 * Informações de contato e formulário para novas escolas
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";

const CONTATOS = {
  email: "100anosgestaodosamba@gmail.com",
  whatsapp1: "5521975841304",
  whatsapp2: "5521999304505",
  telefone1: "(21) 97584-1304",
  telefone2: "(21) 99930-4505",
};

export default function ContatoAssociacaoScreen() {
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showWarning } = useToast();

  const [nomeEscola, setNomeEscola] = useState("");
  const [nomeContato, setNomeContato] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleWhatsApp = (numero: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    let texto = "Olá! Gostaria de associar minha escola de samba ao app 100 Anos - Gestão do Samba.";
    if (nomeEscola) texto += `\n\nEscola: ${nomeEscola}`;
    if (nomeContato) texto += `\nContato: ${nomeContato}`;
    if (telefoneContato) texto += `\nTelefone: ${telefoneContato}`;
    if (mensagem) texto += `\nMensagem: ${mensagem}`;
    Linking.openURL(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`);
  };

  const handleEnviarEmail = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    let corpo = "Olá!\n\nGostaria de associar minha escola de samba ao app 100 Anos - Gestão do Samba.\n";
    if (nomeEscola) corpo += `\nEscola: ${nomeEscola}`;
    if (nomeContato) corpo += `\nContato: ${nomeContato}`;
    if (telefoneContato) corpo += `\nTelefone: ${telefoneContato}`;
    if (emailContato) corpo += `\nE-mail: ${emailContato}`;
    if (mensagem) corpo += `\n\nMensagem:\n${mensagem}`;
    corpo += "\n\nAguardo retorno. Obrigado!";

    Linking.openURL(
      `mailto:${CONTATOS.email}?subject=Associação de Escola - ${nomeEscola || "Nova Escola"}&body=${encodeURIComponent(corpo)}`
    );
  };

  const handleEnviarFormulario = () => {
    if (!nomeEscola.trim()) {
      showWarning("Atenção", "Informe o nome da escola de samba.");
      return;
    }
    if (!nomeContato.trim()) {
      showWarning("Atenção", "Informe o nome do responsável.");
      return;
    }
    if (!telefoneContato.trim() && !emailContato.trim()) {
      showWarning("Atenção", "Informe pelo menos um contato (telefone ou e-mail).");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Montar mensagem e abrir WhatsApp
    let texto = `🎭 *Solicitação de Associação*\n\n`;
    texto += `*Escola:* ${nomeEscola}\n`;
    texto += `*Responsável:* ${nomeContato}\n`;
    if (telefoneContato) texto += `*Telefone:* ${telefoneContato}\n`;
    if (emailContato) texto += `*E-mail:* ${emailContato}\n`;
    if (mensagem) texto += `\n*Mensagem:*\n${mensagem}`;

    Linking.openURL(`https://wa.me/${CONTATOS.whatsapp1}?text=${encodeURIComponent(texto)}`);
    showSuccess("Formulário enviado!", "Você será redirecionado para o WhatsApp.");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="mr-3 p-2"
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-lg font-bold">
              Associar Minha Escola
            </Text>
            <Text className="text-muted text-xs">
              Entre em contato conosco
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Informações */}
          <View className="px-6 pt-6 pb-4">
            <View
              className="rounded-2xl p-5"
              style={{ backgroundColor: colors.primary + "10" }}
            >
              <Text className="text-foreground text-base font-semibold mb-2">
                Como funciona?
              </Text>
              <Text className="text-muted text-sm leading-5">
                Para cadastrar sua escola de samba no app 100 Anos - Gestão do Samba,
                preencha o formulário abaixo ou entre em contato diretamente pelos
                nossos canais. Nossa equipe entrará em contato para configurar
                sua escola no sistema.
              </Text>
            </View>
          </View>

          {/* Formulário */}
          <View className="px-6">
            <Text className="text-foreground text-base font-semibold mb-4">
              Dados da Escola
            </Text>

            {/* Nome da Escola */}
            <View className="mb-4">
              <Text className="text-foreground text-sm font-medium mb-1">
                Nome da Escola de Samba *
              </Text>
              <TextInput
                value={nomeEscola}
                onChangeText={setNomeEscola}
                placeholder="Ex: G.R.E.S. Estácio de Sá"
                placeholderTextColor={colors.muted}
                className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
              />
            </View>

            {/* Nome do Responsável */}
            <View className="mb-4">
              <Text className="text-foreground text-sm font-medium mb-1">
                Nome do Responsável *
              </Text>
              <TextInput
                value={nomeContato}
                onChangeText={setNomeContato}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.muted}
                className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
              />
            </View>

            {/* Telefone */}
            <View className="mb-4">
              <Text className="text-foreground text-sm font-medium mb-1">
                Telefone / WhatsApp
              </Text>
              <TextInput
                value={telefoneContato}
                onChangeText={setTelefoneContato}
                placeholder="(XX) XXXXX-XXXX"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
              />
            </View>

            {/* E-mail */}
            <View className="mb-4">
              <Text className="text-foreground text-sm font-medium mb-1">
                E-mail
              </Text>
              <TextInput
                value={emailContato}
                onChangeText={setEmailContato}
                placeholder="seu@email.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
              />
            </View>

            {/* Mensagem */}
            <View className="mb-6">
              <Text className="text-foreground text-sm font-medium mb-1">
                Mensagem (opcional)
              </Text>
              <TextInput
                value={mensagem}
                onChangeText={setMensagem}
                placeholder="Conte-nos sobre sua escola..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
                style={{ minHeight: 100 }}
              />
            </View>

            {/* Botão Enviar via WhatsApp */}
            <TouchableOpacity
              onPress={handleEnviarFormulario}
              activeOpacity={0.8}
              className="rounded-xl py-4 items-center mb-3"
              style={{ backgroundColor: "#25D366" }}
            >
              <Text className="text-white text-base font-bold">
                📱 Enviar via WhatsApp
              </Text>
            </TouchableOpacity>

            {/* Botão Enviar via E-mail */}
            <TouchableOpacity
              onPress={handleEnviarEmail}
              activeOpacity={0.8}
              className="rounded-xl py-4 items-center mb-6"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-base font-bold">
                📧 Enviar via E-mail
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="px-6 mb-6">
            <View className="flex-row items-center">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-muted text-sm mx-4">ou ligue diretamente</Text>
              <View className="flex-1 h-px bg-border" />
            </View>
          </View>

          {/* Contatos Diretos */}
          <View className="px-6 mb-8">
            <TouchableOpacity
              onPress={() => handleWhatsApp(CONTATOS.whatsapp1)}
              activeOpacity={0.7}
              className="flex-row items-center py-4 px-4 rounded-xl mb-3"
              style={{ backgroundColor: "#25D366" + "15" }}
            >
              <Text className="text-2xl mr-3">📱</Text>
              <View className="flex-1">
                <Text className="text-foreground text-base font-medium">
                  WhatsApp 1
                </Text>
                <Text className="text-muted text-sm">{CONTATOS.telefone1}</Text>
              </View>
              <Text style={{ color: "#25D366" }} className="font-semibold">
                Abrir ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleWhatsApp(CONTATOS.whatsapp2)}
              activeOpacity={0.7}
              className="flex-row items-center py-4 px-4 rounded-xl mb-3"
              style={{ backgroundColor: "#25D366" + "15" }}
            >
              <Text className="text-2xl mr-3">📱</Text>
              <View className="flex-1">
                <Text className="text-foreground text-base font-medium">
                  WhatsApp 2
                </Text>
                <Text className="text-muted text-sm">{CONTATOS.telefone2}</Text>
              </View>
              <Text style={{ color: "#25D366" }} className="font-semibold">
                Abrir ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEnviarEmail}
              activeOpacity={0.7}
              className="flex-row items-center py-4 px-4 rounded-xl"
              style={{ backgroundColor: colors.primary + "10" }}
            >
              <Text className="text-2xl mr-3">📧</Text>
              <View className="flex-1">
                <Text className="text-foreground text-base font-medium">
                  E-mail
                </Text>
                <Text className="text-muted text-sm">{CONTATOS.email}</Text>
              </View>
              <Text style={{ color: colors.primary }} className="font-semibold">
                Enviar ›
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
