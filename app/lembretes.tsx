/**
 * Tela de Lembretes e Notificações
 * Gerenciar lembretes personalizados e configurações de notificações
 */

import { useState, useEffect, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinanceiro } from "@/lib/financeiro-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";
import type { Lembrete, TipoLembrete } from "@/lib/types";
import {
  initializeNotifications,
  hasNotificationPermission,
  requestNotificationPermissions,
  scheduleLembrete,
  cancelNotification,
  getScheduledNotifications,
  cancelAllNotifications,
  scheduleEventReminder,
} from "@/lib/notification-service";

// Tipos de lembrete
const TIPOS_LEMBRETE: { value: TipoLembrete; label: string; emoji: string }[] = [
  { value: "evento", label: "Evento", emoji: "📅" },
  { value: "devolucao", label: "Devolução", emoji: "📦" },
  { value: "pagamento", label: "Pagamento", emoji: "💰" },
  { value: "aniversario", label: "Aniversário", emoji: "🎂" },
  { value: "personalizado", label: "Personalizado", emoji: "🔔" },
];

export default function LembretesScreen() {
  const router = useRouter();
  const { lembretes, addLembrete, updateLembrete, deleteLembrete, toggleLembrete } = useFinanceiro();
  const { eventos } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError } = useToast();

  // Estados
  const [permissaoNotificacao, setPermissaoNotificacao] = useState(false);
  const [notificacoesAgendadas, setNotificacoesAgendadas] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<TipoLembrete | "todos">("todos");

  // Form states
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<TipoLembrete>("personalizado");
  const [dataHora, setDataHora] = useState("");
  const [repetir, setRepetir] = useState(false);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Verificar permissões ao carregar
  useEffect(() => {
    checkPermissions();
    loadScheduledCount();
  }, []);

  const checkPermissions = async () => {
    const hasPermission = await hasNotificationPermission();
    setPermissaoNotificacao(hasPermission);
  };

  const loadScheduledCount = async () => {
    const scheduled = await getScheduledNotifications();
    setNotificacoesAgendadas(scheduled.length);
  };

  // Solicitar permissões
  const handleRequestPermissions = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const granted = await requestNotificationPermissions();
    setPermissaoNotificacao(granted);

    if (granted) {
      await initializeNotifications();
      showSuccess("Sucesso", "Notificações ativadas!");
    } else {
      showError("Atenção", "Permissão de notificações negada.");
    }
  };

  // Filtrar lembretes
  const lembretesFiltrados = useMemo(() => {
    if (filtroTipo === "todos") return lembretes;
    return lembretes.filter(l => l.tipo === filtroTipo);
  }, [lembretes, filtroTipo]);

  // Criar lembrete
  const handleCriarLembrete = async () => {
    if (!titulo.trim()) {
      showError("Erro", "Informe um título.");
      return;
    }

    if (!mensagem.trim()) {
      showError("Erro", "Informe uma mensagem.");
      return;
    }

    if (!dataHora) {
      showError("Erro", "Informe a data e hora.");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const novoLembrete = await addLembrete({
        tipo,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        dataHora: new Date(dataHora).toISOString(),
        repetir,
        ativo: true,
      });

      // Agendar notificação
      if (permissaoNotificacao) {
        await scheduleLembrete(novoLembrete);
      }

      showSuccess("Sucesso", "Lembrete criado!");
      resetForm();
      loadScheduledCount();
    } catch (error) {
      console.error("Erro ao criar lembrete:", error);
      showError("Erro", "Não foi possível criar o lembrete.");
    }
  };

  // Excluir lembrete
  const handleExcluirLembrete = (lembrete: Lembrete) => {
    Alert.alert(
      "Excluir Lembrete",
      `Deseja excluir "${lembrete.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteLembrete(lembrete.id);
            showSuccess("Sucesso", "Lembrete excluído!");
            loadScheduledCount();
          },
        },
      ]
    );
  };

  // Toggle ativo
  const handleToggleLembrete = async (lembrete: Lembrete) => {
    await toggleLembrete(lembrete.id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Agendar lembretes para eventos
  const handleAgendarEventos = async () => {
    if (!permissaoNotificacao) {
      showError("Atenção", "Ative as notificações primeiro.");
      return;
    }

    const eventosAgendados = eventos.filter(e => e.status === "agendado");
    let count = 0;

    for (const evento of eventosAgendados) {
      const result = await scheduleEventReminder(evento, 60);
      if (result) count++;
    }

    showSuccess("Sucesso", `${count} lembretes de eventos agendados!`);
    loadScheduledCount();
  };

  // Limpar todas notificações
  const handleLimparNotificacoes = () => {
    Alert.alert(
      "Limpar Notificações",
      "Deseja cancelar todas as notificações agendadas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            await cancelAllNotifications();
            showSuccess("Sucesso", "Notificações canceladas!");
            loadScheduledCount();
          },
        },
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setTitulo("");
    setMensagem("");
    setTipo("personalizado");
    setDataHora("");
    setRepetir(false);
    setShowForm(false);
  };

  const handleVoltar = () => {
    router.back();
  };

  // Formatar data
  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderizar lembrete
  const renderLembrete = ({ item }: { item: Lembrete }) => {
    const tipoInfo = TIPOS_LEMBRETE.find(t => t.value === item.tipo);
    const dataPassou = new Date(item.dataHora) < new Date();

    return (
      <View
        className={`bg-surface rounded-xl p-4 mb-3 border ${
          item.ativo ? "border-border" : "border-border opacity-50"
        }`}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center gap-2 flex-1">
            <Text className="text-2xl">{tipoInfo?.emoji || "🔔"}</Text>
            <View className="flex-1">
              <Text
                className={`text-foreground text-base font-semibold ${
                  !item.ativo ? "line-through" : ""
                }`}
                numberOfLines={1}
              >
                {item.titulo}
              </Text>
              <Text className="text-muted text-sm" numberOfLines={2}>
                {item.mensagem}
              </Text>
            </View>
          </View>
          <Switch
            value={item.ativo}
            onValueChange={() => handleToggleLembrete(item)}
            trackColor={{ false: "#767577", true: corPrimaria + "80" }}
            thumbColor={item.ativo ? corPrimaria : "#f4f3f4"}
          />
        </View>

        <View className="flex-row items-center justify-between pt-2 border-t border-border">
          <View className="flex-row items-center gap-2">
            <Text className={`text-xs ${dataPassou ? "text-error" : "text-muted"}`}>
              📅 {formatarData(item.dataHora)}
            </Text>
            {item.repetir && (
              <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                <Text className="text-xs" style={{ color: corPrimaria }}>
                  🔄 Repetir
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleExcluirLembrete(item)}
            className="p-2"
          >
            <Text className="text-error text-sm">🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <Text className="text-white text-2xl font-bold flex-1">
              Lembretes
            </Text>
            <TouchableOpacity
              onPress={() => setShowForm(!showForm)}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">{showForm ? "✕" : "+"}</Text>
            </TouchableOpacity>
          </View>

          {/* Status de Notificações */}
          <View className="bg-white/20 rounded-xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-semibold">Notificações</Text>
              {permissaoNotificacao ? (
                <View className="bg-success/30 px-3 py-1 rounded-full">
                  <Text className="text-white text-sm">✓ Ativadas</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleRequestPermissions}
                  className="bg-white px-3 py-1 rounded-full"
                >
                  <Text style={{ color: corPrimaria }} className="text-sm font-bold">
                    Ativar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-white/80 text-sm">
              {notificacoesAgendadas} notificações agendadas
            </Text>
          </View>
        </View>

        {/* Formulário de Novo Lembrete */}
        {showForm && (
          <View className="px-6 py-4 bg-surface border-b border-border">
            <Text className="text-foreground text-lg font-bold mb-4">
              Novo Lembrete
            </Text>

            {/* Tipo */}
            <Text className="text-foreground text-sm font-medium mb-2">Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {TIPOS_LEMBRETE.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setTipo(t.value)}
                    className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                      tipo === t.value ? "" : "bg-background border border-border"
                    }`}
                    style={tipo === t.value ? { backgroundColor: corPrimaria } : {}}
                  >
                    <Text>{t.emoji}</Text>
                    <Text
                      className={`font-medium ${
                        tipo === t.value ? "text-white" : "text-foreground"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Título */}
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
              placeholder="Título do lembrete"
              placeholderTextColor="#9BA1A6"
              value={titulo}
              onChangeText={setTitulo}
            />

            {/* Mensagem */}
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
              placeholder="Mensagem"
              placeholderTextColor="#9BA1A6"
              value={mensagem}
              onChangeText={setMensagem}
              multiline
              numberOfLines={2}
            />

            {/* Data e Hora */}
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
              placeholder="Data e Hora (AAAA-MM-DD HH:MM)"
              placeholderTextColor="#9BA1A6"
              value={dataHora}
              onChangeText={setDataHora}
            />

            {/* Repetir */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground">Repetir lembrete</Text>
              <Switch
                value={repetir}
                onValueChange={setRepetir}
                trackColor={{ false: "#767577", true: corPrimaria + "80" }}
                thumbColor={repetir ? corPrimaria : "#f4f3f4"}
              />
            </View>

            {/* Botões */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={resetForm}
                className="flex-1 py-3 rounded-xl bg-background border border-border items-center"
              >
                <Text className="text-foreground font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCriarLembrete}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: corPrimaria }}
              >
                <Text className="text-white font-bold">Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ações Rápidas */}
        <View className="px-6 py-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleAgendarEventos}
              className="flex-1 bg-surface border border-border rounded-xl p-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-xl mb-1">📅</Text>
              <Text className="text-foreground text-sm font-medium text-center">
                Agendar Eventos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLimparNotificacoes}
              className="flex-1 bg-surface border border-border rounded-xl p-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-xl mb-1">🗑️</Text>
              <Text className="text-foreground text-sm font-medium text-center">
                Limpar Tudo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros */}
        <View className="px-6 pb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setFiltroTipo("todos")}
                className={`px-4 py-2 rounded-full ${
                  filtroTipo === "todos" ? "" : "bg-surface border border-border"
                }`}
                style={filtroTipo === "todos" ? { backgroundColor: corPrimaria } : {}}
              >
                <Text
                  className={`font-medium ${
                    filtroTipo === "todos" ? "text-white" : "text-foreground"
                  }`}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {TIPOS_LEMBRETE.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setFiltroTipo(t.value)}
                  className={`px-4 py-2 rounded-full flex-row items-center gap-1 ${
                    filtroTipo === t.value ? "" : "bg-surface border border-border"
                  }`}
                  style={filtroTipo === t.value ? { backgroundColor: corPrimaria } : {}}
                >
                  <Text>{t.emoji}</Text>
                  <Text
                    className={`font-medium ${
                      filtroTipo === t.value ? "text-white" : "text-foreground"
                    }`}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de Lembretes */}
        {lembretesFiltrados.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-muted text-6xl mb-4">🔔</Text>
            <Text className="text-foreground text-xl font-semibold mb-2">
              Nenhum lembrete
            </Text>
            <Text className="text-muted text-center mb-6">
              Crie lembretes para não esquecer eventos importantes.
            </Text>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              className="px-6 py-3 rounded-full"
              style={{ backgroundColor: corPrimaria }}
            >
              <Text className="text-white font-bold">+ Novo Lembrete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={lembretesFiltrados}
            renderItem={renderLembrete}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
