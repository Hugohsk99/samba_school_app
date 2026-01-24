import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useMemo } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { blocos, integrantes, ensaios, materiais, registrosPresenca, isLoading } = useData();

  // Calcular estatísticas
  const stats = useMemo(() => {
    const ensaiosAgendados = ensaios.filter(e => e.status === 'agendado');
    const proximoEnsaio = ensaiosAgendados[0];
    
    // Calcular presença média
    const ensaiosComPresenca = ensaios.filter(e => {
      const registros = registrosPresenca.filter(r => r.ensaioId === e.id);
      return registros.length > 0;
    });
    
    let presencaMedia = 0;
    if (ensaiosComPresenca.length > 0) {
      const taxas = ensaiosComPresenca.map(e => {
        const registros = registrosPresenca.filter(r => r.ensaioId === e.id);
        const presentes = registros.filter(r => r.status === 'presente' || r.status === 'justificado').length;
        return registros.length > 0 ? (presentes / registros.length) * 100 : 0;
      });
      presencaMedia = Math.round(taxas.reduce((a, b) => a + b, 0) / taxas.length);
    }

    return {
      totalBlocos: blocos.length,
      totalIntegrantes: integrantes.length,
      totalEnsaios: ensaios.length,
      ensaiosAgendados: ensaiosAgendados.length,
      proximoEnsaio,
      presencaMedia,
    };
  }, [blocos, integrantes, ensaios, registrosPresenca]);

  // Alertas
  const alertas = useMemo(() => {
    const lista = [];
    
    if (stats.ensaiosAgendados > 0) {
      lista.push({
        tipo: 'info',
        titulo: 'Próximo Ensaio',
        mensagem: `${stats.proximoEnsaio?.data} às ${stats.proximoEnsaio?.horario}`,
        cor: 'bg-primary/10',
        textoCor: 'text-primary',
      });
    }
    
    if (blocos.length === 0) {
      lista.push({
        tipo: 'warning',
        titulo: 'Cadastre seus blocos',
        mensagem: 'Comece adicionando os blocos da escola',
        cor: 'bg-warning/10',
        textoCor: 'text-warning',
      });
    }
    
    if (integrantes.length === 0 && blocos.length > 0) {
      lista.push({
        tipo: 'warning',
        titulo: 'Adicione integrantes',
        mensagem: 'Cadastre os membros de cada bloco',
        cor: 'bg-warning/10',
        textoCor: 'text-warning',
      });
    }

    return lista;
  }, [stats, blocos, integrantes]);

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-muted mt-4">Carregando dados...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View>
            <Text className="text-3xl font-bold text-foreground">
              Gestão Samba
            </Text>
            <Text className="text-base text-muted mt-1">
              Painel de controle da escola
            </Text>
          </View>

          {/* Cards de Estatísticas */}
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/blocos")}
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border active:opacity-70"
            >
              <Text className="text-muted text-sm">Blocos</Text>
              <Text className="text-foreground text-3xl font-bold mt-1">
                {stats.totalBlocos}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/blocos")}
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border active:opacity-70"
            >
              <Text className="text-muted text-sm">Integrantes</Text>
              <Text className="text-foreground text-3xl font-bold mt-1">
                {stats.totalIntegrantes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/ensaios")}
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border active:opacity-70"
            >
              <Text className="text-muted text-sm">Ensaios</Text>
              <Text className="text-foreground text-3xl font-bold mt-1">
                {stats.totalEnsaios}
              </Text>
            </TouchableOpacity>

            <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-sm">Presença Média</Text>
              <Text className="text-success text-3xl font-bold mt-1">
                {stats.presencaMedia > 0 ? `${stats.presencaMedia}%` : '—'}
              </Text>
            </View>
          </View>

          {/* Alertas */}
          {alertas.length > 0 && (
            <View className="gap-3">
              <Text className="text-foreground text-lg font-semibold">
                Alertas
              </Text>
              {alertas.map((alerta, index) => (
                <View
                  key={index}
                  className={`${alerta.cor} rounded-xl p-4`}
                >
                  <Text className={`${alerta.textoCor} font-semibold`}>
                    {alerta.titulo}
                  </Text>
                  <Text className={`${alerta.textoCor} text-sm mt-1 opacity-80`}>
                    {alerta.mensagem}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ações Rápidas */}
          <View className="gap-3">
            <Text className="text-foreground text-lg font-semibold">
              Ações Rápidas
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push("/bloco-form")}
                className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
              >
                <Text className="text-white text-2xl mb-1">+</Text>
                <Text className="text-white text-sm font-medium">
                  Novo Bloco
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/ensaio-form")}
                className="flex-1 bg-surface border border-border rounded-xl py-4 items-center active:opacity-80"
              >
                <Text className="text-foreground text-2xl mb-1">📅</Text>
                <Text className="text-foreground text-sm font-medium">
                  Novo Ensaio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/integrante-form")}
                className="flex-1 bg-surface border border-border rounded-xl py-4 items-center active:opacity-80"
              >
                <Text className="text-foreground text-2xl mb-1">👤</Text>
                <Text className="text-foreground text-sm font-medium">
                  Integrante
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Próximos Ensaios */}
          {stats.ensaiosAgendados > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-lg font-semibold">
                  Próximos Ensaios
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/ensaios")}>
                  <Text className="text-primary text-sm">Ver todos</Text>
                </TouchableOpacity>
              </View>

              {ensaios
                .filter(e => e.status === 'agendado')
                .slice(0, 3)
                .map((ensaio) => (
                  <TouchableOpacity
                    key={ensaio.id}
                    onPress={() => router.push({
                      pathname: "/registro-presenca",
                      params: { ensaioId: ensaio.id },
                    })}
                    className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-4 active:opacity-70"
                  >
                    <View className="items-center">
                      <Text className="text-foreground text-xl font-bold">
                        {ensaio.data.split(' ')[0]}
                      </Text>
                      <Text className="text-muted text-xs">
                        {ensaio.data.split(' ')[1]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-medium">
                        {ensaio.descricao || 'Ensaio'}
                      </Text>
                      <Text className="text-muted text-sm">
                        {ensaio.horario} • {ensaio.local}
                      </Text>
                    </View>
                    <View className="bg-primary px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-semibold">
                        AGENDADO
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Blocos Recentes */}
          {blocos.length > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-lg font-semibold">
                  Blocos
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/blocos")}>
                  <Text className="text-primary text-sm">Ver todos</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {blocos.slice(0, 5).map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => router.push({
                        pathname: "/bloco-detalhes",
                        params: { id: bloco.id },
                      })}
                      className="bg-surface rounded-xl p-4 border border-border w-36 active:opacity-70"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: `${bloco.cor}20` }}
                      >
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bloco.cor }}
                        />
                      </View>
                      <Text className="text-foreground font-semibold" numberOfLines={1}>
                        {bloco.nome}
                      </Text>
                      <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                        {bloco.responsavel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
