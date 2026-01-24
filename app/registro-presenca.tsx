import { useState, useEffect, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import type { RegistroPresenca } from "@/lib/types";

type StatusPresenca = RegistroPresenca["status"];

interface PresencaLocal {
  integranteId: string;
  status: StatusPresenca;
  justificativa?: string;
}

export default function RegistroPresencaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ensaioId: string }>();
  const {
    ensaios,
    blocos,
    integrantes,
    registrarPresenca,
    getPresencaByEnsaio,
  } = useData();

  const ensaio = ensaios.find((e) => e.id === params.ensaioId);
  const registrosExistentes = params.ensaioId
    ? getPresencaByEnsaio(params.ensaioId)
    : [];

  // Filtrar integrantes dos blocos participantes do ensaio
  const integrantesDoEnsaio = useMemo(() => {
    if (!ensaio) return [];

    // Se "Todos os blocos" ou lista vazia, incluir todos os integrantes
    if (
      ensaio.blocosIds.length === 0 ||
      ensaio.blocosIds.includes("todos")
    ) {
      return integrantes;
    }

    // Filtrar integrantes que pertencem aos blocos do ensaio
    return integrantes.filter((integrante) =>
      integrante.blocosIds.some((blocoId) =>
        ensaio.blocosIds.includes(blocoId)
      )
    );
  }, [ensaio, integrantes]);

  // Estado local de presença
  const [presencas, setPresencas] = useState<Map<string, PresencaLocal>>(
    new Map()
  );
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar com registros existentes
  useEffect(() => {
    const inicial = new Map<string, PresencaLocal>();

    // Primeiro, marcar todos como ausentes por padrão
    integrantesDoEnsaio.forEach((integrante) => {
      inicial.set(integrante.id, {
        integranteId: integrante.id,
        status: "ausente",
      });
    });

    // Depois, sobrescrever com registros existentes
    registrosExistentes.forEach((registro) => {
      inicial.set(registro.integranteId, {
        integranteId: registro.integranteId,
        status: registro.status,
        justificativa: registro.justificativa,
      });
    });

    setPresencas(inicial);
  }, [integrantesDoEnsaio, registrosExistentes]);

  // Alternar status de presença
  const togglePresenca = (integranteId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setPresencas((prev) => {
      const novo = new Map(prev);
      const atual = novo.get(integranteId);

      if (!atual) return prev;

      // Ciclo: ausente -> presente -> justificado -> ausente
      let novoStatus: StatusPresenca;
      if (atual.status === "ausente") {
        novoStatus = "presente";
      } else if (atual.status === "presente") {
        novoStatus = "justificado";
      } else {
        novoStatus = "ausente";
      }

      novo.set(integranteId, {
        ...atual,
        status: novoStatus,
      });

      return novo;
    });
  };

  // Marcar todos como presentes
  const marcarTodosPresentes = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setPresencas((prev) => {
      const novo = new Map(prev);
      novo.forEach((valor, chave) => {
        novo.set(chave, { ...valor, status: "presente" });
      });
      return novo;
    });
  };

  // Salvar presença
  const handleSave = async () => {
    if (!params.ensaioId) return;

    setIsSaving(true);

    try {
      const promises = Array.from(presencas.values()).map((p) =>
        registrarPresenca(
          params.ensaioId!,
          p.integranteId,
          p.status,
          p.justificativa
        )
      );

      await Promise.all(promises);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Sucesso", "Presença registrada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao salvar presença:", error);
      Alert.alert("Erro", "Não foi possível salvar a presença. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Estatísticas
  const estatisticas = useMemo(() => {
    const valores = Array.from(presencas.values());
    return {
      total: valores.length,
      presentes: valores.filter((p) => p.status === "presente").length,
      ausentes: valores.filter((p) => p.status === "ausente").length,
      justificados: valores.filter((p) => p.status === "justificado").length,
    };
  }, [presencas]);

  const taxaPresenca =
    estatisticas.total > 0
      ? Math.round(
          ((estatisticas.presentes + estatisticas.justificados) /
            estatisticas.total) *
            100
        )
      : 0;

  // Obter cor e ícone do status
  const getStatusStyle = (status: StatusPresenca) => {
    switch (status) {
      case "presente":
        return {
          bg: "bg-success",
          text: "text-white",
          icon: "✓",
          label: "Presente",
        };
      case "justificado":
        return {
          bg: "bg-warning",
          text: "text-white",
          icon: "!",
          label: "Justificado",
        };
      default:
        return {
          bg: "bg-error",
          text: "text-white",
          icon: "✕",
          label: "Ausente",
        };
    }
  };

  if (!ensaio) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-xl font-semibold mb-2">
            Ensaio não encontrado
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-xl mt-4"
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
            disabled={isSaving}
          >
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            Registro de Presença
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="p-2"
            disabled={isSaving}
          >
            <Text className="text-primary text-base font-semibold">
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info do Ensaio */}
        <View className="bg-surface p-4 border-b border-border">
          <Text className="text-foreground text-lg font-semibold">
            {ensaio.data}
          </Text>
          <Text className="text-muted text-sm">
            {ensaio.horario} • {ensaio.local}
          </Text>
        </View>

        {/* Estatísticas */}
        <View className="flex-row p-4 gap-3">
          <View className="flex-1 bg-success/10 rounded-xl p-3 items-center">
            <Text className="text-success text-2xl font-bold">
              {estatisticas.presentes}
            </Text>
            <Text className="text-success text-xs">Presentes</Text>
          </View>
          <View className="flex-1 bg-warning/10 rounded-xl p-3 items-center">
            <Text className="text-warning text-2xl font-bold">
              {estatisticas.justificados}
            </Text>
            <Text className="text-warning text-xs">Justificados</Text>
          </View>
          <View className="flex-1 bg-error/10 rounded-xl p-3 items-center">
            <Text className="text-error text-2xl font-bold">
              {estatisticas.ausentes}
            </Text>
            <Text className="text-error text-xs">Ausentes</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-3 items-center">
            <Text className="text-primary text-2xl font-bold">
              {taxaPresenca}%
            </Text>
            <Text className="text-primary text-xs">Taxa</Text>
          </View>
        </View>

        {/* Botão Marcar Todos */}
        <View className="px-4 pb-2">
          <TouchableOpacity
            onPress={marcarTodosPresentes}
            className="bg-surface border border-border rounded-xl py-3 items-center"
          >
            <Text className="text-foreground font-medium">
              ✓ Marcar Todos como Presentes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Integrantes */}
        <ScrollView className="flex-1 px-4">
          <View className="gap-2 pb-6">
            {integrantesDoEnsaio.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-muted text-center">
                  Nenhum integrante cadastrado para este ensaio.
                </Text>
              </View>
            ) : (
              integrantesDoEnsaio.map((integrante) => {
                const presenca = presencas.get(integrante.id);
                const statusStyle = getStatusStyle(presenca?.status || "ausente");

                return (
                  <TouchableOpacity
                    key={integrante.id}
                    onPress={() => togglePresenca(integrante.id)}
                    className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3 active:opacity-70"
                  >
                    {/* Indicador de Status */}
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${statusStyle.bg}`}
                    >
                      <Text className={`text-lg font-bold ${statusStyle.text}`}>
                        {statusStyle.icon}
                      </Text>
                    </View>

                    {/* Info do Integrante */}
                    <View className="flex-1">
                      <Text className="text-foreground text-base font-medium">
                        {integrante.nome}
                      </Text>
                      <Text className="text-muted text-xs">
                        Toque para alterar status
                      </Text>
                    </View>

                    {/* Badge de Status */}
                    <View
                      className={`px-3 py-1 rounded-full ${statusStyle.bg}`}
                    >
                      <Text className={`text-xs font-semibold ${statusStyle.text}`}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
