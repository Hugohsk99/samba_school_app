/**
 * Área do Integrante - Acesso Limitado
 * Mostra: Carteirinha, Presença, Materiais Emprestados, Próximos Eventos
 */

import { useState, useEffect, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import type { Integrante, Evento, EntregaFantasia, CheckIn } from "@/lib/types";

export default function AreaIntegranteScreen() {
  const router = useRouter();
  const { sessao, logout, permissoes } = useAuth();
  const { integrantes, eventos, entregasFantasias, checkIns, materiais } = useData();
  const { escola } = useEscola();
  const { showSuccess } = useToast();

  const [refreshing, setRefreshing] = useState(false);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Dados do integrante logado
  const meusDados = useMemo(() => {
    if (!sessao?.integranteId || sessao.integranteId === "admin") return null;
    return integrantes.find(i => i.id === sessao.integranteId);
  }, [sessao, integrantes]);

  // Próximos eventos
  const proximosEventos = useMemo(() => {
    const hoje = new Date();
    return eventos
      .filter(e => new Date(e.data) >= hoje)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 3);
  }, [eventos]);

  // Materiais emprestados ao integrante
  const meusMateriaisEmprestados = useMemo(() => {
    if (!sessao?.integranteId) return [];
    return entregasFantasias
      .filter((e: EntregaFantasia) => e.integranteId === sessao.integranteId && !e.dataDevolucao)
      .map((entrega: EntregaFantasia) => {
        const material = materiais.find(m => m.id === entrega.materialId);
        return { ...entrega, material };
      });
  }, [sessao, entregasFantasias, materiais]);

  // Histórico de presença
  const minhaPresenca = useMemo(() => {
    if (!sessao?.integranteId) return { total: 0, presentes: 0, percentual: 0 };
    
    const meusCheckIns = checkIns.filter(c => c.integranteId === sessao.integranteId);
    const eventosPassados = eventos.filter(e => new Date(e.data) < new Date());
    
    const presentes = meusCheckIns.length;
    const total = eventosPassados.length;
    const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;
    
    return { total, presentes, percentual };
  }, [sessao, checkIns, eventos]);

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    showSuccess("Até logo!");
    router.replace("/login-integrante");
  };

  // Se não estiver logado como integrante
  if (!sessao || sessao.integranteId === "admin") {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Área do Integrante
          </Text>
          <Text className="text-muted text-center mb-6">
            Faça login com seus dados de integrante para acessar esta área.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/login-integrante")}
            className="px-8 py-4 rounded-xl"
            style={{ backgroundColor: corPrimaria }}
          >
            <Text className="text-white font-bold text-lg">Fazer Login</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header com dados do integrante */}
        <View 
          className="px-6 pt-6 pb-8"
          style={{ backgroundColor: corPrimaria }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white/80 text-sm">Olá,</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-white/80 text-sm">Sair →</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center">
            {meusDados?.foto ? (
              <Image
                source={{ uri: meusDados.foto }}
                className="w-20 h-20 rounded-full mr-4"
                style={{ backgroundColor: "white" }}
              />
            ) : (
              <View 
                className="w-20 h-20 rounded-full mr-4 items-center justify-center"
                style={{ backgroundColor: "white" }}
              >
                <Text className="text-4xl">👤</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                {sessao.nome.split(" ")[0]}
              </Text>
              <Text className="text-white/80">
                {meusDados?.categoria === "desfilante" ? "Desfilante" :
                 meusDados?.categoria === "segmento" ? "Segmento" : "Diretoria/Staff"}
              </Text>
              {meusDados?.blocosIds && meusDados.blocosIds.length > 0 && (
                <Text className="text-white/60 text-sm">{meusDados.blocosIds.length} bloco(s)</Text>
              )}
            </View>
          </View>
        </View>

        <View className="px-6 -mt-4">
          {/* Card de Presença */}
          <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground text-lg font-bold">📊 Minha Presença</Text>
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: minhaPresenca.percentual >= 75 ? "#22C55E20" : "#EF444420" }}
              >
                <Text 
                  className="font-bold"
                  style={{ color: minhaPresenca.percentual >= 75 ? "#22C55E" : "#EF4444" }}
                >
                  {minhaPresenca.percentual}%
                </Text>
              </View>
            </View>
            <Text className="text-muted">
              Presente em {minhaPresenca.presentes} de {minhaPresenca.total} eventos
            </Text>
            <View className="h-2 bg-border rounded-full mt-3 overflow-hidden">
              <View 
                className="h-full rounded-full"
                style={{ 
                  width: `${minhaPresenca.percentual}%`,
                  backgroundColor: minhaPresenca.percentual >= 75 ? "#22C55E" : "#EF4444"
                }}
              />
            </View>
          </View>

          {/* Ações Rápidas */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/carteirinha",
                params: { id: sessao.integranteId }
              })}
              className="flex-1 bg-surface rounded-2xl p-5 border border-border items-center"
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">🪪</Text>
              <Text className="text-foreground font-bold">Carteirinha</Text>
              <Text className="text-muted text-xs text-center">QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/editar-meus-dados" as any)}
              className="flex-1 bg-surface rounded-2xl p-5 border border-border items-center"
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">✏️</Text>
              <Text className="text-foreground font-bold">Meus Dados</Text>
              <Text className="text-muted text-xs text-center">Editar</Text>
            </TouchableOpacity>
          </View>

          {/* Materiais Emprestados */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
            <Text className="text-foreground text-lg font-bold mb-3">
              📦 Materiais Comigo ({meusMateriaisEmprestados.length})
            </Text>
            
            {meusMateriaisEmprestados.length === 0 ? (
              <Text className="text-muted text-center py-4">
                Você não tem materiais emprestados no momento
              </Text>
            ) : (
              <View className="gap-2">
                {meusMateriaisEmprestados.map((item: any) => (
                  <View 
                    key={item.id}
                    className="flex-row items-center bg-background rounded-xl p-3"
                  >
                    <Text className="text-2xl mr-3">👗</Text>
                    <View className="flex-1">
                      <Text className="text-foreground font-medium">
                        {item.material?.nome || "Material"}
                      </Text>
                      <Text className="text-muted text-xs">
                        Desde {new Date(item.dataEntrega).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View className="bg-warning/20 px-2 py-1 rounded-full">
                      <Text className="text-warning text-xs font-medium">Pendente</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Próximos Eventos */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-6">
            <Text className="text-foreground text-lg font-bold mb-3">
              📅 Próximos Eventos
            </Text>
            
            {proximosEventos.length === 0 ? (
              <Text className="text-muted text-center py-4">
                Nenhum evento agendado
              </Text>
            ) : (
              <View className="gap-2">
                {proximosEventos.map((evento) => (
                  <View 
                    key={evento.id}
                    className="flex-row items-center bg-background rounded-xl p-3"
                  >
                    <View 
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: corPrimaria + "20" }}
                    >
                      <Text className="text-xl">
                        {evento.tipo === "ensaio" ? "🎵" :
                         evento.tipo === "reuniao" ? "📋" :
                         evento.tipo === "desfile" ? "🎭" : "🎉"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-medium">{evento.titulo}</Text>
                      <Text className="text-muted text-xs">
                        {new Date(evento.data).toLocaleDateString("pt-BR")} às {evento.horario}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
