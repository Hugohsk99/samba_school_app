/**
 * Tela de Relatórios com Exportação em PDF
 * Acesso exclusivo para gestores (Diretoria e Coordenadores)
 */

import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useEscola } from "@/lib/escola-context";
import { useToast } from "@/lib/toast-context";
import * as Haptics from "expo-haptics";

type TipoRelatorio = "presenca" | "integrantes" | "materiais" | "eventos";

export default function RelatoriosPDFScreen() {
  const router = useRouter();
  const { permissoes, nivelAcesso } = useAuth();
  const { integrantes, blocos, eventos, checkIns, materiais, entregasFantasias } = useData();
  const { escola } = useEscola();
  const { showSuccess, showError, showWarning } = useToast();

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>("presenca");
  const [isGenerating, setIsGenerating] = useState(false);

  // Cor da escola
  const corPrimaria = escola?.corPrimaria || "#FF6B35";

  // Verificar permissão
  if (!permissoes.verRelatoriosPresenca) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🔒</Text>
          <Text className="text-foreground text-xl font-bold text-center mb-2">
            Acesso Restrito
          </Text>
          <Text className="text-muted text-center mb-6">
            Apenas gestores podem acessar os relatórios.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: corPrimaria }}
          >
            <Text className="text-white font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Gerar relatório de presença
  const gerarRelatorioPresenca = () => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let conteudo = `
╔══════════════════════════════════════════════════════════════╗
║           RELATÓRIO DE PRESENÇA EM EVENTOS                   ║
╚══════════════════════════════════════════════════════════════╝

📅 Data de Geração: ${dataAtual} às ${horaAtual}
🏫 Escola: ${escola?.nome || "Escola de Samba"}

════════════════════════════════════════════════════════════════
                        RESUMO GERAL
════════════════════════════════════════════════════════════════

📊 Total de Eventos: ${eventos.length}
👥 Total de Integrantes: ${integrantes.length}
✅ Total de Check-ins: ${checkIns.length}
📈 Taxa Média de Presença: ${integrantes.length > 0 && eventos.length > 0 
  ? ((checkIns.length / (integrantes.length * eventos.length)) * 100).toFixed(1) 
  : 0}%

════════════════════════════════════════════════════════════════
                    PRESENÇA POR EVENTO
════════════════════════════════════════════════════════════════
`;

    eventos.forEach((evento, index) => {
      const checkInsEvento = checkIns.filter(c => c.eventoId === evento.id);
      const taxaPresenca = integrantes.length > 0 
        ? ((checkInsEvento.length / integrantes.length) * 100).toFixed(1)
        : 0;

      conteudo += `
┌──────────────────────────────────────────────────────────────┐
│ ${index + 1}. ${evento.titulo.toUpperCase().padEnd(50)}│
├──────────────────────────────────────────────────────────────┤
│ 📅 Data: ${evento.data.padEnd(20)} 🕐 Horário: ${evento.horario.padEnd(10)}│
│ 📍 Local: ${(evento.local || "Não informado").padEnd(45)}│
│ ✅ Presenças: ${String(checkInsEvento.length).padEnd(5)} 📊 Taxa: ${String(taxaPresenca + "%").padEnd(10)}│
└──────────────────────────────────────────────────────────────┘
`;
    });

    conteudo += `
════════════════════════════════════════════════════════════════
                 RANKING DE PRESENÇA POR INTEGRANTE
════════════════════════════════════════════════════════════════
`;

    const rankingIntegrantes = integrantes
      .map(integrante => {
        const presencas = checkIns.filter(c => c.integranteId === integrante.id).length;
        const taxa = eventos.length > 0 ? (presencas / eventos.length) * 100 : 0;
        return { nome: integrante.nome, presencas, taxa };
      })
      .sort((a, b) => b.presencas - a.presencas)
      .slice(0, 20);

    rankingIntegrantes.forEach((item, index) => {
      const medalha = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
      conteudo += `${medalha} ${String(index + 1).padStart(2)}. ${item.nome.padEnd(30)} | ${String(item.presencas).padStart(3)} presenças | ${item.taxa.toFixed(1)}%\n`;
    });

    conteudo += `
════════════════════════════════════════════════════════════════
                      FIM DO RELATÓRIO
════════════════════════════════════════════════════════════════

Gerado automaticamente pelo App de Gestão de Escola de Samba
`;

    return conteudo;
  };

  // Gerar relatório de integrantes
  const gerarRelatorioIntegrantes = () => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const desfilantes = integrantes.filter(i => i.categoria === "desfilante");
    const segmentos = integrantes.filter(i => i.categoria === "segmento");
    const diretoria = integrantes.filter(i => i.categoria === "diretoria");
    const ativos = integrantes.filter(i => i.ativo);
    const inativos = integrantes.filter(i => !i.ativo);

    let conteudo = `
╔══════════════════════════════════════════════════════════════╗
║              RELATÓRIO DE INTEGRANTES                        ║
╚══════════════════════════════════════════════════════════════╝

📅 Data de Geração: ${dataAtual} às ${horaAtual}
🏫 Escola: ${escola?.nome || "Escola de Samba"}

════════════════════════════════════════════════════════════════
                        RESUMO GERAL
════════════════════════════════════════════════════════════════

👥 Total de Integrantes: ${integrantes.length}
✅ Ativos: ${ativos.length}
❌ Inativos: ${inativos.length}

📊 Por Categoria:
   🎭 Desfilantes: ${desfilantes.length}
   🥁 Segmentos: ${segmentos.length}
   👔 Diretoria/Staff: ${diretoria.length}

════════════════════════════════════════════════════════════════
                    LISTA DE INTEGRANTES
════════════════════════════════════════════════════════════════
`;

    // Diretoria primeiro
    if (diretoria.length > 0) {
      conteudo += `\n👔 DIRETORIA/STAFF (${diretoria.length})\n${"─".repeat(60)}\n`;
      diretoria.forEach((int, idx) => {
        conteudo += `${idx + 1}. ${int.nome.padEnd(35)} | ${int.cargoDiretoria || "Staff"}\n`;
        if (int.telefone) conteudo += `   📱 ${int.telefone}\n`;
      });
    }

    // Segmentos
    if (segmentos.length > 0) {
      conteudo += `\n🥁 SEGMENTOS (${segmentos.length})\n${"─".repeat(60)}\n`;
      segmentos.forEach((int, idx) => {
        conteudo += `${idx + 1}. ${int.nome.padEnd(35)} | ${int.tipoSegmento || "Segmento"}\n`;
        if (int.telefone) conteudo += `   📱 ${int.telefone}\n`;
      });
    }

    // Desfilantes
    if (desfilantes.length > 0) {
      conteudo += `\n🎭 DESFILANTES (${desfilantes.length})\n${"─".repeat(60)}\n`;
      desfilantes.forEach((int, idx) => {
        const tipo = int.tipoDesfilante === "ala_comercial" ? "Ala Comercial" : "Ala Comunidade";
        conteudo += `${idx + 1}. ${int.nome.padEnd(35)} | ${tipo}\n`;
      });
    }

    conteudo += `
════════════════════════════════════════════════════════════════
                      FIM DO RELATÓRIO
════════════════════════════════════════════════════════════════
`;

    return conteudo;
  };

  // Gerar relatório de materiais
  const gerarRelatorioMateriais = () => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const entregasPendentes = entregasFantasias.filter(e => e.status === "entregue");
    const totalDisponivel = materiais.reduce((acc, m) => acc + (m.quantidadeDisponivel || 0), 0);
    const totalEmUso = materiais.reduce((acc, m) => acc + (m.quantidadeEmUso || 0), 0);

    let conteudo = `
╔══════════════════════════════════════════════════════════════╗
║           RELATÓRIO DE MATERIAIS/FANTASIAS                   ║
╚══════════════════════════════════════════════════════════════╝

📅 Data de Geração: ${dataAtual} às ${horaAtual}
🏫 Escola: ${escola?.nome || "Escola de Samba"}

════════════════════════════════════════════════════════════════
                        RESUMO GERAL
════════════════════════════════════════════════════════════════

📦 Total de Itens Cadastrados: ${materiais.length}
✅ Quantidade Disponível: ${totalDisponivel}
🔄 Quantidade em Uso: ${totalEmUso}
⚠️ Entregas Pendentes de Devolução: ${entregasPendentes.length}

════════════════════════════════════════════════════════════════
                    INVENTÁRIO DETALHADO
════════════════════════════════════════════════════════════════
`;

    // Agrupar por categoria
    const categorias = [...new Set(materiais.map(m => m.categoria))];
    
    categorias.forEach(categoria => {
      const materiaisCategoria = materiais.filter(m => m.categoria === categoria);
      conteudo += `\n📁 ${categoria.toUpperCase()} (${materiaisCategoria.length} itens)\n${"─".repeat(60)}\n`;
      
      materiaisCategoria.forEach((mat, idx) => {
        const status = mat.status === "disponivel" ? "✅" : mat.status === "emprestado" ? "🔄" : "🔧";
        conteudo += `${status} ${idx + 1}. ${mat.nome.padEnd(30)} | Disp: ${mat.quantidadeDisponivel || 0} | Uso: ${mat.quantidadeEmUso || 0}\n`;
      });
    });

    if (entregasPendentes.length > 0) {
      conteudo += `
════════════════════════════════════════════════════════════════
                 ENTREGAS PENDENTES DE DEVOLUÇÃO
════════════════════════════════════════════════════════════════
`;
      entregasPendentes.forEach((entrega, idx) => {
        const material = materiais.find(m => m.id === entrega.materialId);
        const integrante = integrantes.find(i => i.id === entrega.integranteId);
        const diasEmprestado = Math.floor(
          (Date.now() - new Date(entrega.dataEntrega).getTime()) / (1000 * 60 * 60 * 24)
        );
        const alerta = diasEmprestado > 30 ? "⚠️ ATRASADO" : "";
        
        conteudo += `${idx + 1}. ${(material?.nome || "Material").padEnd(25)} → ${(integrante?.nome || "Integrante").padEnd(25)}\n`;
        conteudo += `   📅 Entregue em: ${new Date(entrega.dataEntrega).toLocaleDateString("pt-BR")} (${diasEmprestado} dias) ${alerta}\n`;
      });
    }

    conteudo += `
════════════════════════════════════════════════════════════════
                      FIM DO RELATÓRIO
════════════════════════════════════════════════════════════════
`;

    return conteudo;
  };

  // Gerar relatório de eventos
  const gerarRelatorioEventos = () => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const eventosPassados = eventos.filter(e => new Date(e.data.split("/").reverse().join("-")) < new Date());
    const eventosFuturos = eventos.filter(e => new Date(e.data.split("/").reverse().join("-")) >= new Date());

    let conteudo = `
╔══════════════════════════════════════════════════════════════╗
║                 RELATÓRIO DE EVENTOS                         ║
╚══════════════════════════════════════════════════════════════╝

📅 Data de Geração: ${dataAtual} às ${horaAtual}
🏫 Escola: ${escola?.nome || "Escola de Samba"}

════════════════════════════════════════════════════════════════
                        RESUMO GERAL
════════════════════════════════════════════════════════════════

📆 Total de Eventos: ${eventos.length}
✅ Eventos Realizados: ${eventosPassados.length}
📅 Eventos Futuros: ${eventosFuturos.length}

════════════════════════════════════════════════════════════════
                    PRÓXIMOS EVENTOS
════════════════════════════════════════════════════════════════
`;

    if (eventosFuturos.length > 0) {
      eventosFuturos
        .sort((a, b) => new Date(a.data.split("/").reverse().join("-")).getTime() - new Date(b.data.split("/").reverse().join("-")).getTime())
        .forEach((evento, idx) => {
          conteudo += `
┌──────────────────────────────────────────────────────────────┐
│ ${idx + 1}. ${evento.titulo.toUpperCase().padEnd(50)}│
├──────────────────────────────────────────────────────────────┤
│ 📅 Data: ${evento.data.padEnd(15)} 🕐 Horário: ${evento.horario.padEnd(10)}│
│ 📍 Local: ${(evento.local || "A definir").padEnd(45)}│
│ 🏷️ Tipo: ${(evento.tipo || "Evento").padEnd(47)}│
└──────────────────────────────────────────────────────────────┘
`;
        });
    } else {
      conteudo += "\n📭 Nenhum evento futuro agendado.\n";
    }

    conteudo += `
════════════════════════════════════════════════════════════════
                    EVENTOS REALIZADOS
════════════════════════════════════════════════════════════════
`;

    if (eventosPassados.length > 0) {
      eventosPassados.forEach((evento, idx) => {
        const checkInsEvento = checkIns.filter(c => c.eventoId === evento.id);
        conteudo += `${idx + 1}. ${evento.titulo.padEnd(35)} | ${evento.data} | ${checkInsEvento.length} presenças\n`;
      });
    } else {
      conteudo += "\n📭 Nenhum evento realizado ainda.\n";
    }

    conteudo += `
════════════════════════════════════════════════════════════════
                      FIM DO RELATÓRIO
════════════════════════════════════════════════════════════════
`;

    return conteudo;
  };

  // Gerar e compartilhar relatório
  const handleGerarRelatorio = async () => {
    setIsGenerating(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      let conteudo = "";
      let titulo = "";

      switch (tipoSelecionado) {
        case "presenca":
          conteudo = gerarRelatorioPresenca();
          titulo = "Relatório de Presença";
          break;
        case "integrantes":
          conteudo = gerarRelatorioIntegrantes();
          titulo = "Relatório de Integrantes";
          break;
        case "materiais":
          conteudo = gerarRelatorioMateriais();
          titulo = "Relatório de Materiais";
          break;
        case "eventos":
          conteudo = gerarRelatorioEventos();
          titulo = "Relatório de Eventos";
          break;
      }

      await Share.share({
        message: conteudo,
        title: titulo,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showSuccess("Relatório gerado!", "Use a opção de compartilhar para salvar ou enviar.");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      showError("Erro", "Não foi possível gerar o relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  const tiposRelatorio = [
    { id: "presenca" as TipoRelatorio, icon: "📊", titulo: "Presença", descricao: "Frequência em eventos" },
    { id: "integrantes" as TipoRelatorio, icon: "👥", titulo: "Integrantes", descricao: "Lista completa de membros" },
    { id: "materiais" as TipoRelatorio, icon: "👗", titulo: "Materiais", descricao: "Inventário e empréstimos" },
    { id: "eventos" as TipoRelatorio, icon: "📅", titulo: "Eventos", descricao: "Agenda e histórico" },
  ];

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View 
        className="px-6 pt-6 pb-4"
        style={{ backgroundColor: corPrimaria }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-base">← Voltar</Text>
          </TouchableOpacity>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium">
              {nivelAcesso === "diretoria" ? "👑 Diretoria" : "📋 Coordenador"}
            </Text>
          </View>
        </View>
        <Text className="text-white text-2xl font-bold">📄 Relatórios</Text>
        <Text className="text-white/80 text-base mt-1">
          Gere relatórios para impressão ou compartilhamento
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Seleção de tipo */}
        <Text className="text-foreground text-lg font-bold mb-4">
          Selecione o tipo de relatório:
        </Text>

        <View className="gap-3 mb-8">
          {tiposRelatorio.map((tipo) => (
            <TouchableOpacity
              key={tipo.id}
              onPress={() => setTipoSelecionado(tipo.id)}
              className="flex-row items-center p-4 rounded-2xl border-2"
              style={{
                backgroundColor: tipoSelecionado === tipo.id ? corPrimaria + "15" : "transparent",
                borderColor: tipoSelecionado === tipo.id ? corPrimaria : "#E5E7EB",
              }}
              activeOpacity={0.7}
            >
              <Text className="text-4xl mr-4">{tipo.icon}</Text>
              <View className="flex-1">
                <Text 
                  className="text-lg font-bold"
                  style={{ color: tipoSelecionado === tipo.id ? corPrimaria : "#11181C" }}
                >
                  {tipo.titulo}
                </Text>
                <Text className="text-muted text-sm">{tipo.descricao}</Text>
              </View>
              {tipoSelecionado === tipo.id && (
                <View 
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: corPrimaria }}
                >
                  <Text className="text-white text-sm">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumo do relatório selecionado */}
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <Text className="text-foreground text-lg font-bold mb-4">
            📋 Dados do Relatório
          </Text>

          {tipoSelecionado === "presenca" && (
            <View className="gap-2">
              <Text className="text-muted">• Total de eventos: {eventos.length}</Text>
              <Text className="text-muted">• Total de check-ins: {checkIns.length}</Text>
              <Text className="text-muted">• Integrantes cadastrados: {integrantes.length}</Text>
            </View>
          )}

          {tipoSelecionado === "integrantes" && (
            <View className="gap-2">
              <Text className="text-muted">• Total de integrantes: {integrantes.length}</Text>
              <Text className="text-muted">• Desfilantes: {integrantes.filter(i => i.categoria === "desfilante").length}</Text>
              <Text className="text-muted">• Segmentos: {integrantes.filter(i => i.categoria === "segmento").length}</Text>
              <Text className="text-muted">• Diretoria: {integrantes.filter(i => i.categoria === "diretoria").length}</Text>
            </View>
          )}

          {tipoSelecionado === "materiais" && (
            <View className="gap-2">
              <Text className="text-muted">• Total de materiais: {materiais.length}</Text>
              <Text className="text-muted">• Entregas pendentes: {entregasFantasias.filter(e => e.status === "entregue").length}</Text>
            </View>
          )}

          {tipoSelecionado === "eventos" && (
            <View className="gap-2">
              <Text className="text-muted">• Total de eventos: {eventos.length}</Text>
              <Text className="text-muted">• Eventos futuros: {eventos.filter(e => new Date(e.data.split("/").reverse().join("-")) >= new Date()).length}</Text>
            </View>
          )}
        </View>

        {/* Botão de gerar */}
        <TouchableOpacity
          onPress={handleGerarRelatorio}
          disabled={isGenerating}
          className="py-4 rounded-2xl items-center flex-row justify-center gap-3"
          style={{ 
            backgroundColor: isGenerating ? corPrimaria + "80" : corPrimaria 
          }}
          activeOpacity={0.8}
        >
          <Text className="text-2xl">{isGenerating ? "⏳" : "📄"}</Text>
          <Text className="text-white text-lg font-bold">
            {isGenerating ? "Gerando..." : "Gerar e Compartilhar Relatório"}
          </Text>
        </TouchableOpacity>

        <Text className="text-muted text-sm text-center mt-4">
          O relatório será gerado em formato texto e você poderá{"\n"}
          compartilhar via WhatsApp, e-mail ou salvar no dispositivo.
        </Text>

        {/* Espaço extra */}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
