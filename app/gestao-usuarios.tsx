/**
 * Tela de Gestão de Usuários
 * 
 * Permite aprovar, rejeitar e gerenciar permissões de usuários
 * Acessível apenas para presidente e diretores
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { usePermissions, Role, PERMISSOES_POR_ROLE } from "@/lib/permissions-context";

const ROLES_DISPONIVEIS: { value: Role; label: string; icon: string }[] = [
  { value: "presidente", label: "Presidente", icon: "👑" },
  { value: "diretor", label: "Diretor", icon: "🎯" },
  { value: "coordenador", label: "Coordenador", icon: "📋" },
  { value: "integrante", label: "Integrante", icon: "🎭" },
  { value: "contribuinte", label: "Contribuinte", icon: "💚" },
];

type TabAtiva = "todos" | "pendentes" | "solicitacoes";

export default function GestaoUsuariosScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAdmin, isGestor, temPermissao, role: meuRole } = usePermissions();

  const [tabAtiva, setTabAtiva] = useState<TabAtiva>("todos");
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<Role | null>(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [novoRole, setNovoRole] = useState<Role | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const usuariosQuery = trpc.usuarios.listar.useQuery(undefined, {
    enabled: temPermissao("usuarios.ver_todos"),
  });

  const pendentesQuery = trpc.usuarios.pendentes.useQuery(undefined, {
    enabled: temPermissao("escola.aprovar_usuarios"),
  });

  const solicitacoesQuery = trpc.solicitacoes.pendentes.useQuery(undefined, {
    enabled: temPermissao("escola.aprovar_usuarios"),
  });

  // Mutations
  const aprovarMutation = trpc.usuarios.aprovar.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Usuário aprovado com sucesso!");
      pendentesQuery.refetch();
      usuariosQuery.refetch();
      setUsuarioSelecionado(null);
      setNovoRole(null);
    },
    onError: (error) => Alert.alert("Erro", error.message),
  });

  const rejeitarMutation = trpc.usuarios.rejeitar.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Usuário rejeitado.");
      pendentesQuery.refetch();
      setUsuarioSelecionado(null);
    },
    onError: (error) => Alert.alert("Erro", error.message),
  });

  const alterarRoleMutation = trpc.usuarios.alterarRole.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Permissão alterada com sucesso!");
      usuariosQuery.refetch();
      setUsuarioSelecionado(null);
      setNovoRole(null);
    },
    onError: (error) => Alert.alert("Erro", error.message),
  });

  const suspenderMutation = trpc.usuarios.suspender.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Usuário suspenso.");
      usuariosQuery.refetch();
    },
    onError: (error) => Alert.alert("Erro", error.message),
  });

  const aprovarSolicitacaoMutation = trpc.solicitacoes.aprovar.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Solicitação aprovada!");
      solicitacoesQuery.refetch();
      usuariosQuery.refetch();
      setUsuarioSelecionado(null);
      setNovoRole(null);
    },
    onError: (error) => Alert.alert("Erro", error.message),
  });

  const rejeitarSolicitacaoMutation = trpc.solicitacoes.rejeitar.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Solicitação rejeitada.");
      solicitacoesQuery.refetch();
    },
    onError: (error) => Alert.alert("Erro", error.message),
  });

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      usuariosQuery.refetch(),
      pendentesQuery.refetch(),
      solicitacoesQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  // Filtrar usuários
  const usuariosFiltrados = (usuariosQuery.data || []).filter((u) => {
    if (busca) {
      const termo = busca.toLowerCase();
      if (!u.name?.toLowerCase().includes(termo) && !u.email?.toLowerCase().includes(termo)) {
        return false;
      }
    }
    if (filtroRole && u.role !== filtroRole) {
      return false;
    }
    return true;
  });

  // Aprovar usuário
  const handleAprovar = (usuarioId: number, role: Role) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    aprovarMutation.mutate({ usuarioId, role: role as "diretor" | "coordenador" | "integrante" | "contribuinte" });
  };

  // Rejeitar usuário
  const handleRejeitar = (usuarioId: number) => {
    Alert.alert(
      "Confirmar Rejeição",
      "Tem certeza que deseja rejeitar este usuário?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            rejeitarMutation.mutate({ usuarioId });
          },
        },
      ]
    );
  };

  // Alterar role
  const handleAlterarRole = (usuarioId: number, role: Role) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    alterarRoleMutation.mutate({ usuarioId, role: role as "presidente" | "diretor" | "coordenador" | "integrante" | "contribuinte" });
  };

  // Suspender usuário
  const handleSuspender = (usuarioId: number) => {
    Alert.alert(
      "Confirmar Suspensão",
      "Tem certeza que deseja suspender este usuário? Ele perderá acesso ao sistema.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Suspender",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            suspenderMutation.mutate({ usuarioId });
          },
        },
      ]
    );
  };

  // Verificar se pode alterar para determinado role
  const podeAlterarPara = (targetRole: Role): boolean => {
    if (meuRole === "master") return true;
    if (meuRole === "presidente") return targetRole !== "master";
    if (meuRole === "diretor") return ["coordenador", "integrante", "contribuinte"].includes(targetRole);
    return false;
  };

  // Obter info do role
  const getRoleInfo = (role: Role) => {
    return ROLES_DISPONIVEIS.find((r) => r.value === role) || { label: role, icon: "👤" };
  };

  // Verificar permissão de acesso
  if (!isGestor) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Acesso Restrito
          </Text>
          <Text className="text-muted text-center">
            Você não tem permissão para acessar esta área.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-primary px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-foreground text-xl font-bold">Gestão de Usuários</Text>
          <Text className="text-muted text-sm">Aprovar e gerenciar permissões</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-border">
        {[
          { id: "todos" as TabAtiva, label: "Todos", count: usuariosQuery.data?.length || 0 },
          { id: "pendentes" as TabAtiva, label: "Pendentes", count: pendentesQuery.data?.length || 0 },
          { id: "solicitacoes" as TabAtiva, label: "Solicitações", count: solicitacoesQuery.data?.length || 0 },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setTabAtiva(tab.id)}
            className={`flex-1 py-3 items-center ${tabAtiva === tab.id ? "border-b-2 border-primary" : ""}`}
            activeOpacity={0.7}
          >
            <Text className={`font-medium ${tabAtiva === tab.id ? "text-primary" : "text-muted"}`}>
              {tab.label}
              {tab.count > 0 && (
                <Text className={tabAtiva === tab.id ? "text-primary" : "text-muted"}>
                  {" "}({tab.count})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Busca (apenas na aba "todos") */}
      {tabAtiva === "todos" && (
        <View className="p-4 border-b border-border bg-surface">
          <View className="flex-row items-center bg-background rounded-xl px-4 py-3 border border-border">
            <Text className="text-xl mr-3">🔍</Text>
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou email..."
              placeholderTextColor={colors.muted}
              className="flex-1 text-foreground"
              autoCapitalize="none"
            />
            {busca && (
              <TouchableOpacity onPress={() => setBusca("")}>
                <Text className="text-muted text-xl">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filtro por role */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setFiltroRole(null)}
                className={`px-4 py-2 rounded-full ${!filtroRole ? "bg-primary" : "bg-background border border-border"}`}
                activeOpacity={0.8}
              >
                <Text className={`font-medium ${!filtroRole ? "text-white" : "text-foreground"}`}>
                  Todos
                </Text>
              </TouchableOpacity>
              {ROLES_DISPONIVEIS.filter((r) => r.value !== "master").map((role) => (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setFiltroRole(role.value)}
                  className={`px-4 py-2 rounded-full flex-row items-center ${
                    filtroRole === role.value ? "bg-primary" : "bg-background border border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="mr-1">{role.icon}</Text>
                  <Text className={`font-medium ${filtroRole === role.value ? "text-white" : "text-foreground"}`}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Conteúdo */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* TAB: Todos os usuários */}
        {tabAtiva === "todos" && (
          <View className="p-4 gap-3">
            {usuariosQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="my-8" />
            ) : usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((usuario) => {
                const roleInfo = getRoleInfo(usuario.role);
                const isSelected = usuarioSelecionado === usuario.id;

                return (
                  <View key={usuario.id}>
                    <TouchableOpacity
                      onPress={() => setUsuarioSelecionado(isSelected ? null : usuario.id)}
                      className="bg-surface rounded-xl p-4 border border-border"
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center">
                        {usuario.fotoUrl ? (
                          <Image
                            source={{ uri: usuario.fotoUrl }}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                        ) : (
                          <View className="w-12 h-12 rounded-full bg-muted/30 items-center justify-center mr-3">
                            <Text className="text-xl">👤</Text>
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-foreground font-bold">{usuario.name || "Sem nome"}</Text>
                          <Text className="text-muted text-sm">{usuario.email}</Text>
                          <View className="flex-row items-center mt-1">
                            <View
                              className="px-2 py-1 rounded flex-row items-center"
                              style={{ backgroundColor: colors.primary + "20" }}
                            >
                              <Text className="mr-1">{roleInfo.icon}</Text>
                              <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                                {roleInfo.label}
                              </Text>
                            </View>
                            {usuario.statusUsuario !== "aprovado" && (
                              <View className="ml-2 px-2 py-1 rounded bg-warning/20">
                                <Text className="text-xs text-warning font-medium">
                                  {usuario.statusUsuario}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text className="text-muted text-xl">{isSelected ? "▼" : "▶"}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Ações expandidas */}
                    {isSelected && (
                      <View className="bg-surface/50 rounded-b-xl p-4 border-x border-b border-border -mt-2 pt-6">
                        <Text className="text-foreground font-semibold mb-3">Alterar Permissão:</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                          {ROLES_DISPONIVEIS.filter((r) => r.value !== "master" && podeAlterarPara(r.value)).map((role) => (
                            <TouchableOpacity
                              key={role.value}
                              onPress={() => setNovoRole(role.value)}
                              className={`px-3 py-2 rounded-lg flex-row items-center ${
                                novoRole === role.value ? "bg-primary" : "bg-background border border-border"
                              }`}
                              activeOpacity={0.8}
                            >
                              <Text className="mr-1">{role.icon}</Text>
                              <Text className={novoRole === role.value ? "text-white" : "text-foreground"}>
                                {role.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <View className="flex-row gap-3">
                          {novoRole && novoRole !== usuario.role && (
                            <TouchableOpacity
                              onPress={() => handleAlterarRole(usuario.id, novoRole)}
                              disabled={alterarRoleMutation.isPending}
                              className="flex-1 bg-primary py-3 rounded-xl items-center"
                              activeOpacity={0.8}
                            >
                              {alterarRoleMutation.isPending ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text className="text-white font-semibold">Salvar Alteração</Text>
                              )}
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => handleSuspender(usuario.id)}
                            disabled={suspenderMutation.isPending}
                            className="px-4 py-3 rounded-xl bg-error/20 items-center"
                            activeOpacity={0.8}
                          >
                            <Text className="text-error font-semibold">Suspender</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="items-center py-12">
                <Text className="text-4xl mb-4">👥</Text>
                <Text className="text-foreground text-lg font-bold text-center">
                  Nenhum usuário encontrado
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB: Pendentes de aprovação */}
        {tabAtiva === "pendentes" && (
          <View className="p-4 gap-3">
            {pendentesQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="my-8" />
            ) : (pendentesQuery.data?.length || 0) > 0 ? (
              pendentesQuery.data?.map((usuario) => (
                <View key={usuario.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row items-center mb-4">
                    {usuario.fotoUrl ? (
                      <Image source={{ uri: usuario.fotoUrl }} className="w-12 h-12 rounded-full mr-3" />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-muted/30 items-center justify-center mr-3">
                        <Text className="text-xl">👤</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-foreground font-bold">{usuario.name || "Sem nome"}</Text>
                      <Text className="text-muted text-sm">{usuario.email}</Text>
                    </View>
                    <View className="px-2 py-1 rounded bg-warning/20">
                      <Text className="text-xs text-warning font-medium">Pendente</Text>
                    </View>
                  </View>

                  <Text className="text-foreground font-medium mb-2">Selecione o nível de acesso:</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {ROLES_DISPONIVEIS.filter((r) => r.value !== "master" && r.value !== "presidente").map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        onPress={() => {
                          setUsuarioSelecionado(usuario.id);
                          setNovoRole(role.value);
                        }}
                        className={`px-3 py-2 rounded-lg flex-row items-center ${
                          usuarioSelecionado === usuario.id && novoRole === role.value
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text className="mr-1">{role.icon}</Text>
                        <Text
                          className={
                            usuarioSelecionado === usuario.id && novoRole === role.value
                              ? "text-white"
                              : "text-foreground"
                          }
                        >
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleRejeitar(usuario.id)}
                      disabled={rejeitarMutation.isPending}
                      className="flex-1 py-3 rounded-xl bg-error/20 items-center"
                      activeOpacity={0.8}
                    >
                      <Text className="text-error font-semibold">Rejeitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (usuarioSelecionado === usuario.id && novoRole) {
                          handleAprovar(usuario.id, novoRole);
                        } else {
                          Alert.alert("Atenção", "Selecione um nível de acesso");
                        }
                      }}
                      disabled={aprovarMutation.isPending || usuarioSelecionado !== usuario.id || !novoRole}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{
                        backgroundColor:
                          usuarioSelecionado === usuario.id && novoRole ? colors.primary : colors.muted,
                      }}
                      activeOpacity={0.8}
                    >
                      {aprovarMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white font-semibold">Aprovar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-12">
                <Text className="text-4xl mb-4">✅</Text>
                <Text className="text-foreground text-lg font-bold text-center">
                  Nenhum usuário pendente
                </Text>
                <Text className="text-muted text-center mt-2">
                  Todos os usuários foram aprovados ou rejeitados
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB: Solicitações de acesso */}
        {tabAtiva === "solicitacoes" && (
          <View className="p-4 gap-3">
            {solicitacoesQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="my-8" />
            ) : (solicitacoesQuery.data?.length || 0) > 0 ? (
              solicitacoesQuery.data?.map((solicitacao) => (
                <View key={solicitacao.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-muted/30 items-center justify-center mr-3">
                      <Text className="text-xl">📩</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-bold">Solicitação #{solicitacao.id}</Text>
                      <Text className="text-muted text-sm">
                        {new Date(solicitacao.criadoEm).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>

                  {solicitacao.mensagem && (
                    <View className="bg-background rounded-lg p-3 mb-4">
                      <Text className="text-muted text-sm italic">"{solicitacao.mensagem}"</Text>
                    </View>
                  )}

                  <Text className="text-foreground font-medium mb-2">Selecione o nível de acesso:</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {ROLES_DISPONIVEIS.filter((r) => r.value !== "master" && r.value !== "presidente").map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        onPress={() => {
                          setUsuarioSelecionado(solicitacao.id);
                          setNovoRole(role.value);
                        }}
                        className={`px-3 py-2 rounded-lg flex-row items-center ${
                          usuarioSelecionado === solicitacao.id && novoRole === role.value
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text className="mr-1">{role.icon}</Text>
                        <Text
                          className={
                            usuarioSelecionado === solicitacao.id && novoRole === role.value
                              ? "text-white"
                              : "text-foreground"
                          }
                        >
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Rejeitar Solicitação",
                          "Deseja informar o motivo da rejeição?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Rejeitar sem motivo",
                              onPress: () => rejeitarSolicitacaoMutation.mutate({ solicitacaoId: solicitacao.id }),
                            },
                          ]
                        );
                      }}
                      disabled={rejeitarSolicitacaoMutation.isPending}
                      className="flex-1 py-3 rounded-xl bg-error/20 items-center"
                      activeOpacity={0.8}
                    >
                      <Text className="text-error font-semibold">Rejeitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (usuarioSelecionado === solicitacao.id && novoRole) {
                          aprovarSolicitacaoMutation.mutate({
                            solicitacaoId: solicitacao.id,
                            role: novoRole as "diretor" | "coordenador" | "integrante" | "contribuinte",
                          });
                        } else {
                          Alert.alert("Atenção", "Selecione um nível de acesso");
                        }
                      }}
                      disabled={
                        aprovarSolicitacaoMutation.isPending ||
                        usuarioSelecionado !== solicitacao.id ||
                        !novoRole
                      }
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{
                        backgroundColor:
                          usuarioSelecionado === solicitacao.id && novoRole ? colors.primary : colors.muted,
                      }}
                      activeOpacity={0.8}
                    >
                      {aprovarSolicitacaoMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white font-semibold">Aprovar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-12">
                <Text className="text-4xl mb-4">📭</Text>
                <Text className="text-foreground text-lg font-bold text-center">
                  Nenhuma solicitação pendente
                </Text>
                <Text className="text-muted text-center mt-2">
                  Não há novas solicitações de acesso
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
