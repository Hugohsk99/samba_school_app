import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";

export default function AlmoxarifadoScreen() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');

  // Dados de exemplo
  const materiais = [
    {
      id: '1',
      nome: 'Plumas Vermelhas',
      categoria: 'fantasias',
      disponivel: 45,
      emUso: 30,
      necessaria: 100,
      status: 'falta',
    },
    {
      id: '2',
      nome: 'Paetês Dourados',
      categoria: 'adereccos',
      disponivel: 500,
      emUso: 200,
      necessaria: 600,
      status: 'ok',
    },
    {
      id: '3',
      nome: 'Surdos',
      categoria: 'instrumentos',
      disponivel: 15,
      emUso: 12,
      necessaria: 15,
      status: 'ok',
    },
    {
      id: '4',
      nome: 'Tecido Cetim Azul',
      categoria: 'tecidos',
      disponivel: 20,
      emUso: 15,
      necessaria: 50,
      status: 'falta',
    },
    {
      id: '5',
      nome: 'Coroas Decorativas',
      categoria: 'adereccos',
      disponivel: 8,
      emUso: 5,
      necessaria: 12,
      status: 'falta',
    },
    {
      id: '6',
      nome: 'Tamborins',
      categoria: 'instrumentos',
      disponivel: 25,
      emUso: 20,
      necessaria: 25,
      status: 'ok',
    },
    {
      id: '7',
      nome: 'Lantejoulas Prata',
      categoria: 'adereccos',
      disponivel: 800,
      emUso: 300,
      necessaria: 1000,
      status: 'ok',
    },
    {
      id: '8',
      nome: 'Tecido Tule Branco',
      categoria: 'tecidos',
      disponivel: 30,
      emUso: 10,
      necessaria: 40,
      status: 'ok',
    },
  ];

  const categorias = [
    { id: 'todas', nome: 'Todas', emoji: '📦' },
    { id: 'fantasias', nome: 'Fantasias', emoji: '👗' },
    { id: 'adereccos', nome: 'Adereços', emoji: '✨' },
    { id: 'instrumentos', nome: 'Instrumentos', emoji: '🥁' },
    { id: 'tecidos', nome: 'Tecidos', emoji: '🧵' },
  ];

  const materiaisFiltrados = categoriaAtiva === 'todas'
    ? materiais
    : materiais.filter(m => m.categoria === categoriaAtiva);

  const getStatusColor = (status: string) => {
    return status === 'falta' ? 'bg-error' : 'bg-success';
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">
            Almoxarifado
          </Text>
          <Text className="text-base text-muted mt-1">
            Gerencie o inventário de materiais
          </Text>
        </View>

        {/* Filtro de Categorias */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-4"
        >
          <View className="flex-row gap-2">
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoriaAtiva(cat.id)}
                className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                  categoriaAtiva === cat.id
                    ? 'bg-primary'
                    : 'bg-surface border border-border'
                }`}
              >
                <Text className="text-base">{cat.emoji}</Text>
                <Text
                  className={`text-sm font-medium ${
                    categoriaAtiva === cat.id ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {cat.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista de Materiais */}
        <ScrollView className="flex-1 px-6">
          <View className="gap-3 pb-24">
            {materiaisFiltrados.map((material) => (
              <TouchableOpacity
                key={material.id}
                className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
              >
                {/* Header do Card */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-foreground text-lg font-semibold">
                      {material.nome}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5 capitalize">
                      {material.categoria}
                    </Text>
                  </View>
                  {/* Badge de Status */}
                  <View className={`${getStatusColor(material.status)} px-2 py-1 rounded-full`}>
                    <Text className="text-white text-xs font-semibold">
                      {material.status === 'falta' ? 'FALTA' : 'OK'}
                    </Text>
                  </View>
                </View>

                {/* Informações de Quantidade */}
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted text-sm">Disponível</Text>
                    <Text className="text-foreground text-sm font-semibold">
                      {material.disponivel}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted text-sm">Em Uso</Text>
                    <Text className="text-foreground text-sm font-semibold">
                      {material.emUso}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted text-sm">Necessária</Text>
                    <Text className="text-foreground text-sm font-semibold">
                      {material.necessaria}
                    </Text>
                  </View>
                </View>

                {/* Barra de Progresso */}
                <View className="mt-3">
                  <View className="bg-border rounded-full h-2 overflow-hidden">
                    <View
                      className={getStatusColor(material.status)}
                      style={{
                        width: `${Math.min(
                          ((material.disponivel + material.emUso) / material.necessaria) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </View>
                  <Text className="text-muted text-xs mt-1">
                    {Math.round(
                      ((material.disponivel + material.emUso) / material.necessaria) * 100
                    )}% do necessário
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Botão Flutuante para Adicionar Material */}
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            className="bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg active:opacity-80"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
