import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useMemo } from "react";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const { blocos, integrantes, ensaios, eventos, materiais, registrosPresenca, isLoading } = useData();
  const { escola, cores, isFirstAccess } = useEscola();

  // Redirecionar para onboarding se for primeiro acesso
  // (Comentado por enquanto - pode ser ativado depois)
  // useEffect(() => {
  //   if (isFirstAccess && !isLoading) {
  //     router.replace("/onboarding");
  //   }
  // }, [isFirstAccess, isLoading]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const eventosAgendados = eventos.filter(e => e.status === 'agendado');
    const proximoEvento = eventosAgendados[0];
    
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
      totalEventos: eventos.length,
      totalMateriais: materiais.length,
      eventosAgendados: eventosAgendados.length,
      proximoEvento,
      presencaMedia,
    };
  }, [blocos, integrantes, ensaios, eventos, materiais, registrosPresenca]);

  // Alertas
  const alertas = useMemo(() => {
    const lista = [];
    
    if (stats.eventosAgendados > 0 && stats.proximoEvento) {
      lista.push({
        tipo: 'info',
        titulo: '📅 Próximo Evento',
        mensagem: `${stats.proximoEvento.titulo} - ${stats.proximoEvento.data}`,
        cor: cores.primary,
      });
    }
    
    if (blocos.length === 0) {
      lista.push({
        tipo: 'warning',
        titulo: '🎭 Cadastre seus segmentos',
        mensagem: 'Comece adicionando os segmentos da escola',
        cor: '#F59E0B',
      });
    }
    
    if (integrantes.length === 0 && blocos.length > 0) {
      lista.push({
        tipo: 'warning',
        titulo: '👥 Adicione integrantes',
        mensagem: 'Cadastre os membros de cada segmento',
        cor: '#F59E0B',
      });
    }

    return lista;
  }, [stats, blocos, integrantes, cores]);

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={cores.primary} />
          <Text className="text-muted mt-4 text-lg">Carregando dados...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Logo e Nome da Escola */}
        <View 
          className="px-6 pt-6 pb-8 rounded-b-3xl"
          style={{ backgroundColor: cores.primary }}
        >
          <View className="flex-row items-center gap-4 mb-4">
            {escola?.logo ? (
              <Image
                source={{ uri: escola.logo }}
                className="w-16 h-16 rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              <View 
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Text className="text-3xl">🎭</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                {escola?.nome || 'Gestão Samba'}
              </Text>
              <Text className="text-white/80 text-base">
                Painel de controle
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handlePress(() => router.push("/configuracoes"))}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Text className="text-2xl">⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Botão de Tutorial */}
          <TouchableOpacity
            onPress={() => handlePress(() => router.push("/onboarding"))}
            className="flex-row items-center gap-2 bg-white/20 px-4 py-3 rounded-xl"
          >
            <Text className="text-xl">📖</Text>
            <Text className="text-white font-medium text-base flex-1">
              Ver Tutorial do Aplicativo
            </Text>
            <Text className="text-white/80">→</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 -mt-4 gap-6">
          {/* Cards de Estatísticas - Design Maior e Mais Legível */}
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              onPress={() => handlePress(() => router.push("/(tabs)/blocos"))}
              className="flex-1 min-w-[45%] bg-surface rounded-3xl p-5 border border-border"
              activeOpacity={0.7}
            >
              <View 
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: `${cores.primary}20` }}
              >
                <Text className="text-3xl">🎭</Text>
              </View>
              <Text className="text-muted text-base font-medium">Segmentos</Text>
              <Text className="text-foreground text-4xl font-bold mt-1">
                {stats.totalBlocos}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePress(() => router.push("/integrantes"))}
              className="flex-1 min-w-[45%] bg-surface rounded-3xl p-5 border border-border"
              activeOpacity={0.7}
            >
              <View 
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: `${cores.secondary}20` }}
              >
                <Text className="text-3xl">👥</Text>
              </View>
              <Text className="text-muted text-base font-medium">Integrantes</Text>
              <Text className="text-foreground text-4xl font-bold mt-1">
                {stats.totalIntegrantes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePress(() => router.push("/(tabs)/eventos"))}
              className="flex-1 min-w-[45%] bg-surface rounded-3xl p-5 border border-border"
              activeOpacity={0.7}
            >
              <View 
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: '#FFE66D20' }}
              >
                <Text className="text-3xl">📅</Text>
              </View>
              <Text className="text-muted text-base font-medium">Eventos</Text>
              <Text className="text-foreground text-4xl font-bold mt-1">
                {stats.totalEventos}
              </Text>
            </TouchableOpacity>

            <View className="flex-1 min-w-[45%] bg-surface rounded-3xl p-5 border border-border">
              <View 
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: '#22C55E20' }}
              >
                <Text className="text-3xl">📊</Text>
              </View>
              <Text className="text-muted text-base font-medium">Presença Média</Text>
              <Text className="text-success text-4xl font-bold mt-1">
                {stats.presencaMedia > 0 ? `${stats.presencaMedia}%` : '—'}
              </Text>
            </View>
          </View>

          {/* Alertas - Design Maior */}
          {alertas.length > 0 && (
            <View className="gap-4">
              <Text className="text-foreground text-xl font-bold">
                📢 Alertas
              </Text>
              {alertas.map((alerta, index) => (
                <View
                  key={index}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: `${alerta.cor}15` }}
                >
                  <Text 
                    className="font-bold text-lg"
                    style={{ color: alerta.cor }}
                  >
                    {alerta.titulo}
                  </Text>
                  <Text 
                    className="text-base mt-2"
                    style={{ color: alerta.cor, opacity: 0.8 }}
                  >
                    {alerta.mensagem}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ações Rápidas - Botões Maiores */}
          <View className="gap-4">
            <Text className="text-foreground text-xl font-bold">
              ⚡ Ações Rápidas
            </Text>
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/bloco-form"))}
                className="flex-row items-center gap-4 rounded-2xl p-5"
                style={{ backgroundColor: cores.primary }}
                activeOpacity={0.8}
              >
                <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
                  <Text className="text-3xl">➕</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Novo Bloco
                  </Text>
                  <Text className="text-white/80 text-base">
                    Adicionar um novo bloco à escola
                  </Text>
                </View>
                <Text className="text-white text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/evento-form"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: `${cores.secondary}20` }}
                >
                  <Text className="text-3xl">📅</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Novo Evento
                  </Text>
                  <Text className="text-muted text-base">
                    Agendar ensaio, reunião ou feijoada
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/integrante-form"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#AA96DA20' }}
                >
                  <Text className="text-3xl">👤</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Novo Integrante
                  </Text>
                  <Text className="text-muted text-base">
                    Cadastrar membro da escola
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/material-form"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#F3818120' }}
                >
                  <Text className="text-3xl">📦</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Novo Material
                  </Text>
                  <Text className="text-muted text-base">
                    Adicionar fantasia ou instrumento
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/financeiro"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#22C55E20' }}
                >
                  <Text className="text-3xl">💰</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Financeiro
                  </Text>
                  <Text className="text-muted text-base">
                    Controlar receitas e despesas
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/lembretes"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#F59E0B20' }}
                >
                  <Text className="text-3xl">🔔</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Lembretes
                  </Text>
                  <Text className="text-muted text-base">
                    Notificações e alertas
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gestão de Usuários - Apenas para gestores */}
          <View className="gap-4">
            <Text className="text-foreground text-xl font-bold">
              👑 Gestão
            </Text>
            <View className="gap-3">
              {/* Painel do Presidente - Destaque */}
              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/painel-presidente"))}
                className="flex-row items-center gap-4 rounded-2xl p-5"
                style={{ backgroundColor: cores.primary }}
                activeOpacity={0.8}
              >
                <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
                  <Text className="text-3xl">📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Painel do Presidente
                  </Text>
                  <Text className="text-white/80 text-base">
                    Métricas, alertas e aprovações
                  </Text>
                </View>
                <Text className="text-white/80 text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/gestao-usuarios"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: `${cores.primary}20` }}
                >
                  <Text className="text-3xl">👥</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Gestão de Usuários
                  </Text>
                  <Text className="text-muted text-base">
                    Aprovar e gerenciar permissões
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePress(() => router.push("/convites"))}
                className="flex-row items-center gap-4 bg-surface border border-border rounded-2xl p-5"
                activeOpacity={0.8}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#8B5CF620' }}
                >
                  <Text className="text-3xl">🎟️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-lg font-bold">
                    Convites
                  </Text>
                  <Text className="text-muted text-base">
                    Convidar novos membros
                  </Text>
                </View>
                <Text className="text-muted text-2xl">→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Próximos Eventos */}
          {stats.eventosAgendados > 0 && (
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-xl font-bold">
                  📆 Próximos Eventos
                </Text>
                <TouchableOpacity onPress={() => handlePress(() => router.push("/(tabs)/eventos"))}>
                  <Text className="text-base font-medium" style={{ color: cores.primary }}>
                    Ver todos →
                  </Text>
                </TouchableOpacity>
              </View>

              {eventos
                .filter(e => e.status === 'agendado')
                .slice(0, 3)
                .map((evento) => (
                  <TouchableOpacity
                    key={evento.id}
                    onPress={() => handlePress(() => router.push({
                      pathname: "/evento-detalhes",
                      params: { id: evento.id },
                    }))}
                    className="bg-surface rounded-2xl p-5 border border-border flex-row items-center gap-4"
                    activeOpacity={0.7}
                  >
                    <View 
                      className="w-16 h-16 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: `${cores.primary}15` }}
                    >
                      <Text className="text-foreground text-xl font-bold">
                        {evento.data.split('/')[0]}
                      </Text>
                      <Text className="text-muted text-sm">
                        {evento.data.split('/')[1]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-lg font-bold">
                        {evento.titulo}
                      </Text>
                      <Text className="text-muted text-base">
                        {evento.horario} • {evento.local}
                      </Text>
                    </View>
                    <View 
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: cores.primary }}
                    >
                      <Text className="text-white text-sm font-bold">
                        {evento.tipo.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Blocos Recentes */}
          {blocos.length > 0 && (
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-xl font-bold">
                  🎭 Segmentos
                </Text>
                <TouchableOpacity onPress={() => handlePress(() => router.push("/(tabs)/blocos"))}>
                  <Text className="text-base font-medium" style={{ color: cores.primary }}>
                    Ver todos →
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-4">
                  {blocos.slice(0, 5).map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => handlePress(() => router.push({
                        pathname: "/bloco-detalhes",
                        params: { id: bloco.id },
                      }))}
                      className="bg-surface rounded-2xl p-5 border border-border w-44"
                      activeOpacity={0.7}
                    >
                      <View
                        className="w-14 h-14 rounded-2xl items-center justify-center mb-4"
                        style={{ backgroundColor: `${bloco.cor}20` }}
                      >
                        <View
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: bloco.cor }}
                        />
                      </View>
                      <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                        {bloco.nome}
                      </Text>
                      <Text className="text-muted text-base mt-1" numberOfLines={1}>
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
