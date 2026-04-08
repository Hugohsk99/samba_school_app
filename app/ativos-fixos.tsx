import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

type CategoriaAtivo = "carnavalescos" | "instrumentos" | "fantasias" | "alegorias" | "aderecos" | "equipamentos" | "moveis" | "outros";
type StatusAtivo = "bom" | "regular" | "ruim" | "manutencao" | "baixado";

const CATEGORIAS: { value: CategoriaAtivo; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: "carnavalescos", label: "Carnavalescos", icon: "celebration" },
  { value: "instrumentos", label: "Instrumentos", icon: "music-note" },
  { value: "fantasias", label: "Fantasias", icon: "checkroom" },
  { value: "alegorias", label: "Alegorias", icon: "directions-car" },
  { value: "aderecos", label: "Adereços", icon: "auto-awesome" },
  { value: "equipamentos", label: "Equipamentos", icon: "build" },
  { value: "moveis", label: "Móveis", icon: "chair" },
  { value: "outros", label: "Outros", icon: "category" },
];

const STATUS_OPTIONS: { value: StatusAtivo; label: string; color: string }[] = [
  { value: "bom", label: "Bom", color: "#22C55E" },
  { value: "regular", label: "Regular", color: "#F59E0B" },
  { value: "ruim", label: "Ruim", color: "#EF4444" },
  { value: "manutencao", label: "Manutenção", color: "#3B82F6" },
  { value: "baixado", label: "Baixado", color: "#6B7280" },
];

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

// Componente de seleção de categoria
function CategoriaSelector({
  selected,
  onSelect,
}: {
  selected: CategoriaAtivo;
  onSelect: (cat: CategoriaAtivo) => void;
}) {
  const colors = useColors();
  return (
    <View className="flex-row flex-wrap gap-2">
      {CATEGORIAS.map((cat) => {
        const isSelected = selected === cat.value;
        return (
          <TouchableOpacity
            key={cat.value}
            onPress={() => onSelect(cat.value)}
            activeOpacity={0.7}
            className="rounded-xl px-3 py-2 border"
            style={{
              backgroundColor: isSelected ? colors.primary + "15" : "transparent",
              borderColor: isSelected ? colors.primary : colors.border,
            }}
          >
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons
                name={cat.icon}
                size={16}
                color={isSelected ? colors.primary : colors.muted}
              />
              <Text
                className="text-xs font-medium"
                style={{ color: isSelected ? colors.primary : colors.muted }}
              >
                {cat.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Componente de seleção de status
function StatusSelector({
  selected,
  onSelect,
}: {
  selected: StatusAtivo;
  onSelect: (s: StatusAtivo) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {STATUS_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
            className="rounded-xl px-3 py-2 border"
            style={{
              backgroundColor: isSelected ? opt.color + "15" : "transparent",
              borderColor: isSelected ? opt.color : "#E5E7EB",
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: isSelected ? opt.color : "#687076" }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Formulário de Ativo
function AtivoForm({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEditing,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing: boolean;
}) {
  const colors = useColors();
  const [nome, setNome] = useState(initialData?.nome || "");
  const [descricao, setDescricao] = useState(initialData?.descricao || "");
  const [categoria, setCategoria] = useState<CategoriaAtivo>(initialData?.categoria || "outros");
  const [valor, setValor] = useState(initialData?.valor || "");
  const [status, setStatus] = useState<StatusAtivo>(initialData?.status || "bom");
  const [localizacao, setLocalizacao] = useState(initialData?.localizacao || "");
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || "");
  const [dataAquisicao, setDataAquisicao] = useState(
    initialData?.dataAquisicao ? formatDate(initialData.dataAquisicao) : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do ativo é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      // Parse date from DD/MM/YYYY to ISO
      let parsedDate: string | undefined;
      if (dataAquisicao) {
        const parts = dataAquisicao.split("/");
        if (parts.length === 3) {
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      await onSubmit({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        categoria,
        valor: valor.replace(/[^\d.,]/g, "").replace(",", ".") || "0.00",
        status,
        localizacao: localizacao.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        dataAquisicao: parsedDate,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o ativo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Máscara de data DD/MM/AAAA
  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = "";
    if (cleaned.length <= 2) formatted = cleaned;
    else if (cleaned.length <= 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    else formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    setDataAquisicao(formatted);
  };

  // Máscara de valor monetário
  const handleValorChange = (text: string) => {
    setValor(text.replace(/[^\d.,]/g, ""));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={{ color: colors.primary }} className="text-base font-medium">Cancelar</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">
              {isEditing ? "Editar Ativo" : "Novo Ativo"}
            </Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.7}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary }} className="text-base font-bold">Salvar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>
            {/* Nome */}
            <Text className="text-sm font-semibold text-foreground mb-1">Nome *</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Surdo de Primeira"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              style={{ color: colors.foreground }}
            />

            {/* Categoria */}
            <Text className="text-sm font-semibold text-foreground mb-2">Categoria</Text>
            <View className="mb-4">
              <CategoriaSelector selected={categoria} onSelect={setCategoria} />
            </View>

            {/* Valor */}
            <Text className="text-sm font-semibold text-foreground mb-1">Valor (R$)</Text>
            <TextInput
              value={valor}
              onChangeText={handleValorChange}
              placeholder="0,00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              style={{ color: colors.foreground }}
            />

            {/* Data de Aquisição */}
            <Text className="text-sm font-semibold text-foreground mb-1">Data de Aquisição</Text>
            <TextInput
              value={dataAquisicao}
              onChangeText={handleDateChange}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={10}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              style={{ color: colors.foreground }}
            />

            {/* Status */}
            <Text className="text-sm font-semibold text-foreground mb-2">Condição</Text>
            <View className="mb-4">
              <StatusSelector selected={status} onSelect={setStatus} />
            </View>

            {/* Localização */}
            <Text className="text-sm font-semibold text-foreground mb-1">Localização</Text>
            <TextInput
              value={localizacao}
              onChangeText={setLocalizacao}
              placeholder="Ex: Barracão principal, Sala 2"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              style={{ color: colors.foreground }}
            />

            {/* Descrição */}
            <Text className="text-sm font-semibold text-foreground mb-1">Descrição</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Detalhes sobre o ativo..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              style={{ color: colors.foreground, minHeight: 80 }}
            />

            {/* Observações */}
            <Text className="text-sm font-semibold text-foreground mb-1">Observações</Text>
            <TextInput
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Notas adicionais..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              style={{ color: colors.foreground, minHeight: 60 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </Modal>
  );
}

// Componente de Card de Ativo
function AtivoCard({
  ativo,
  onPress,
  onEdit,
  onDelete,
}: {
  ativo: any;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const statusOpt = STATUS_OPTIONS.find((s) => s.value === ativo.status);
  const categoriaOpt = CATEGORIAS.find((c) => c.value === ativo.categoria);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-surface rounded-2xl p-4 border border-border mb-3"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons
              name={categoriaOpt?.icon || "category"}
              size={18}
              color={colors.primary}
            />
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {ativo.nome}
            </Text>
          </View>
          <Text className="text-xs text-muted mb-2">
            {categoriaOpt?.label || ativo.categoria}
            {ativo.localizacao ? ` • ${ativo.localizacao}` : ""}
          </Text>
        </View>
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={onEdit}
            activeOpacity={0.7}
            className="p-2"
          >
            <MaterialIcons name="edit" size={18} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.7}
            className="p-2"
          >
            <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">
          {formatCurrency(ativo.valor)}
        </Text>
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: (statusOpt?.color || "#6B7280") + "15" }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: statusOpt?.color || "#6B7280" }}
          >
            {statusOpt?.label || ativo.status}
          </Text>
        </View>
      </View>

      {ativo.dataAquisicao && (
        <Text className="text-xs text-muted mt-1">
          Adquirido em {formatDate(ativo.dataAquisicao)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Detalhe do Ativo (Modal)
function AtivoDetalheModal({
  visible,
  ativo,
  onClose,
  onEdit,
}: {
  visible: boolean;
  ativo: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  const colors = useColors();
  if (!ativo) return null;

  const statusOpt = STATUS_OPTIONS.find((s) => s.value === ativo.status);
  const categoriaOpt = CATEGORIAS.find((c) => c.value === ativo.categoria);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Detalhes do Ativo</Text>
          <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
            <MaterialIcons name="edit" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}>
          {/* Nome e Categoria */}
          <View className="items-center mb-6">
            <View style={{ backgroundColor: colors.primary + "15" }} className="w-16 h-16 rounded-2xl items-center justify-center mb-3">
              <MaterialIcons name={categoriaOpt?.icon || "category"} size={32} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center">{ativo.nome}</Text>
            <Text className="text-sm text-muted">{categoriaOpt?.label || ativo.categoria}</Text>
          </View>

          {/* Valor e Status */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-xs text-muted mb-1">Valor</Text>
              <Text className="text-lg font-bold text-foreground">{formatCurrency(ativo.valor)}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-xs text-muted mb-1">Condição</Text>
              <View
                className="px-3 py-1 rounded-full mt-0.5"
                style={{ backgroundColor: (statusOpt?.color || "#6B7280") + "15" }}
              >
                <Text className="text-sm font-bold" style={{ color: statusOpt?.color || "#6B7280" }}>
                  {statusOpt?.label || ativo.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Informações */}
          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            {[
              { label: "Localização", value: ativo.localizacao },
              { label: "Data de Aquisição", value: ativo.dataAquisicao ? formatDate(ativo.dataAquisicao) : null },
              { label: "Última Manutenção", value: ativo.dataUltimaManutencao ? formatDate(ativo.dataUltimaManutencao) : null },
              { label: "Cadastrado em", value: ativo.criadoEm ? formatDate(ativo.criadoEm) : null },
            ].filter(item => item.value).map((item, i) => (
              <View key={i} className="flex-row items-center justify-between py-2 border-b border-border/30">
                <Text className="text-sm text-muted">{item.label}</Text>
                <Text className="text-sm font-medium text-foreground">{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Descrição */}
          {ativo.descricao && (
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Descrição</Text>
              <Text className="text-sm text-muted leading-5">{ativo.descricao}</Text>
            </View>
          )}

          {/* Observações */}
          {ativo.observacoes && (
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Observações</Text>
              <Text className="text-sm text-muted leading-5">{ativo.observacoes}</Text>
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    </Modal>
  );
}

export default function AtivosFixosScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaAtivo | "todos">("todos");
  const [filtroStatus, setFiltroStatus] = useState<StatusAtivo | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<any>(null);
  const [selectedAtivo, setSelectedAtivo] = useState<any>(null);
  const [showDetalhe, setShowDetalhe] = useState(false);

  const ativosQuery = trpc.patrimonio.listar.useQuery(undefined, { retry: 1 });
  const criarMutation = trpc.patrimonio.criar.useMutation();
  const atualizarMutation = trpc.patrimonio.atualizar.useMutation();
  const excluirMutation = trpc.patrimonio.excluir.useMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await ativosQuery.refetch();
    setRefreshing(false);
  }, [ativosQuery]);

  const ativos = (ativosQuery.data || []) as any[];

  // Filtrar ativos
  const ativosFiltrados = ativos.filter((a) => {
    if (filtroCategoria !== "todos" && a.categoria !== filtroCategoria) return false;
    if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
    if (busca && !a.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  // Totais
  const totalValor = ativosFiltrados.reduce((sum, a) => sum + parseFloat(a.valor || "0"), 0);

  const handleCriar = async (data: any) => {
    await criarMutation.mutateAsync(data);
    await ativosQuery.refetch();
    setShowForm(false);
    Alert.alert("Sucesso", "Ativo cadastrado com sucesso!");
  };

  const handleAtualizar = async (data: any) => {
    if (!editingAtivo) return;
    await atualizarMutation.mutateAsync({ id: editingAtivo.id, ...data });
    await ativosQuery.refetch();
    setEditingAtivo(null);
    setShowForm(false);
    Alert.alert("Sucesso", "Ativo atualizado com sucesso!");
  };

  const handleExcluir = (ativo: any) => {
    Alert.alert(
      "Excluir Ativo",
      `Deseja realmente excluir "${ativo.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await excluirMutation.mutateAsync({ id: ativo.id });
              await ativosQuery.refetch();
              Alert.alert("Sucesso", "Ativo excluído.");
            } catch {
              Alert.alert("Erro", "Não foi possível excluir o ativo.");
            }
          },
        },
      ]
    );
  };

  const handleOpenEdit = (ativo: any) => {
    setEditingAtivo(ativo);
    setShowForm(true);
    setShowDetalhe(false);
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-foreground">Patrimônio</Text>
            <Text className="text-xs text-muted">{ativos.length} ativos cadastrados</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setEditingAtivo(null);
            setShowForm(true);
          }}
          activeOpacity={0.7}
          className="bg-primary rounded-full p-2.5"
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      <View className="mx-4 mt-2 mb-3 bg-surface rounded-xl p-3 border border-border flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted">Valor Total</Text>
          <Text className="text-lg font-bold" style={{ color: colors.primary }}>
            {formatCurrency(totalValor)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-muted">Exibindo</Text>
          <Text className="text-sm font-semibold text-foreground">
            {ativosFiltrados.length} de {ativos.length}
          </Text>
        </View>
      </View>

      {/* Busca */}
      <View className="mx-4 mb-3">
        <View className="flex-row items-center bg-surface border border-border rounded-xl px-3">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar ativo..."
            placeholderTextColor={colors.muted}
            className="flex-1 py-2.5 px-2 text-foreground"
            style={{ color: colors.foreground }}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca("")}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de Categoria */}
      <View className="mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          <TouchableOpacity
            onPress={() => setFiltroCategoria("todos")}
            activeOpacity={0.7}
            className="px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: filtroCategoria === "todos" ? colors.primary + "15" : "transparent",
              borderColor: filtroCategoria === "todos" ? colors.primary : colors.border,
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: filtroCategoria === "todos" ? colors.primary : colors.muted }}
            >
              Todos
            </Text>
          </TouchableOpacity>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setFiltroCategoria(cat.value)}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-full border flex-row items-center gap-1"
              style={{
                backgroundColor: filtroCategoria === cat.value ? colors.primary + "15" : "transparent",
                borderColor: filtroCategoria === cat.value ? colors.primary : colors.border,
              }}
            >
              <MaterialIcons
                name={cat.icon}
                size={14}
                color={filtroCategoria === cat.value ? colors.primary : colors.muted}
              />
              <Text
                className="text-xs font-medium"
                style={{ color: filtroCategoria === cat.value ? colors.primary : colors.muted }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtros de Status */}
      <View className="mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          <TouchableOpacity
            onPress={() => setFiltroStatus("todos")}
            activeOpacity={0.7}
            className="px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: filtroStatus === "todos" ? "#6B728015" : "transparent",
              borderColor: filtroStatus === "todos" ? "#6B7280" : colors.border,
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: filtroStatus === "todos" ? "#6B7280" : colors.muted }}
            >
              Todos
            </Text>
          </TouchableOpacity>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFiltroStatus(opt.value)}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: filtroStatus === opt.value ? opt.color + "15" : "transparent",
                borderColor: filtroStatus === opt.value ? opt.color : colors.border,
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: filtroStatus === opt.value ? opt.color : colors.muted }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {ativosQuery.isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Carregando ativos...</Text>
          </View>
        ) : ativosFiltrados.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialIcons name="inventory" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">
              {ativos.length === 0 ? "Nenhum ativo cadastrado" : "Nenhum ativo encontrado"}
            </Text>
            <Text className="text-sm text-muted text-center mt-2 px-8">
              {ativos.length === 0
                ? "Comece cadastrando os bens da escola de samba."
                : "Tente ajustar os filtros ou a busca."}
            </Text>
            {ativos.length === 0 && (
              <TouchableOpacity
                onPress={() => {
                  setEditingAtivo(null);
                  setShowForm(true);
                }}
                className="mt-4 bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-background font-semibold">Cadastrar Primeiro Ativo</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          ativosFiltrados.map((ativo) => (
            <AtivoCard
              key={ativo.id}
              ativo={ativo}
              onPress={() => {
                setSelectedAtivo(ativo);
                setShowDetalhe(true);
              }}
              onEdit={() => handleOpenEdit(ativo)}
              onDelete={() => handleExcluir(ativo)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal de Formulário */}
      <AtivoForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAtivo(null);
        }}
        onSubmit={editingAtivo ? handleAtualizar : handleCriar}
        initialData={editingAtivo}
        isEditing={!!editingAtivo}
      />

      {/* Modal de Detalhe */}
      <AtivoDetalheModal
        visible={showDetalhe}
        ativo={selectedAtivo}
        onClose={() => {
          setShowDetalhe(false);
          setSelectedAtivo(null);
        }}
        onEdit={() => {
          if (selectedAtivo) handleOpenEdit(selectedAtivo);
        }}
      />
    </ScreenContainer>
  );
}
