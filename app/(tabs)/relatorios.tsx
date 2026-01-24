import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";

export default function RelatoriosScreen() {
  const router = useRouter();
  const { integrantes, blocos, eventos, checkIns, materiais, entregasFantasias } = useData();
  const { escola } = useEscola();
  const { permissoes } = useAuth();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Calcular estatísticas reais
  const totalIntegrantes = integrantes.length;
  const totalEventos = eventos.length;
  const totalCheckIns = checkIns.length;
  const totalMateriais = materiais.length;
  
  const presencaMedia = totalIntegrantes > 0 && totalEventos > 0
    ? ((totalCheckIns / (totalIntegrantes * totalEventos)) * 100).toFixed(1)
    : "0";

  // Presença por bloco
  const estatisticasBlocos = blocos.map(bloco => {
    const integrantesBloco = integrantes.filter(i => i.blocosIds?.includes(bloco.id));
    const checkInsBloco = checkIns.filter(c => 
      integrantesBloco.some(i => i.id === c.integranteId)
    );
    const presenca = integrantesBloco.length > 0 && totalEventos > 0
      ? ((checkInsBloco.length / (integrantesBloco.length * totalEventos)) * 100).toFixed(0)
      : 0;
    
    return {
      nome: bloco.nome,
      presenca: Number(presenca),
      integrantes: integrantesBloco.length,
      cor: corPrimaria,
    };
  }).sort((a, b) => b.presenca - a.presenca).slice(0, 5);

  // Inventário por categoria
  const categoriasMateriais = [...new Set(materiais.map(m => m.categoria))];
  const inventarioResumo = categoriasMateriais.map(categoria => {
    const materiaisCategoria = materiais.filter(m => m.categoria === categoria);
    const total = materiaisCategoria.reduce((acc, m) => acc + (m.quantidadeDisponivel || 0) + (m.quantidadeEmUso || 0), 0);
    const emUso = materiaisCategoria.reduce((acc, m) => acc + (m.quantidadeEmUso || 0), 0);
    
    return {
      categoria,
      total,
      emUso,
      cor: corPrimaria,
    };
  }).slice(0, 5);

  // Entregas pendentes
  const entregasPendentes = entregasFantasias.filter(e => e.status === "entregue");

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            📊 Relatórios
          </Text>
          <Text className="text-base text-muted mt-1">
            Visualize estatísticas e dados consolidados
          </Text>
        </View>

        <View className="px-6 gap-4 pb-6">
          {/* Botão de Exportar Relatórios (apenas para gestores) */}
          {permissoes.verRelatoriosPresenca && (
            <TouchableOpacity
              onPress={() => router.push("/relatorios-pdf")}
              className="flex-row items-center justify-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: corPrimaria }}
              activeOpacity={0.8}
            >
              <Text className="text-2xl">📄</Text>
              <Text className="text-white text-lg font-bold">
                Gerar Relatórios para Impressão
              </Text>
            </TouchableOpacity>
          )}

          {/* Card: Resumo Geral */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              📈 Resumo Geral
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Total de Eventos</Text>
                <Text className="text-foreground text-2xl font-bold">{totalEventos}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Presença Média</Text>
                <Text className="text-success text-2xl font-bold">{presencaMedia}%</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Total de Integrantes</Text>
                <Text className="text-foreground text-2xl font-bold">{totalIntegrantes}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Itens no Estoque</Text>
                <Text className="text-foreground text-2xl font-bold">{totalMateriais}</Text>
              </View>
            </View>
          </View>

          {/* Card: Presença por Bloco */}
          {estatisticasBlocos.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-xl font-bold mb-4">
                👥 Presença por Bloco
              </Text>
              <Text className="text-muted text-xs mb-4">
                Taxa de presença nos eventos
              </Text>
              <View className="gap-4">
                {estatisticasBlocos.map((bloco, index) => (
                  <View key={index}>
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2 flex-1">
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: corPrimaria, opacity: 1 - (index * 0.15) }}
                        />
                        <Text className="text-foreground text-sm font-medium">
                          {bloco.nome}
                        </Text>
                        <Text className="text-muted text-xs">
                          ({bloco.integrantes} integrantes)
                        </Text>
                      </View>
                      <Text className="text-foreground text-sm font-semibold">
                        {bloco.presenca}%
                      </Text>
                    </View>
                    <View className="bg-border rounded-full h-2 overflow-hidden">
                      <View
                        className="h-full"
                        style={{
                          backgroundColor: corPrimaria,
                          width: `${bloco.presenca}%`,
                          opacity: 1 - (index * 0.15),
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
              
              {estatisticasBlocos.length === 0 && (
                <View className="items-center py-4">
                  <Text className="text-muted text-center">
                    Cadastre blocos e integrantes para ver estatísticas
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Card: Inventário por Categoria */}
          {inventarioResumo.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-foreground text-xl font-bold mb-4">
                📦 Inventário por Categoria
              </Text>
              <View className="gap-4">
                {inventarioResumo.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between p-3 bg-background rounded-xl"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: corPrimaria + "20" }}
                      >
                        <Text className="text-lg">📦</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground text-sm font-semibold">
                          {item.categoria}
                        </Text>
                        <Text className="text-muted text-xs mt-0.5">
                          {item.total} itens cadastrados
                        </Text>
                      </View>
                    </View>
                    {item.emUso > 0 ? (
                      <View className="bg-warning/20 px-2 py-1 rounded-full">
                        <Text className="text-warning text-xs font-semibold">
                          {item.emUso} em uso
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-success/20 px-2 py-1 rounded-full">
                        <Text className="text-success text-xs font-semibold">
                          Disponível
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Card: Entregas Pendentes */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              ⚠️ Entregas Pendentes de Devolução
            </Text>
            
            {entregasPendentes.length > 0 ? (
              <View className="gap-3">
                {entregasPendentes.slice(0, 5).map((entrega, index) => {
                  const material = materiais.find(m => m.id === entrega.materialId);
                  const integrante = integrantes.find(i => i.id === entrega.integranteId);
                  const diasEmprestado = Math.floor(
                    (Date.now() - new Date(entrega.dataEntrega).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const atrasado = diasEmprestado > 30;
                  
                  return (
                    <View
                      key={index}
                      className="p-3 bg-background rounded-xl border"
                      style={{ borderColor: atrasado ? "#EF4444" : "#E5E7EB" }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-foreground font-semibold">
                            {material?.nome || "Material"}
                          </Text>
                          <Text className="text-muted text-xs">
                            → {integrante?.nome || "Integrante"}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-muted text-xs">
                            {diasEmprestado} dias
                          </Text>
                          {atrasado && (
                            <Text className="text-error text-xs font-bold">
                              ⚠️ Atrasado
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
                
                {entregasPendentes.length > 5 && (
                  <Text className="text-muted text-center text-sm">
                    +{entregasPendentes.length - 5} entregas pendentes
                  </Text>
                )}
              </View>
            ) : (
              <View className="items-center py-4">
                <Text className="text-4xl mb-2">✅</Text>
                <Text className="text-muted text-center">
                  Nenhuma entrega pendente de devolução
                </Text>
              </View>
            )}
          </View>

          {/* Card: Estatísticas de Check-ins */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-foreground text-xl font-bold mb-4">
              ✅ Estatísticas de Check-ins
            </Text>
            
            <View className="flex-row gap-3">
              <View className="flex-1 bg-background rounded-xl p-4 items-center">
                <Text className="text-3xl font-bold" style={{ color: corPrimaria }}>
                  {totalCheckIns}
                </Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Total de{"\n"}Check-ins
                </Text>
              </View>
              
              <View className="flex-1 bg-background rounded-xl p-4 items-center">
                <Text className="text-3xl font-bold text-success">
                  {totalEventos > 0 ? Math.round(totalCheckIns / totalEventos) : 0}
                </Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Média por{"\n"}Evento
                </Text>
              </View>
              
              <View className="flex-1 bg-background rounded-xl p-4 items-center">
                <Text className="text-3xl font-bold text-warning">
                  {integrantes.filter(i => !checkIns.some(c => c.integranteId === i.id)).length}
                </Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Nunca{"\n"}Compareceram
                </Text>
              </View>
            </View>
          </View>

          {/* Espaço extra no final */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
