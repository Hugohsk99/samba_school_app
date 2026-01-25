/**
 * Dashboard Financeiro
 * Visão geral de receitas, despesas e saldo
 */

import { useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinanceiro } from "@/lib/financeiro-context";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import type { TransacaoFinanceira } from "@/lib/types";
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA, STATUS_PAGAMENTO } from "@/lib/types";

// Filtros de período
const FILTROS_PERIODO = [
  { value: "todos", label: "Todos" },
  { value: "mes", label: "Este Mês" },
  { value: "semana", label: "Esta Semana" },
  { value: "hoje", label: "Hoje" },
];

// Filtros de tipo
const FILTROS_TIPO = [
  { value: "todos", label: "Todos" },
  { value: "receita", label: "Receitas" },
  { value: "despesa", label: "Despesas" },
];

export default function FinanceiroScreen() {
  const router = useRouter();
  const { transacoes, resumo, isLoading } = useFinanceiro();
  const { escola } = useEscola();
  const { temPermissao } = useAuth();

  // Estados de filtro
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Formatar valor em reais
  const formatarValor = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Filtrar transações por período
  const filtrarPorPeriodo = (transacao: TransacaoFinanceira) => {
    if (filtroPeriodo === "todos") return true;

    const dataTransacao = new Date(transacao.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (filtroPeriodo) {
      case "hoje":
        const hojeStr = hoje.toISOString().split("T")[0];
        return transacao.data.startsWith(hojeStr);
      case "semana":
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        return dataTransacao >= inicioSemana;
      case "mes":
        return (
          dataTransacao.getMonth() === hoje.getMonth() &&
          dataTransacao.getFullYear() === hoje.getFullYear()
        );
      default:
        return true;
    }
  };

  // Transações filtradas
  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter(t => {
        if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
        return filtrarPorPeriodo(t);
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, filtroPeriodo, filtroTipo]);

  // Calcular totais do período filtrado
  const totaisFiltrados = useMemo(() => {
    const receitas = transacoesFiltradas
      .filter(t => t.tipo === "receita" && t.status === "pago")
      .reduce((acc, t) => acc + t.valor, 0);
    const despesas = transacoesFiltradas
      .filter(t => t.tipo === "despesa" && t.status === "pago")
      .reduce((acc, t) => acc + t.valor, 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [transacoesFiltradas]);

  // Handlers
  const handleNovaTransacao = (tipo: "receita" | "despesa") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/transacao-form?tipo=${tipo}`);
  };

  const handleEditarTransacao = (id: string) => {
    router.push(`/transacao-form?id=${id}`);
  };

  const handleVoltar = () => {
    router.back();
  };

  // Obter categoria label
  const getCategoriaLabel = (transacao: TransacaoFinanceira) => {
    if (transacao.tipo === "receita") {
      const cat = CATEGORIAS_RECEITA.find(c => c.value === transacao.categoriaReceita);
      return cat ? `${cat.emoji} ${cat.label}` : transacao.categoriaReceita;
    } else {
      const cat = CATEGORIAS_DESPESA.find(c => c.value === transacao.categoriaDespesa);
      return cat ? `${cat.emoji} ${cat.label}` : transacao.categoriaDespesa;
    }
  };

  // Obter status info
  const getStatusInfo = (status: TransacaoFinanceira["status"]) => {
    const info = STATUS_PAGAMENTO.find(s => s.value === status);
    return info || { label: status, cor: "#6B7280" };
  };

  // Renderizar transação
  const renderTransacao = ({ item }: { item: TransacaoFinanceira }) => {
    const statusInfo = getStatusInfo(item.status);
    const dataFormatada = new Date(item.data).toLocaleDateString("pt-BR");
    const isReceita = item.tipo === "receita";

    return (
      <TouchableOpacity
        onPress={() => handleEditarTransacao(item.id)}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
              {item.descricao}
            </Text>
            <Text className="text-muted text-xs mt-1">
              {getCategoriaLabel(item)}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className={`text-lg font-bold ${isReceita ? "text-success" : "text-error"}`}
            >
              {isReceita ? "+" : "-"} {formatarValor(item.valor)}
            </Text>
            <View
              className="px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: statusInfo.cor + "20" }}
            >
              <Text style={{ color: statusInfo.cor }} className="text-xs font-medium">
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-between pt-2 border-t border-border">
          <Text className="text-muted text-xs">📅 {dataFormatada}</Text>
          {item.observacao && (
            <Text className="text-muted text-xs" numberOfLines={1}>
              📝 {item.observacao}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: corPrimaria }}
        >
          <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity
              onPress={handleVoltar}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold flex-1">Financeiro</Text>
          </View>

          {/* Cards de Resumo */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white/20 rounded-xl p-3">
              <Text className="text-white/80 text-xs">Receitas</Text>
              <Text className="text-white text-lg font-bold">
                {formatarValor(resumo.totalReceitas)}
              </Text>
              {resumo.receitasPendentes > 0 && (
                <Text className="text-white/60 text-xs">
                  +{formatarValor(resumo.receitasPendentes)} pendente
                </Text>
              )}
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-3">
              <Text className="text-white/80 text-xs">Despesas</Text>
              <Text className="text-white text-lg font-bold">
                {formatarValor(resumo.totalDespesas)}
              </Text>
              {resumo.despesasPendentes > 0 && (
                <Text className="text-white/60 text-xs">
                  +{formatarValor(resumo.despesasPendentes)} pendente
                </Text>
              )}
            </View>
          </View>

          {/* Saldo */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-muted text-sm">Saldo Atual</Text>
            <Text
              className={`text-3xl font-bold ${
                resumo.saldo >= 0 ? "text-success" : "text-error"
              }`}
            >
              {formatarValor(resumo.saldo)}
            </Text>
          </View>
        </View>

        {/* Botões de Ação */}
        {temPermissao("editarMaterial") && (
          <View className="flex-row gap-3 px-6 py-4">
            <TouchableOpacity
              onPress={() => handleNovaTransacao("receita")}
              className="flex-1 bg-success/20 border border-success rounded-xl p-3 flex-row items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Text className="text-success text-xl">+</Text>
              <Text className="text-success font-bold">Receita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNovaTransacao("despesa")}
              className="flex-1 bg-error/20 border border-error rounded-xl p-3 flex-row items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Text className="text-error text-xl">-</Text>
              <Text className="text-error font-bold">Despesa</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filtros */}
        <View className="px-6 pb-2">
          {/* Filtro de Período */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {FILTROS_PERIODO.map((filtro) => (
                <TouchableOpacity
                  key={filtro.value}
                  onPress={() => setFiltroPeriodo(filtro.value)}
                  className={`px-4 py-2 rounded-full ${
                    filtroPeriodo === filtro.value
                      ? ""
                      : "bg-surface border border-border"
                  }`}
                  style={
                    filtroPeriodo === filtro.value
                      ? { backgroundColor: corPrimaria }
                      : {}
                  }
                >
                  <Text
                    className={`text-sm font-medium ${
                      filtroPeriodo === filtro.value ? "text-white" : "text-foreground"
                    }`}
                  >
                    {filtro.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Filtro de Tipo */}
          <View className="flex-row gap-2">
            {FILTROS_TIPO.map((filtro) => (
              <TouchableOpacity
                key={filtro.value}
                onPress={() => setFiltroTipo(filtro.value)}
                className={`px-4 py-2 rounded-full ${
                  filtroTipo === filtro.value
                    ? ""
                    : "bg-surface border border-border"
                }`}
                style={
                  filtroTipo === filtro.value
                    ? { backgroundColor: corPrimaria }
                    : {}
                }
              >
                <Text
                  className={`text-sm font-medium ${
                    filtroTipo === filtro.value ? "text-white" : "text-foreground"
                  }`}
                >
                  {filtro.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Totais do período */}
          {filtroPeriodo !== "todos" && (
            <View className="flex-row gap-4 mt-3 p-3 bg-surface rounded-xl border border-border">
              <View className="flex-1">
                <Text className="text-muted text-xs">Receitas</Text>
                <Text className="text-success font-bold">
                  {formatarValor(totaisFiltrados.receitas)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted text-xs">Despesas</Text>
                <Text className="text-error font-bold">
                  {formatarValor(totaisFiltrados.despesas)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted text-xs">Saldo</Text>
                <Text
                  className={`font-bold ${
                    totaisFiltrados.saldo >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  {formatarValor(totaisFiltrados.saldo)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Lista de Transações */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Carregando...</Text>
          </View>
        ) : transacoesFiltradas.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-muted text-6xl mb-4">💰</Text>
            <Text className="text-foreground text-xl font-semibold mb-2">
              Nenhuma transação
            </Text>
            <Text className="text-muted text-center mb-6">
              {filtroPeriodo !== "todos" || filtroTipo !== "todos"
                ? "Tente ajustar os filtros."
                : "Registre receitas e despesas para controlar as finanças."}
            </Text>
            {temPermissao("editarMaterial") && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleNovaTransacao("receita")}
                  className="px-4 py-2 rounded-full bg-success"
                >
                  <Text className="text-white font-semibold">+ Receita</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleNovaTransacao("despesa")}
                  className="px-4 py-2 rounded-full bg-error"
                >
                  <Text className="text-white font-semibold">- Despesa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={transacoesFiltradas}
            renderItem={renderTransacao}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
