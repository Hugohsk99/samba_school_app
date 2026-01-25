/**
 * Formulário de Transação Financeira
 * Cadastro e edição de receitas e despesas
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinanceiro } from "@/lib/financeiro-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import type { TransacaoFinanceira, TipoTransacao, FormaPagamento, StatusPagamento, CategoriaReceita, CategoriaDespesa } from "@/lib/types";
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA, FORMAS_PAGAMENTO, STATUS_PAGAMENTO } from "@/lib/types";

export default function TransacaoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; tipo?: string }>();
  const { transacoes, addTransacao, updateTransacao, deleteTransacao } = useFinanceiro();
  const { integrantes, eventos, blocos } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError } = useToast();
  const { sessao } = useAuth();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Estados do formulário
  const [tipo, setTipo] = useState<TipoTransacao>(
    (params.tipo as TipoTransacao) || "receita"
  );
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [categoriaReceita, setCategoriaReceita] = useState<CategoriaReceita>("mensalidade");
  const [categoriaDespesa, setCategoriaDespesa] = useState<CategoriaDespesa>("fantasia");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const [status, setStatus] = useState<StatusPagamento>("pago");
  const [observacao, setObservacao] = useState("");
  const [integranteId, setIntegranteId] = useState<string | undefined>();
  const [eventoId, setEventoId] = useState<string | undefined>();
  const [blocoId, setBlocoId] = useState<string | undefined>();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar transação para edição
  useEffect(() => {
    if (params.id) {
      const transacao = transacoes.find(t => t.id === params.id);
      if (transacao) {
        setIsEditing(true);
        setTipo(transacao.tipo);
        setDescricao(transacao.descricao);
        setValor(transacao.valor.toString());
        setData(transacao.data);
        if (transacao.categoriaReceita) setCategoriaReceita(transacao.categoriaReceita);
        if (transacao.categoriaDespesa) setCategoriaDespesa(transacao.categoriaDespesa);
        setFormaPagamento(transacao.formaPagamento);
        setStatus(transacao.status);
        setObservacao(transacao.observacao || "");
        setIntegranteId(transacao.integranteId);
        setEventoId(transacao.eventoId);
        setBlocoId(transacao.blocoId);
      }
    }
  }, [params.id, transacoes]);

  // Formatar valor para exibição
  const formatarValorInput = (text: string) => {
    // Remove tudo que não é número
    const numeros = text.replace(/\D/g, "");
    // Converte para centavos
    const centavos = parseInt(numeros) || 0;
    // Formata como moeda
    const valorFormatado = (centavos / 100).toFixed(2);
    setValor(valorFormatado);
  };

  // Handlers
  const handleSalvar = async () => {
    if (!descricao.trim()) {
      showError("Erro", "Informe uma descrição.");
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showError("Erro", "Informe um valor válido.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const dadosTransacao = {
        tipo,
        descricao: descricao.trim(),
        valor: valorNumerico,
        data,
        categoriaReceita: tipo === "receita" ? categoriaReceita : undefined,
        categoriaDespesa: tipo === "despesa" ? categoriaDespesa : undefined,
        formaPagamento,
        status,
        observacao: observacao.trim() || undefined,
        integranteId,
        eventoId,
        blocoId,
      };

      if (isEditing && params.id) {
        await updateTransacao(params.id, dadosTransacao);
        showSuccess("Sucesso", "Transação atualizada!");
      } else {
        await addTransacao(dadosTransacao);
        showSuccess("Sucesso", `${tipo === "receita" ? "Receita" : "Despesa"} registrada!`);
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      showError("Erro", "Não foi possível salvar a transação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcluir = () => {
    Alert.alert(
      "Excluir Transação",
      "Tem certeza que deseja excluir esta transação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (params.id) {
              await deleteTransacao(params.id);
              showSuccess("Sucesso", "Transação excluída!");
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleVoltar = () => {
    router.back();
  };

  // Categorias baseadas no tipo
  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const categoriaAtual = tipo === "receita" ? categoriaReceita : categoriaDespesa;
  const setCategoria = tipo === "receita" 
    ? (v: string) => setCategoriaReceita(v as CategoriaReceita)
    : (v: string) => setCategoriaDespesa(v as CategoriaDespesa);

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: tipo === "receita" ? "#22C55E" : "#EF4444" }}
        >
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={handleVoltar}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold flex-1">
              {isEditing ? "Editar" : "Nova"} {tipo === "receita" ? "Receita" : "Despesa"}
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          {/* Tipo de Transação */}
          {!isEditing && (
            <View className="mb-6">
              <Text className="text-foreground text-base font-semibold mb-2">
                Tipo de Transação
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setTipo("receita")}
                  className={`flex-1 p-4 rounded-xl border-2 items-center ${
                    tipo === "receita"
                      ? "bg-success/10 border-success"
                      : "bg-surface border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mb-1">💰</Text>
                  <Text
                    className={`font-bold ${
                      tipo === "receita" ? "text-success" : "text-foreground"
                    }`}
                  >
                    Receita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTipo("despesa")}
                  className={`flex-1 p-4 rounded-xl border-2 items-center ${
                    tipo === "despesa"
                      ? "bg-error/10 border-error"
                      : "bg-surface border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mb-1">💸</Text>
                  <Text
                    className={`font-bold ${
                      tipo === "despesa" ? "text-error" : "text-foreground"
                    }`}
                  >
                    Despesa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Valor */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Valor *
            </Text>
            <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
              <Text className="text-foreground text-xl font-bold mr-2">R$</Text>
              <TextInput
                className="flex-1 py-4 text-foreground text-2xl font-bold"
                placeholder="0,00"
                placeholderTextColor="#9BA1A6"
                value={valor}
                onChangeText={formatarValorInput}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Descrição */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Descrição *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
              placeholder="Ex: Mensalidade de Janeiro"
              placeholderTextColor="#9BA1A6"
              value={descricao}
              onChangeText={setDescricao}
            />
          </View>

          {/* Data */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Data
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#9BA1A6"
              value={data}
              onChangeText={setData}
            />
          </View>

          {/* Categoria */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Categoria
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategoria(cat.value)}
                    className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${
                      categoriaAtual === cat.value
                        ? ""
                        : "bg-surface border border-border"
                    }`}
                    style={
                      categoriaAtual === cat.value
                        ? { backgroundColor: corPrimaria }
                        : {}
                    }
                  >
                    <Text className="text-lg">{cat.emoji}</Text>
                    <Text
                      className={`font-medium ${
                        categoriaAtual === cat.value ? "text-white" : "text-foreground"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Forma de Pagamento */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Forma de Pagamento
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {FORMAS_PAGAMENTO.map((forma) => (
                  <TouchableOpacity
                    key={forma.value}
                    onPress={() => setFormaPagamento(forma.value)}
                    className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${
                      formaPagamento === forma.value
                        ? ""
                        : "bg-surface border border-border"
                    }`}
                    style={
                      formaPagamento === forma.value
                        ? { backgroundColor: corPrimaria }
                        : {}
                    }
                  >
                    <Text className="text-lg">{forma.emoji}</Text>
                    <Text
                      className={`font-medium ${
                        formaPagamento === forma.value ? "text-white" : "text-foreground"
                      }`}
                    >
                      {forma.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Status */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_PAGAMENTO.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setStatus(s.value)}
                  className={`px-4 py-3 rounded-xl border-2 ${
                    status === s.value ? "" : "bg-surface border-border"
                  }`}
                  style={
                    status === s.value
                      ? { backgroundColor: s.cor + "20", borderColor: s.cor }
                      : {}
                  }
                >
                  <Text
                    className="font-medium"
                    style={{ color: status === s.value ? s.cor : undefined }}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Observação */}
          <View className="mb-6">
            <Text className="text-foreground text-base font-semibold mb-2">
              Observação (opcional)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-foreground text-base"
              placeholder="Adicione uma observação..."
              placeholderTextColor="#9BA1A6"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
          </View>

          {/* Botões */}
          <View className="gap-3 mb-8">
            <TouchableOpacity
              onPress={handleSalvar}
              className="p-4 rounded-xl items-center"
              style={{ backgroundColor: isSaving ? "#ccc" : corPrimaria }}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text className="text-white text-lg font-bold">
                {isSaving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Registrar"}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                onPress={handleExcluir}
                className="p-4 rounded-xl items-center bg-error/10 border border-error"
                activeOpacity={0.8}
              >
                <Text className="text-error text-lg font-bold">Excluir Transação</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleVoltar}
              className="p-4 rounded-xl items-center bg-surface border border-border"
              activeOpacity={0.8}
            >
              <Text className="text-foreground text-lg font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
