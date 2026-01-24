/**
 * Tela de Entrega de Fantasia - Aprimorada
 * Permite registrar a entrega de fantasias/materiais aos integrantes
 * com rastreabilidade completa e histórico de movimentações
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useEscola } from "@/lib/escola-context";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import type { Material, Integrante, EntregaFantasia } from "@/lib/types";
import { CATEGORIAS_MATERIAL } from "@/lib/types";

export default function EntregaFantasiaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ materialId?: string; integranteId?: string }>();
  const { materiais, integrantes, entregasFantasias, registrarEntrega, updateMaterial, blocos } = useData();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const { escola } = useEscola();
  const { sessao } = useAuth();

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Estados
  const [materialSelecionado, setMaterialSelecionado] = useState<Material | null>(null);
  const [integranteSelecionado, setIntegranteSelecionado] = useState<Integrante | null>(null);
  const [etapa, setEtapa] = useState<"material" | "integrante" | "confirmar">("material");
  const [isProcessing, setIsProcessing] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [searchMaterial, setSearchMaterial] = useState("");
  const [searchIntegrante, setSearchIntegrante] = useState("");

  // Filtrar materiais disponíveis (fantasias e acessórios com estoque)
  const materiaisDisponiveis = materiais.filter(m => {
    const temEstoque = m.quantidadeDisponivel > 0;
    const matchSearch = searchMaterial.trim() === "" || 
      m.nome.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      m.descricao.toLowerCase().includes(searchMaterial.toLowerCase());
    return temEstoque && matchSearch;
  });

  // Filtrar integrantes ativos
  const integrantesAtivos = integrantes.filter(i => {
    const ativo = i.ativo;
    const matchSearch = searchIntegrante.trim() === "" ||
      i.nome.toLowerCase().includes(searchIntegrante.toLowerCase()) ||
      i.telefone?.includes(searchIntegrante);
    return ativo && matchSearch;
  });

  // Verificar se integrante já tem este material
  const integranteJaTemMaterial = (integranteId: string, materialId: string) => {
    return entregasFantasias.some(
      e => e.integranteId === integranteId && 
           e.materialId === materialId && 
           e.status === "entregue"
    );
  };

  // Obter materiais emprestados ao integrante
  const getMateriaisDoIntegrante = (integranteId: string) => {
    return entregasFantasias
      .filter(e => e.integranteId === integranteId && e.status === "entregue")
      .map(e => {
        const material = materiais.find(m => m.id === e.materialId);
        return { entrega: e, material };
      })
      .filter(item => item.material);
  };

  // Carregar material se vier por parâmetro
  useEffect(() => {
    if (params.materialId) {
      const material = materiais.find(m => m.id === params.materialId);
      if (material) {
        setMaterialSelecionado(material);
        setEtapa("integrante");
      }
    }
    if (params.integranteId) {
      const integrante = integrantes.find(i => i.id === params.integranteId);
      if (integrante) {
        setIntegranteSelecionado(integrante);
        if (materialSelecionado) {
          setEtapa("confirmar");
        }
      }
    }
  }, [params.materialId, params.integranteId]);

  // Selecionar material
  const handleSelecionarMaterial = (material: Material) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMaterialSelecionado(material);
    setEtapa("integrante");
    showInfo("Material selecionado", material.nome);
  };

  // Selecionar integrante
  const handleSelecionarIntegrante = (integrante: Integrante) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Verificar se já tem este material
    if (materialSelecionado && integranteJaTemMaterial(integrante.id, materialSelecionado.id)) {
      showWarning(
        "Atenção",
        `${integrante.nome} já possui este item emprestado. Registre a devolução primeiro.`
      );
      return;
    }

    setIntegranteSelecionado(integrante);
    setEtapa("confirmar");
    showInfo("Integrante selecionado", integrante.nome);
  };

  // Escanear QR Code do integrante
  const handleScanQRCode = () => {
    router.push({
      pathname: "/scanner-checkin",
      params: { 
        modo: "entrega",
        materialId: materialSelecionado?.id 
      }
    });
  };

  // Confirmar entrega
  const handleConfirmarEntrega = async () => {
    if (!materialSelecionado || !integranteSelecionado) {
      showError("Erro", "Selecione o material e o integrante.");
      return;
    }

    if (materialSelecionado.quantidadeDisponivel <= 0) {
      showError("Erro", "Este material não está mais disponível.");
      return;
    }

    // Verificar novamente se já tem
    if (integranteJaTemMaterial(integranteSelecionado.id, materialSelecionado.id)) {
      showError("Erro", "Este integrante já possui este item. Registre a devolução primeiro.");
      return;
    }

    setIsProcessing(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Criar registro de entrega
      const entrega: Omit<EntregaFantasia, "id"> = {
        materialId: materialSelecionado.id,
        integranteId: integranteSelecionado.id,
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: sessao?.nome || "Sistema",
        qrCodeIntegrante: integranteSelecionado.qrCodeId,
        observacaoEntrega: observacao.trim() || undefined,
        status: "entregue",
      };

      await registrarEntrega(entrega);

      // Atualizar estoque do material
      await updateMaterial(materialSelecionado.id, {
        quantidadeDisponivel: materialSelecionado.quantidadeDisponivel - 1,
        quantidadeEmUso: (materialSelecionado.quantidadeEmUso || 0) + 1,
        status: materialSelecionado.quantidadeDisponivel - 1 === 0 ? "emprestado" : "disponivel",
        integranteAtualId: integranteSelecionado.id,
      });

      showSuccess(
        "Entrega registrada!",
        `${materialSelecionado.nome} entregue para ${integranteSelecionado.nome}`
      );

      // Voltar para a tela anterior
      router.back();
    } catch (error) {
      console.error("Erro ao registrar entrega:", error);
      showError("Erro", "Não foi possível registrar a entrega. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Voltar etapa
  const handleVoltar = () => {
    if (etapa === "confirmar") {
      setEtapa("integrante");
      setIntegranteSelecionado(null);
      setObservacao("");
    } else if (etapa === "integrante") {
      setEtapa("material");
      setMaterialSelecionado(null);
      setSearchIntegrante("");
    } else {
      router.back();
    }
  };

  // Obter nome do bloco
  const getBlocoNome = (blocoId?: string) => {
    if (!blocoId) return null;
    const bloco = blocos.find(b => b.id === blocoId);
    return bloco?.nome;
  };

  // Obter label da categoria
  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS_MATERIAL.find(c => c.value === categoria);
    return cat?.label || categoria;
  };

  // Renderizar item de material
  const renderMaterialItem = ({ item }: { item: Material }) => {
    const blocoNome = getBlocoNome(item.blocoId);
    
    return (
      <TouchableOpacity
        onPress={() => handleSelecionarMaterial(item)}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start gap-3">
          {item.foto ? (
            <Image
              source={{ uri: item.foto }}
              className="w-16 h-16 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View 
              className="w-16 h-16 rounded-lg items-center justify-center"
              style={{ backgroundColor: corPrimaria + "20" }}
            >
              <Text style={{ color: corPrimaria }} className="text-2xl">📦</Text>
            </View>
          )}
          
          <View className="flex-1">
            <Text className="text-foreground text-lg font-semibold">{item.nome}</Text>
            
            <View className="flex-row flex-wrap gap-2 mt-1">
              <View className="bg-primary/20 px-2 py-0.5 rounded">
                <Text className="text-primary text-xs">{getCategoriaLabel(item.categoria)}</Text>
              </View>
              {item.tamanho && (
                <View className="bg-muted/20 px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs">Tam: {item.tamanho}</Text>
                </View>
              )}
              {blocoNome && (
                <View className="bg-muted/20 px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs">{blocoNome}</Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-success/20 px-2 py-1 rounded">
                <Text className="text-success text-xs font-medium">
                  {item.quantidadeDisponivel} disponível(is)
                </Text>
              </View>
              {item.quantidadeEmUso > 0 && (
                <View className="bg-warning/20 px-2 py-1 rounded">
                  <Text className="text-warning text-xs font-medium">
                    {item.quantidadeEmUso} em uso
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar item de integrante
  const renderIntegranteItem = ({ item }: { item: Integrante }) => {
    const materiaisEmprestados = getMateriaisDoIntegrante(item.id);
    const jaTemEsteMaterial = materialSelecionado && 
      integranteJaTemMaterial(item.id, materialSelecionado.id);
    
    return (
      <TouchableOpacity
        onPress={() => handleSelecionarIntegrante(item)}
        className={`bg-surface rounded-xl p-4 mb-3 border ${jaTemEsteMaterial ? 'border-warning' : 'border-border'}`}
        activeOpacity={0.7}
        disabled={!!jaTemEsteMaterial}
        style={{ opacity: jaTemEsteMaterial ? 0.6 : 1 }}
      >
        <View className="flex-row items-center gap-3">
          {item.foto ? (
            <Image
              source={{ uri: item.foto }}
              className="w-14 h-14 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View 
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: corPrimaria + "20" }}
            >
              <Text style={{ color: corPrimaria }} className="text-xl">👤</Text>
            </View>
          )}
          
          <View className="flex-1">
            <Text className="text-foreground text-lg font-semibold">{item.nome}</Text>
            <Text className="text-muted text-sm">{item.telefone}</Text>
            
            {materiaisEmprestados.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-1">
                <Text className="text-muted text-xs">
                  📦 {materiaisEmprestados.length} item(s) emprestado(s)
                </Text>
              </View>
            )}
            
            {jaTemEsteMaterial && (
              <View className="bg-warning/20 px-2 py-1 rounded mt-1 self-start">
                <Text className="text-warning text-xs font-medium">
                  ⚠️ Já possui este item
                </Text>
              </View>
            )}
          </View>
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
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={handleVoltar}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Registrar Entrega</Text>
              <Text className="text-white/80 text-sm">
                {etapa === "material" && "Etapa 1: Selecione o material"}
                {etapa === "integrante" && "Etapa 2: Selecione o integrante"}
                {etapa === "confirmar" && "Etapa 3: Confirme a entrega"}
              </Text>
            </View>
          </View>

          {/* Indicador de progresso */}
          <View className="flex-row gap-2 mt-4">
            <View className={`flex-1 h-1 rounded-full ${etapa === "material" || etapa === "integrante" || etapa === "confirmar" ? "bg-white" : "bg-white/30"}`} />
            <View className={`flex-1 h-1 rounded-full ${etapa === "integrante" || etapa === "confirmar" ? "bg-white" : "bg-white/30"}`} />
            <View className={`flex-1 h-1 rounded-full ${etapa === "confirmar" ? "bg-white" : "bg-white/30"}`} />
          </View>
        </View>

        {/* Conteúdo */}
        {etapa === "material" && (
          <View className="flex-1 px-6 pt-4">
            {/* Busca */}
            <View className="bg-surface rounded-xl px-4 py-3 mb-4 border border-border flex-row items-center">
              <Text className="text-muted mr-2">🔍</Text>
              <TextInput
                value={searchMaterial}
                onChangeText={setSearchMaterial}
                placeholder="Buscar material..."
                placeholderTextColor="#9BA1A6"
                className="flex-1 text-foreground text-base"
              />
            </View>

            {/* Lista de materiais */}
            <FlatList
              data={materiaisDisponiveis}
              keyExtractor={(item) => item.id}
              renderItem={renderMaterialItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-muted text-center">
                    Nenhum material disponível para entrega.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {etapa === "integrante" && (
          <View className="flex-1 px-6 pt-4">
            {/* Material selecionado */}
            {materialSelecionado && (
              <View className="bg-surface rounded-xl p-4 mb-4 border border-primary">
                <Text className="text-muted text-xs mb-1">Material selecionado:</Text>
                <Text className="text-foreground text-lg font-semibold">
                  {materialSelecionado.nome}
                </Text>
                {materialSelecionado.tamanho && (
                  <Text className="text-muted text-sm">Tamanho: {materialSelecionado.tamanho}</Text>
                )}
              </View>
            )}

            {/* Busca */}
            <View className="bg-surface rounded-xl px-4 py-3 mb-4 border border-border flex-row items-center">
              <Text className="text-muted mr-2">🔍</Text>
              <TextInput
                value={searchIntegrante}
                onChangeText={setSearchIntegrante}
                placeholder="Buscar integrante..."
                placeholderTextColor="#9BA1A6"
                className="flex-1 text-foreground text-base"
              />
            </View>

            {/* Botão de escanear QR Code */}
            <TouchableOpacity
              onPress={handleScanQRCode}
              className="bg-surface rounded-xl p-4 mb-4 border border-border flex-row items-center justify-center gap-2"
              activeOpacity={0.7}
            >
              <Text className="text-2xl">📷</Text>
              <Text className="text-foreground font-semibold">Escanear QR Code do Integrante</Text>
            </TouchableOpacity>

            {/* Lista de integrantes */}
            <FlatList
              data={integrantesAtivos}
              keyExtractor={(item) => item.id}
              renderItem={renderIntegranteItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-muted text-center">
                    Nenhum integrante encontrado.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {etapa === "confirmar" && (
          <ScrollView className="flex-1 px-6 pt-4">
            {/* Resumo da entrega */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-foreground text-lg font-bold mb-4">Resumo da Entrega</Text>
              
              {/* Material */}
              <View className="mb-4 pb-4 border-b border-border">
                <Text className="text-muted text-xs mb-1">MATERIAL</Text>
                <Text className="text-foreground text-lg font-semibold">
                  {materialSelecionado?.nome}
                </Text>
                {materialSelecionado?.tamanho && (
                  <Text className="text-muted text-sm">Tamanho: {materialSelecionado.tamanho}</Text>
                )}
                <Text className="text-muted text-sm">
                  Categoria: {getCategoriaLabel(materialSelecionado?.categoria || "")}
                </Text>
              </View>

              {/* Integrante */}
              <View className="mb-4 pb-4 border-b border-border">
                <Text className="text-muted text-xs mb-1">INTEGRANTE</Text>
                <View className="flex-row items-center gap-3">
                  {integranteSelecionado?.foto ? (
                    <Image
                      source={{ uri: integranteSelecionado.foto }}
                      className="w-12 h-12 rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: corPrimaria + "20" }}
                    >
                      <Text style={{ color: corPrimaria }} className="text-lg">👤</Text>
                    </View>
                  )}
                  <View>
                    <Text className="text-foreground text-lg font-semibold">
                      {integranteSelecionado?.nome}
                    </Text>
                    <Text className="text-muted text-sm">{integranteSelecionado?.telefone}</Text>
                  </View>
                </View>
              </View>

              {/* Responsável */}
              <View className="mb-4 pb-4 border-b border-border">
                <Text className="text-muted text-xs mb-1">RESPONSÁVEL PELA ENTREGA</Text>
                <Text className="text-foreground font-semibold">
                  {sessao?.nome || "Sistema"}
                </Text>
                <Text className="text-muted text-sm">
                  {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>

              {/* Observação */}
              <View>
                <Text className="text-muted text-xs mb-2">OBSERVAÇÃO (opcional)</Text>
                <TextInput
                  value={observacao}
                  onChangeText={setObservacao}
                  placeholder="Adicione uma observação sobre a entrega..."
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={3}
                  className="bg-background rounded-xl p-3 text-foreground border border-border"
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />
              </View>
            </View>

            {/* Botão de confirmar */}
            <TouchableOpacity
              onPress={handleConfirmarEntrega}
              disabled={isProcessing}
              className="rounded-xl py-4 items-center mb-6"
              style={{ backgroundColor: isProcessing ? "#ccc" : corPrimaria }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-bold">
                {isProcessing ? "Registrando..." : "✓ Confirmar Entrega"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
