import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/data-context";
import * as Haptics from "expo-haptics";
import type { 
  CategoriaIntegrante, 
  TipoDesfilante, 
  TipoSegmento, 
  CargoDiretoria 
} from "@/lib/types";
import {
  CATEGORIAS_INTEGRANTE,
  TIPOS_DESFILANTE,
  TIPOS_SEGMENTO,
  CARGOS_DIRETORIA,
} from "@/lib/types";

export default function IntegranteFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ blocoId?: string }>();
  const { blocos, addIntegrante } = useData();

  // Estado do formulário - Dados básicos
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  
  // Estado - Categorização
  const [categoria, setCategoria] = useState<CategoriaIntegrante>("desfilante");
  const [tipoDesfilante, setTipoDesfilante] = useState<TipoDesfilante>("ala_comunidade");
  const [tipoSegmento, setTipoSegmento] = useState<TipoSegmento>("bateria");
  const [cargoDiretoria, setCargoDiretoria] = useState<CargoDiretoria>("staff");
  
  // Estado - Associações
  const [blocosIds, setBlocosIds] = useState<string[]>(
    params.blocoId ? [params.blocoId] : []
  );
  
  // Estado - Contato de emergência
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
  
  // Estado - Controle
  const [isSaving, setIsSaving] = useState(false);

  // Validação
  const isValid = nome.trim().length > 0;

  // Toggle bloco selecionado
  const toggleBloco = (blocoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setBlocosIds((prev) => {
      if (prev.includes(blocoId)) {
        return prev.filter((id) => id !== blocoId);
      }
      return [...prev, blocoId];
    });
  };

  // Salvar integrante
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Erro", "Preencha o nome do integrante.");
      return;
    }

    setIsSaving(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addIntegrante({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        categoria,
        tipoDesfilante: categoria === "desfilante" ? tipoDesfilante : undefined,
        tipoSegmento: categoria === "segmento" ? tipoSegmento : undefined,
        cargoDiretoria: categoria === "diretoria" ? cargoDiretoria : undefined,
        blocosIds,
        contatoEmergenciaNome: contatoEmergenciaNome.trim() || undefined,
        contatoEmergenciaTelefone: contatoEmergenciaTelefone.trim() || undefined,
        ativo: true,
      });

      router.back();
    } catch (error) {
      console.error("Erro ao salvar integrante:", error);
      Alert.alert("Erro", "Não foi possível salvar o integrante. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <Text className="text-primary text-base">Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-semibold">
            Novo Integrante
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            className="p-2"
            style={{ opacity: isValid && !isSaving ? 1 : 0.5 }}
            disabled={!isValid || isSaving}
          >
            <Text className="text-primary text-base font-semibold">
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <ScrollView className="flex-1 p-6">
          <View className="gap-6">
            {/* Seção: Dados Pessoais */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-foreground text-base font-semibold mb-4">
                Dados Pessoais
              </Text>
              
              {/* Campo: Nome */}
              <View className="mb-4">
                <Text className="text-foreground text-sm font-medium mb-2">
                  Nome Completo *
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Nome do integrante"
                  placeholderTextColor="#687076"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Campo: Telefone */}
              <View className="mb-4">
                <Text className="text-foreground text-sm font-medium mb-2">
                  Telefone
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#687076"
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </View>

              {/* Campo: Email */}
              <View>
                <Text className="text-foreground text-sm font-medium mb-2">
                  E-mail
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="email@exemplo.com"
                  placeholderTextColor="#687076"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Seção: Categorização */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-foreground text-base font-semibold mb-4">
                Categorização
              </Text>
              
              {/* Campo: Categoria */}
              <View className="mb-4">
                <Text className="text-foreground text-sm font-medium mb-2">
                  Categoria *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIAS_INTEGRANTE.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => {
                        setCategoria(cat.value);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      className={`px-4 py-2 rounded-full ${
                        categoria === cat.value
                          ? "bg-primary"
                          : "bg-background border border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          categoria === cat.value ? "text-white" : "text-foreground"
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Subcategoria: Desfilante */}
              {categoria === "desfilante" && (
                <View className="mb-4">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Tipo de Desfilante
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {TIPOS_DESFILANTE.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.value}
                        onPress={() => setTipoDesfilante(tipo.value)}
                        className={`px-4 py-2 rounded-full ${
                          tipoDesfilante === tipo.value
                            ? "bg-primary/80"
                            : "bg-background border border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            tipoDesfilante === tipo.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Subcategoria: Segmento */}
              {categoria === "segmento" && (
                <View className="mb-4">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Tipo de Segmento
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {TIPOS_SEGMENTO.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.value}
                        onPress={() => setTipoSegmento(tipo.value)}
                        className={`px-3 py-2 rounded-full ${
                          tipoSegmento === tipo.value
                            ? "bg-primary/80"
                            : "bg-background border border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            tipoSegmento === tipo.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Subcategoria: Diretoria */}
              {categoria === "diretoria" && (
                <View className="mb-4">
                  <Text className="text-foreground text-sm font-medium mb-2">
                    Cargo
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {CARGOS_DIRETORIA.map((cargo) => (
                      <TouchableOpacity
                        key={cargo.value}
                        onPress={() => setCargoDiretoria(cargo.value)}
                        className={`px-3 py-2 rounded-full ${
                          cargoDiretoria === cargo.value
                            ? "bg-primary/80"
                            : "bg-background border border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            cargoDiretoria === cargo.value ? "text-white" : "text-foreground"
                          }`}
                        >
                          {cargo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Seção: Associação a Blocos */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-foreground text-base font-semibold mb-2">
                Associação a Blocos/Alas
              </Text>
              <Text className="text-muted text-xs mb-4">
                Selecione os blocos que o integrante participa (opcional)
              </Text>
              
              {blocos.length === 0 ? (
                <View className="bg-background border border-border rounded-xl p-4 items-center">
                  <Text className="text-muted text-center">
                    Nenhum bloco cadastrado.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {blocos.map((bloco) => (
                    <TouchableOpacity
                      key={bloco.id}
                      onPress={() => toggleBloco(bloco.id)}
                      className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                        blocosIds.includes(bloco.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border"
                      }`}
                    >
                      {/* Checkbox */}
                      <View
                        className={`w-5 h-5 rounded items-center justify-center ${
                          blocosIds.includes(bloco.id)
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                      >
                        {blocosIds.includes(bloco.id) && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>

                      {/* Cor do bloco */}
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bloco.cor }}
                      />

                      {/* Nome do bloco */}
                      <Text className="text-foreground text-sm font-medium flex-1">
                        {bloco.nome}
                      </Text>
                      
                      {/* Tipo */}
                      <Text className="text-muted text-xs">
                        {bloco.tipo === 'ala' ? 'Ala' : 'Segmento'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Seção: Contato de Emergência */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-foreground text-base font-semibold mb-4">
                Contato de Emergência
              </Text>
              
              {/* Campo: Nome do contato */}
              <View className="mb-4">
                <Text className="text-foreground text-sm font-medium mb-2">
                  Nome
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Nome do contato"
                  placeholderTextColor="#687076"
                  value={contatoEmergenciaNome}
                  onChangeText={setContatoEmergenciaNome}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Campo: Telefone do contato */}
              <View>
                <Text className="text-foreground text-sm font-medium mb-2">
                  Telefone
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#687076"
                  value={contatoEmergenciaTelefone}
                  onChangeText={setContatoEmergenciaTelefone}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Espaço extra no final */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
