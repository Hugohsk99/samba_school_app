/**
 * Tela 05 - Fila de Aprovação
 * Diretores aprovam/rejeitam cadastros pendentes
 * Exibe comprovante PIX e dados do solicitante
 */

import { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const STATUS_CADASTRO_KEY = "@samba_status_cadastro";

interface SolicitacaoPendente {
  cpf: string;
  nome: string;
  telefone: string;
  email: string;
  dataCadastro: string;
  comprovantePix: string | null;
  alaPreferencia: string;
  observacoes: string;
  status: "pendente" | "aprovado" | "rejeitado";
}

export default function FilaAprovacaoScreen() {
  const router = useRouter();
  const colors = useColors();
  const { integrantes, updateIntegrante, blocos } = useData();
  const { nivelAcesso } = useAuth();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const corPrimaria = escola?.corPrimaria || colors.primary;

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPendente[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoPendente | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [alaDestino, setAlaDestino] = useState("");
  const [imagemAmpliadaUri, setImagemAmpliadaUri] = useState<string | null>(null);

  // Carregar solicitações pendentes
  const carregarSolicitacoes = useCallback(async () => {
    try {
      // Buscar integrantes inativos (pendentes de aprovação)
      const pendentes = integrantes.filter((i) => !i.ativo && i.cpf);

      const solicitacoesCarregadas: SolicitacaoPendente[] = [];

      for (const integrante of pendentes) {
        const cpfLimpo = integrante.cpf?.replace(/\D/g, "") || "";
        const dados = await AsyncStorage.getItem(
          `${STATUS_CADASTRO_KEY}_${cpfLimpo}`
        );

        if (dados) {
          const parsed = JSON.parse(dados);
          if (parsed.status === "pendente") {
            solicitacoesCarregadas.push({
              cpf: cpfLimpo,
              nome: integrante.nome,
              telefone: integrante.telefone,
              email: integrante.email,
              dataCadastro: parsed.dataCadastro || integrante.criadoEm,
              comprovantePix: parsed.comprovantePix || integrante.foto || null,
              alaPreferencia: parsed.alaPreferencia || "",
              observacoes: parsed.observacoes || "",
              status: "pendente",
            });
          }
        } else {
          // Integrante inativo sem dados de cadastro - incluir mesmo assim
          solicitacoesCarregadas.push({
            cpf: cpfLimpo,
            nome: integrante.nome,
            telefone: integrante.telefone,
            email: integrante.email,
            dataCadastro: integrante.criadoEm,
            comprovantePix: integrante.foto || null,
            alaPreferencia: "",
            observacoes: integrante.observacoes || "",
            status: "pendente",
          });
        }
      }

      // Ordenar por data (mais antigos primeiro)
      solicitacoesCarregadas.sort(
        (a, b) => new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime()
      );

      setSolicitacoes(solicitacoesCarregadas);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  }, [integrantes]);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarSolicitacoes();
    setRefreshing(false);
  }, [carregarSolicitacoes]);

  // Aprovar solicitação
  const handleAprovar = async (solicitacao: SolicitacaoPendente) => {
    try {
      const integrante = integrantes.find(
        (i) => i.cpf?.replace(/\D/g, "") === solicitacao.cpf
      );

      if (!integrante) {
        showError("Erro", "Integrante não encontrado.");
        return;
      }

      // Encontrar ala com vagas (limite de 50)
      let alaId = "";
      if (alaDestino) {
        alaId = alaDestino;
      } else {
        // Auto-atribuir a uma ala com vagas
        for (const bloco of blocos) {
          const integrantesNaAla = integrantes.filter(
            (i) => i.ativo && i.blocosIds.includes(bloco.id)
          ).length;
          if (integrantesNaAla < 50) {
            alaId = bloco.id;
            break;
          }
        }
      }

      // Ativar integrante
      updateIntegrante(integrante.id, {
        ativo: true,
        blocosIds: alaId ? [alaId] : integrante.blocosIds,
        observacoes: `Aprovado em ${new Date().toLocaleDateString("pt-BR")}. ${integrante.observacoes || ""}`,
      });

      // Atualizar status no AsyncStorage
      const dados = await AsyncStorage.getItem(
        `${STATUS_CADASTRO_KEY}_${solicitacao.cpf}`
      );
      if (dados) {
        const parsed = JSON.parse(dados);
        parsed.status = "aprovado";
        await AsyncStorage.setItem(
          `${STATUS_CADASTRO_KEY}_${solicitacao.cpf}`,
          JSON.stringify(parsed)
        );
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess("Aprovado!", `${solicitacao.nome} foi aprovado(a) com sucesso.`);

      // Remover da lista
      setSolicitacoes((prev) => prev.filter((s) => s.cpf !== solicitacao.cpf));
      setModalVisivel(false);
      setSolicitacaoSelecionada(null);
      setAlaDestino("");
    } catch (error) {
      showError("Erro", "Não foi possível aprovar o cadastro.");
    }
  };

  // Rejeitar solicitação
  const handleRejeitar = async (solicitacao: SolicitacaoPendente) => {
    if (!motivoRejeicao.trim()) {
      showWarning("Atenção", "Informe o motivo da rejeição.");
      return;
    }

    try {
      // Atualizar status no AsyncStorage
      const dados = await AsyncStorage.getItem(
        `${STATUS_CADASTRO_KEY}_${solicitacao.cpf}`
      );
      if (dados) {
        const parsed = JSON.parse(dados);
        parsed.status = "rejeitado";
        parsed.motivoRejeicao = motivoRejeicao;
        await AsyncStorage.setItem(
          `${STATUS_CADASTRO_KEY}_${solicitacao.cpf}`,
          JSON.stringify(parsed)
        );
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      showWarning("Rejeitado", `Cadastro de ${solicitacao.nome} foi rejeitado.`);

      // Remover da lista
      setSolicitacoes((prev) => prev.filter((s) => s.cpf !== solicitacao.cpf));
      setModalVisivel(false);
      setSolicitacaoSelecionada(null);
      setMotivoRejeicao("");
    } catch (error) {
      showError("Erro", "Não foi possível rejeitar o cadastro.");
    }
  };

  // Verificar permissão
  if (nivelAcesso !== "diretoria" && nivelAcesso !== "visitante") {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Acesso Restrito
          </Text>
          <Text className="text-muted text-base text-center">
            Apenas diretores podem aprovar cadastros.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-foreground font-medium">← Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const renderSolicitacao = ({ item }: { item: SolicitacaoPendente }) => {
    const diasPendente = Math.floor(
      (Date.now() - new Date(item.dataCadastro).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        onPress={() => {
          setSolicitacaoSelecionada(item);
          setModalVisivel(true);
        }}
        activeOpacity={0.7}
        className="mx-4 mb-3 rounded-2xl p-4 border border-border"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="flex-row items-center mb-3">
          {/* Avatar */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.warning + "20" }}
          >
            <Text className="text-xl">⏳</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className="text-foreground text-base font-semibold">
              {item.nome}
            </Text>
            <Text className="text-muted text-xs mt-0.5">
              CPF: {item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
            </Text>
          </View>

          {/* Badge dias */}
          <View
            className="px-2 py-1 rounded-full"
            style={{
              backgroundColor: diasPendente > 7 ? colors.error + "15" : colors.warning + "15",
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: diasPendente > 7 ? colors.error : colors.warning }}
            >
              {diasPendente}d
            </Text>
          </View>
        </View>

        {/* Detalhes */}
        <View className="flex-row justify-between">
          <Text className="text-muted text-xs">
            📱 {item.telefone || "Sem telefone"}
          </Text>
          <Text className="text-muted text-xs">
            {new Date(item.dataCadastro).toLocaleDateString("pt-BR")}
          </Text>
        </View>

        {/* Comprovante PIX indicator */}
        <View className="flex-row items-center mt-2">
          <Text className="text-xs" style={{ color: item.comprovantePix ? colors.success : colors.error }}>
            {item.comprovantePix ? "✓ Comprovante PIX enviado" : "✗ Sem comprovante"}
          </Text>
          {item.alaPreferencia ? (
            <Text className="text-muted text-xs ml-3">
              Preferência: {item.alaPreferencia}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
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
            Fila de Aprovação
          </Text>
          <Text className="text-muted text-xs">
            {solicitacoes.length} cadastro(s) pendente(s)
          </Text>
        </View>
      </View>

      {solicitacoes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">✅</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Nenhum cadastro pendente
          </Text>
          <Text className="text-muted text-base text-center">
            Todos os cadastros foram processados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={solicitacoes}
          renderItem={renderSolicitacao}
          keyExtractor={(item) => item.cpf}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal de Detalhes */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisivel(false)}
      >
        <ScreenContainer edges={["top", "bottom", "left", "right"]}>
          {/* Modal Header */}
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <TouchableOpacity
              onPress={() => {
                setModalVisivel(false);
                setSolicitacaoSelecionada(null);
                setMotivoRejeicao("");
                setAlaDestino("");
              }}
              className="mr-3 p-2"
            >
              <Text className="text-2xl">✕</Text>
            </TouchableOpacity>
            <Text className="text-foreground text-lg font-bold flex-1">
              Detalhes do Cadastro
            </Text>
          </View>

          {solicitacaoSelecionada && (
            <FlatList
              data={[solicitacaoSelecionada]}
              keyExtractor={() => "detail"}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              renderItem={() => (
                <View>
                  {/* Dados do Solicitante */}
                  <View className="rounded-2xl p-5 mb-4 border border-border" style={{ backgroundColor: colors.surface }}>
                    <Text className="text-foreground text-base font-semibold mb-3">
                      Dados Pessoais
                    </Text>
                    <View className="mb-2">
                      <Text className="text-muted text-xs">Nome</Text>
                      <Text className="text-foreground text-base font-medium">{solicitacaoSelecionada.nome}</Text>
                    </View>
                    <View className="mb-2">
                      <Text className="text-muted text-xs">CPF</Text>
                      <Text className="text-foreground text-base">{solicitacaoSelecionada.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</Text>
                    </View>
                    <View className="mb-2">
                      <Text className="text-muted text-xs">Telefone</Text>
                      <Text className="text-foreground text-base">{solicitacaoSelecionada.telefone || "Não informado"}</Text>
                    </View>
                    <View className="mb-2">
                      <Text className="text-muted text-xs">E-mail</Text>
                      <Text className="text-foreground text-base">{solicitacaoSelecionada.email || "Não informado"}</Text>
                    </View>
                    {solicitacaoSelecionada.alaPreferencia ? (
                      <View className="mb-2">
                        <Text className="text-muted text-xs">Preferência de Ala</Text>
                        <Text className="text-foreground text-base">{solicitacaoSelecionada.alaPreferencia}</Text>
                      </View>
                    ) : null}
                    {solicitacaoSelecionada.observacoes ? (
                      <View>
                        <Text className="text-muted text-xs">Observações</Text>
                        <Text className="text-foreground text-sm">{solicitacaoSelecionada.observacoes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Comprovante PIX */}
                  <View className="rounded-2xl p-5 mb-4 border border-border" style={{ backgroundColor: colors.surface }}>
                    <Text className="text-foreground text-base font-semibold mb-3">
                      Comprovante PIX
                    </Text>
                    {solicitacaoSelecionada.comprovantePix ? (
                      <TouchableOpacity
                        onPress={() => setImagemAmpliadaUri(solicitacaoSelecionada.comprovantePix)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: solicitacaoSelecionada.comprovantePix }}
                          className="w-full rounded-xl"
                          style={{ height: 250 }}
                          resizeMode="contain"
                        />
                        <Text className="text-muted text-xs text-center mt-2">
                          Toque para ampliar
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="items-center py-6">
                        <Text className="text-3xl mb-2">📄</Text>
                        <Text className="text-error text-sm font-medium">
                          Comprovante não enviado
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Seleção de Ala */}
                  <View className="rounded-2xl p-5 mb-4 border border-border" style={{ backgroundColor: colors.surface }}>
                    <Text className="text-foreground text-base font-semibold mb-3">
                      Vincular a Ala/Segmento
                    </Text>
                    {blocos.map((bloco) => {
                      const integrantesNaAla = integrantes.filter(
                        (i) => i.ativo && i.blocosIds.includes(bloco.id)
                      ).length;
                      const lotada = integrantesNaAla >= 50;

                      return (
                        <TouchableOpacity
                          key={bloco.id}
                          onPress={() => {
                            if (!lotada) setAlaDestino(bloco.id);
                          }}
                          activeOpacity={lotada ? 1 : 0.7}
                          className="flex-row items-center py-3 px-3 rounded-xl mb-2"
                          style={{
                            backgroundColor: alaDestino === bloco.id ? corPrimaria + "15" : "transparent",
                            borderWidth: 1,
                            borderColor: alaDestino === bloco.id ? corPrimaria : colors.border,
                            opacity: lotada ? 0.5 : 1,
                          }}
                        >
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: bloco.cor + "30" }}
                          >
                            <View
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: bloco.cor }}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-foreground text-sm font-medium">
                              {bloco.nome}
                            </Text>
                            <Text className="text-muted text-xs">
                              {integrantesNaAla}/50 integrantes
                              {lotada ? " (LOTADA)" : ""}
                            </Text>
                          </View>
                          {alaDestino === bloco.id && (
                            <Text style={{ color: corPrimaria }} className="font-bold">✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    <Text className="text-muted text-xs mt-2">
                      Selecione a ala para vincular o integrante (limite: 50 por ala)
                    </Text>
                  </View>

                  {/* Motivo de Rejeição */}
                  <View className="rounded-2xl p-5 mb-6 border border-border" style={{ backgroundColor: colors.surface }}>
                    <Text className="text-foreground text-base font-semibold mb-3">
                      Motivo da Rejeição (se aplicável)
                    </Text>
                    <TextInput
                      value={motivoRejeicao}
                      onChangeText={setMotivoRejeicao}
                      placeholder="Informe o motivo caso rejeite..."
                      placeholderTextColor={colors.muted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      className="bg-background text-foreground rounded-xl px-4 py-3 border border-border text-sm"
                      style={{ minHeight: 80 }}
                    />
                  </View>

                  {/* Botões de Ação */}
                  <View className="gap-3">
                    <TouchableOpacity
                      onPress={() => handleAprovar(solicitacaoSelecionada)}
                      activeOpacity={0.8}
                      className="rounded-xl py-4 items-center"
                      style={{ backgroundColor: colors.success }}
                    >
                      <Text className="text-white text-base font-bold">
                        ✓ Aprovar Cadastro
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRejeitar(solicitacaoSelecionada)}
                      activeOpacity={0.8}
                      className="rounded-xl py-4 items-center"
                      style={{ backgroundColor: colors.error }}
                    >
                      <Text className="text-white text-base font-bold">
                        ✗ Rejeitar Cadastro
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </ScreenContainer>
      </Modal>

      {/* Modal de Imagem Ampliada */}
      <Modal
        visible={!!imagemAmpliadaUri}
        animationType="fade"
        transparent
        onRequestClose={() => setImagemAmpliadaUri(null)}
      >
        <TouchableOpacity
          onPress={() => setImagemAmpliadaUri(null)}
          activeOpacity={1}
          className="flex-1 bg-black/90 items-center justify-center"
        >
          {imagemAmpliadaUri && (
            <Image
              source={{ uri: imagemAmpliadaUri }}
              className="w-full"
              style={{ height: "80%" }}
              resizeMode="contain"
            />
          )}
          <Text className="text-white text-sm mt-4">Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}
