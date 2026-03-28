/**
 * Tela de Edição de Integrante para Gestores
 * Acesso completo a todos os campos do integrante
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { MaskedInput } from "@/components/masked-input";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import type { CategoriaIntegrante, TipoDesfilante, TipoSegmento, CargoDiretoria } from "@/lib/types";
import { 
  TIPOS_DESFILANTE, 
  TIPOS_SEGMENTO, 
  CARGOS_DIRETORIA 
} from "@/lib/types";

export default function EditarIntegranteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { permissoes } = useAuth();
  const { integrantes, blocos, updateIntegrante, deleteIntegrante } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Dados do formulário
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaIntegrante>("desfilante");
  const [tipoDesfilante, setTipoDesfilante] = useState<TipoDesfilante | undefined>();
  const [tipoSegmento, setTipoSegmento] = useState<TipoSegmento | undefined>();
  const [cargoDiretoria, setCargoDiretoria] = useState<CargoDiretoria | undefined>();
  const [blocosIds, setBlocosIds] = useState<string[]>([]);
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativo, setAtivo] = useState(true);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Carregar dados do integrante
  useEffect(() => {
    if (id) {
      const integrante = integrantes.find(i => i.id === id);
      if (integrante) {
        setNome(integrante.nome);
        setCpf(integrante.cpf || "");
        setRg(integrante.rg || "");
        setDataNascimento(integrante.dataNascimento || "");
        setTelefone(integrante.telefone || "");
        setEmail(integrante.email || "");
        setEndereco(integrante.endereco || "");
        setCep(integrante.cep || "");
        setFoto(integrante.foto || null);
        setCategoria(integrante.categoria);
        setTipoDesfilante(integrante.tipoDesfilante);
        setTipoSegmento(integrante.tipoSegmento);
        setCargoDiretoria(integrante.cargoDiretoria);
        setBlocosIds(integrante.blocosIds || []);
        setContatoEmergenciaNome(integrante.contatoEmergenciaNome || "");
        setContatoEmergenciaTelefone(integrante.contatoEmergenciaTelefone || "");
        setObservacoes(integrante.observacoes || "");
        setAtivo(integrante.ativo);
      }
    }
  }, [id, integrantes]);

  // Verificar permissão
  if (!permissoes.editarIntegrante) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Acesso Restrito
          </Text>
          <Text className="text-muted text-center">
            Você não tem permissão para editar integrantes.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // Selecionar foto
  const handleSelecionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showWarning("Permissão necessária", "Precisamos de acesso à galeria para selecionar uma foto.");
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
    }
  };

  // Toggle bloco
  const toggleBloco = (blocoId: string) => {
    if (blocosIds.includes(blocoId)) {
      setBlocosIds(blocosIds.filter(id => id !== blocoId));
    } else {
      setBlocosIds([...blocosIds, blocoId]);
    }
  };

  // Salvar alterações
  const handleSalvar = async () => {
    if (!id) return;

    if (!nome.trim()) {
      showError("Nome é obrigatório");
      return;
    }

    setIsLoading(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await updateIntegrante(id, {
        nome,
        cpf,
        rg,
        dataNascimento,
        telefone,
        email,
        endereco,
        cep,
        foto: foto || undefined,
        categoria,
        tipoDesfilante: categoria === "desfilante" ? tipoDesfilante : undefined,
        tipoSegmento: categoria === "segmento" ? tipoSegmento : undefined,
        cargoDiretoria: categoria === "diretoria" ? cargoDiretoria : undefined,
        blocosIds,
        contatoEmergenciaNome,
        contatoEmergenciaTelefone,
        observacoes,
        ativo,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess("Integrante atualizado com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro ao atualizar integrante:", error);
      showError("Erro ao atualizar", "Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir integrante
  const handleExcluir = () => {
    Alert.alert(
      "Excluir Integrante",
      `Tem certeza que deseja excluir ${nome}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            try {
              await deleteIntegrante(id);
              showSuccess("Integrante excluído");
              router.back();
            } catch (error) {
              showError("Erro ao excluir");
            }
          },
        },
      ]
    );
  };

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
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-white text-base">← Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExcluir}>
              <Text className="text-white/80 text-base">🗑️ Excluir</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-white text-2xl font-bold">Editar Integrante</Text>
        </View>

        <ScrollView 
          className="flex-1 px-6 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Foto */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={handleSelecionarFoto}>
              {foto ? (
                <Image
                  source={{ uri: foto }}
                  className="w-28 h-28 rounded-full"
                  style={{ backgroundColor: "#f0f0f0" }}
                />
              ) : (
                <View 
                  className="w-28 h-28 rounded-full items-center justify-center"
                  style={{ backgroundColor: corPrimaria + "20" }}
                >
                  <Text className="text-5xl">📷</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text className="text-muted text-sm mt-2">Toque para alterar a foto</Text>
          </View>

          {/* Dados Pessoais */}
          <Text className="text-foreground text-lg font-bold mb-4">👤 Dados Pessoais</Text>

          <MaskedInput
            label="Nome Completo *"
            value={nome}
            onChangeText={setNome}
            maskType="texto"
            placeholder="Nome completo do integrante"
            editable={!isLoading}
            maxLength={100}
          />

          <MaskedInput
            label="CPF"
            value={cpf}
            onChangeText={setCpf}
            maskType="cpf"
            placeholder="000.000.000-00"
            editable={!isLoading}
          />

          <MaskedInput
            label="RG"
            value={rg}
            onChangeText={setRg}
            maskType="texto"
            placeholder="Número do RG"
            editable={!isLoading}
            maxLength={20}
          />

          <MaskedInput
            label="Data de Nascimento"
            value={dataNascimento}
            onChangeText={setDataNascimento}
            maskType="data"
            placeholder="DD/MM/AAAA"
            editable={!isLoading}
          />

          {/* Contato */}
          <Text className="text-foreground text-lg font-bold mt-6 mb-4">📱 Contato</Text>

          <MaskedInput
            label="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            maskType="telefone"
            placeholder="(00) 00000-0000"
            editable={!isLoading}
          />

          <MaskedInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            maskType="email"
            placeholder="email@exemplo.com"
            editable={!isLoading}
          />

          <MaskedInput
            label="CEP"
            value={cep}
            onChangeText={setCep}
            maskType="cep"
            placeholder="00000-000"
            editable={!isLoading}
          />

          <MaskedInput
            label="Endereço"
            value={endereco}
            onChangeText={setEndereco}
            maskType="texto"
            placeholder="Rua, número, bairro, cidade"
            editable={!isLoading}
            maxLength={200}
          />

          {/* Categoria */}
          <Text className="text-foreground text-lg font-bold mt-6 mb-4">🏷️ Categoria</Text>

          <View className="flex-row gap-2 mb-4">
            {(["desfilante", "segmento", "diretoria"] as CategoriaIntegrante[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoria(cat)}
                className="flex-1 py-3 rounded-xl items-center border"
                style={{
                  backgroundColor: categoria === cat ? corPrimaria : "transparent",
                  borderColor: categoria === cat ? corPrimaria : "#E5E7EB",
                }}
              >
                <Text 
                  className="font-medium"
                  style={{ color: categoria === cat ? "white" : "#687076" }}
                >
                  {cat === "desfilante" ? "Desfilante" :
                   cat === "segmento" ? "Segmento" : "Diretoria"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tipo específico por categoria */}
          {categoria === "desfilante" && (
            <View className="mb-4">
              <Text className="text-muted text-sm mb-2">Tipo de Desfilante:</Text>
              <View className="flex-row flex-wrap gap-2">
                {TIPOS_DESFILANTE.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    onPress={() => setTipoDesfilante(tipo.value)}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: tipoDesfilante === tipo.value ? corPrimaria + "20" : "transparent",
                      borderColor: tipoDesfilante === tipo.value ? corPrimaria : "#E5E7EB",
                    }}
                  >
                    <Text style={{ color: tipoDesfilante === tipo.value ? corPrimaria : "#687076" }}>
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {categoria === "segmento" && (
            <View className="mb-4">
              <Text className="text-muted text-sm mb-2">Tipo de Segmento:</Text>
              <View className="flex-row flex-wrap gap-2">
                {TIPOS_SEGMENTO.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    onPress={() => setTipoSegmento(tipo.value)}
                    className="px-3 py-2 rounded-full border"
                    style={{
                      backgroundColor: tipoSegmento === tipo.value ? corPrimaria + "20" : "transparent",
                      borderColor: tipoSegmento === tipo.value ? corPrimaria : "#E5E7EB",
                    }}
                  >
                    <Text 
                      className="text-sm"
                      style={{ color: tipoSegmento === tipo.value ? corPrimaria : "#687076" }}
                    >
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {categoria === "diretoria" && (
            <View className="mb-4">
              <Text className="text-muted text-sm mb-2">Cargo:</Text>
              <View className="flex-row flex-wrap gap-2">
                {CARGOS_DIRETORIA.map((cargo) => (
                  <TouchableOpacity
                    key={cargo.value}
                    onPress={() => setCargoDiretoria(cargo.value)}
                    className="px-3 py-2 rounded-full border"
                    style={{
                      backgroundColor: cargoDiretoria === cargo.value ? corPrimaria + "20" : "transparent",
                      borderColor: cargoDiretoria === cargo.value ? corPrimaria : "#E5E7EB",
                    }}
                  >
                    <Text 
                      className="text-sm"
                      style={{ color: cargoDiretoria === cargo.value ? corPrimaria : "#687076" }}
                    >
                      {cargo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Segmentos */}
          <Text className="text-foreground text-lg font-bold mt-6 mb-4">🎭 Segmentos</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {blocos.map((bloco) => (
              <TouchableOpacity
                key={bloco.id}
                onPress={() => toggleBloco(bloco.id)}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: blocosIds.includes(bloco.id) ? corPrimaria + "20" : "transparent",
                  borderColor: blocosIds.includes(bloco.id) ? corPrimaria : "#E5E7EB",
                }}
              >
                <Text style={{ color: blocosIds.includes(bloco.id) ? corPrimaria : "#687076" }}>
                  {bloco.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contato de Emergência */}
          <Text className="text-foreground text-lg font-bold mt-6 mb-4">🆘 Contato de Emergência</Text>

          <MaskedInput
            label="Nome do Contato"
            value={contatoEmergenciaNome}
            onChangeText={setContatoEmergenciaNome}
            maskType="texto"
            placeholder="Nome completo"
            editable={!isLoading}
            maxLength={100}
          />

          <MaskedInput
            label="Telefone do Contato"
            value={contatoEmergenciaTelefone}
            onChangeText={setContatoEmergenciaTelefone}
            maskType="telefone"
            placeholder="(00) 00000-0000"
            editable={!isLoading}
          />

          {/* Status */}
          <Text className="text-foreground text-lg font-bold mt-6 mb-4">📋 Status</Text>
          <TouchableOpacity
            onPress={() => setAtivo(!ativo)}
            className="flex-row items-center justify-between bg-surface p-4 rounded-xl border border-border mb-4"
          >
            <Text className="text-foreground">Integrante Ativo</Text>
            <View 
              className="w-12 h-7 rounded-full justify-center px-1"
              style={{ backgroundColor: ativo ? "#22C55E" : "#E5E7EB" }}
            >
              <View 
                className="w-5 h-5 rounded-full bg-white"
                style={{ alignSelf: ativo ? "flex-end" : "flex-start" }}
              />
            </View>
          </TouchableOpacity>

          {/* Observações */}
          <MaskedInput
            label="Observações"
            value={observacoes}
            onChangeText={setObservacoes}
            maskType="texto"
            placeholder="Observações adicionais..."
            editable={!isLoading}
            maxLength={500}
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
