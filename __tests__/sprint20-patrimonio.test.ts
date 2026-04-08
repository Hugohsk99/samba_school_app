import { describe, it, expect } from "vitest";
import { PERMISSOES_POR_ROLE, PERMISSOES_SISTEMA } from "../drizzle/schema";

describe("Sprint 20 - Patrimônio e Painel da Diretoria", () => {
  
  // ============================================
  // PERMISSÕES DE PATRIMÔNIO
  // ============================================
  
  describe("Permissões de Patrimônio", () => {
    it("deve ter permissões de patrimônio no sistema", () => {
      expect(PERMISSOES_SISTEMA).toContain("patrimonio.ver");
      expect(PERMISSOES_SISTEMA).toContain("patrimonio.cadastrar");
      expect(PERMISSOES_SISTEMA).toContain("patrimonio.editar");
      expect(PERMISSOES_SISTEMA).toContain("patrimonio.excluir");
      expect(PERMISSOES_SISTEMA).toContain("patrimonio.relatorios");
    });

    it("master deve ter todas as permissões de patrimônio", () => {
      const perms = PERMISSOES_POR_ROLE.master;
      expect(perms).toContain("patrimonio.ver");
      expect(perms).toContain("patrimonio.cadastrar");
      expect(perms).toContain("patrimonio.editar");
      expect(perms).toContain("patrimonio.excluir");
      expect(perms).toContain("patrimonio.relatorios");
    });

    it("diretor_escola deve ter todas as permissões de patrimônio", () => {
      const perms = PERMISSOES_POR_ROLE.diretor_escola;
      expect(perms).toContain("patrimonio.ver");
      expect(perms).toContain("patrimonio.cadastrar");
      expect(perms).toContain("patrimonio.editar");
      expect(perms).toContain("patrimonio.excluir");
      expect(perms).toContain("patrimonio.relatorios");
    });

    it("diretor_carnaval deve ter todas as permissões de patrimônio", () => {
      const perms = PERMISSOES_POR_ROLE.diretor_carnaval;
      expect(perms).toContain("patrimonio.ver");
      expect(perms).toContain("patrimonio.cadastrar");
      expect(perms).toContain("patrimonio.editar");
      expect(perms).toContain("patrimonio.excluir");
      expect(perms).toContain("patrimonio.relatorios");
    });

    it("diretor_ala deve ter permissões limitadas de patrimônio", () => {
      const perms = PERMISSOES_POR_ROLE.diretor_ala;
      expect(perms).toContain("patrimonio.ver");
      expect(perms).toContain("patrimonio.cadastrar");
      expect(perms).toContain("patrimonio.editar");
      // Não deve ter excluir e relatórios
      expect(perms).not.toContain("patrimonio.excluir");
      expect(perms).not.toContain("patrimonio.relatorios");
    });

    it("integrante NÃO deve ter permissões de patrimônio", () => {
      const perms = PERMISSOES_POR_ROLE.integrante;
      expect(perms).not.toContain("patrimonio.ver");
      expect(perms).not.toContain("patrimonio.cadastrar");
      expect(perms).not.toContain("patrimonio.editar");
      expect(perms).not.toContain("patrimonio.excluir");
    });

    it("pendente NÃO deve ter permissões de patrimônio", () => {
      const perms = PERMISSOES_POR_ROLE.pendente;
      expect(perms).not.toContain("patrimonio.ver");
    });
  });

  // ============================================
  // PERMISSÕES DO PAINEL
  // ============================================
  
  describe("Permissões do Painel da Diretoria", () => {
    it("deve ter permissões de painel no sistema", () => {
      expect(PERMISSOES_SISTEMA).toContain("painel.ver");
      expect(PERMISSOES_SISTEMA).toContain("painel.metricas");
      expect(PERMISSOES_SISTEMA).toContain("painel.aprovacoes");
    });

    it("master deve ter todas as permissões de painel", () => {
      const perms = PERMISSOES_POR_ROLE.master;
      expect(perms).toContain("painel.ver");
      expect(perms).toContain("painel.metricas");
      expect(perms).toContain("painel.aprovacoes");
    });

    it("diretor_escola deve ter todas as permissões de painel", () => {
      const perms = PERMISSOES_POR_ROLE.diretor_escola;
      expect(perms).toContain("painel.ver");
      expect(perms).toContain("painel.metricas");
      expect(perms).toContain("painel.aprovacoes");
    });

    it("diretor_carnaval deve ter todas as permissões de painel", () => {
      const perms = PERMISSOES_POR_ROLE.diretor_carnaval;
      expect(perms).toContain("painel.ver");
      expect(perms).toContain("painel.metricas");
      expect(perms).toContain("painel.aprovacoes");
    });

    it("diretor_ala deve ter permissão de visualizar painel", () => {
      const perms = PERMISSOES_POR_ROLE.diretor_ala;
      expect(perms).toContain("painel.ver");
    });

    it("integrante NÃO deve ter acesso ao painel", () => {
      const perms = PERMISSOES_POR_ROLE.integrante;
      expect(perms).not.toContain("painel.ver");
    });
  });

  // ============================================
  // CATEGORIAS E STATUS DE ATIVOS
  // ============================================
  
  describe("Categorias e Status de Ativos", () => {
    const CATEGORIAS_VALIDAS = [
      "carnavalescos", "instrumentos", "fantasias", "alegorias",
      "aderecos", "equipamentos", "moveis", "outros"
    ];

    const STATUS_VALIDOS = ["bom", "regular", "ruim", "manutencao", "baixado"];

    it("deve ter 8 categorias de ativos válidas", () => {
      expect(CATEGORIAS_VALIDAS).toHaveLength(8);
    });

    it("deve ter 5 status de ativos válidos", () => {
      expect(STATUS_VALIDOS).toHaveLength(5);
    });

    it("cada categoria deve ser uma string não vazia", () => {
      CATEGORIAS_VALIDAS.forEach(cat => {
        expect(cat).toBeTruthy();
        expect(typeof cat).toBe("string");
      });
    });

    it("cada status deve ser uma string não vazia", () => {
      STATUS_VALIDOS.forEach(status => {
        expect(status).toBeTruthy();
        expect(typeof status).toBe("string");
      });
    });
  });

  // ============================================
  // HIERARQUIA DE ACESSO AO PAINEL
  // ============================================
  
  describe("Hierarquia de Acesso ao Painel", () => {
    const ROLES_COM_ACESSO_PAINEL = ["master", "diretor_escola", "diretor_carnaval", "diretor_ala"];
    const ROLES_SEM_ACESSO_PAINEL = ["diretor_segmento", "integrante", "pendente"];

    it("roles de gestão devem ter acesso ao painel", () => {
      ROLES_COM_ACESSO_PAINEL.forEach(role => {
        const perms = PERMISSOES_POR_ROLE[role as keyof typeof PERMISSOES_POR_ROLE];
        expect(perms).toContain("painel.ver");
      });
    });

    it("roles sem gestão NÃO devem ter acesso ao painel", () => {
      ROLES_SEM_ACESSO_PAINEL.forEach(role => {
        const perms = PERMISSOES_POR_ROLE[role as keyof typeof PERMISSOES_POR_ROLE];
        expect(perms).not.toContain("painel.ver");
      });
    });
  });

  // ============================================
  // FORMATAÇÃO DE VALORES
  // ============================================
  
  describe("Formatação de Valores", () => {
    it("deve formatar valores monetários corretamente", () => {
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
      };

      expect(formatCurrency(0)).toBe("R$\u00a00,00");
      expect(formatCurrency(1500.50)).toBe("R$\u00a01.500,50");
      expect(formatCurrency(99999.99)).toBe("R$\u00a099.999,99");
    });

    it("deve formatar datas corretamente", () => {
      const formatDate = (date: Date): string => {
        return date.toLocaleDateString("pt-BR");
      };

      const d = new Date(2025, 0, 15); // 15/01/2025
      expect(formatDate(d)).toBe("15/01/2025");
    });
  });

  // ============================================
  // VALIDAÇÃO DE DADOS DE ATIVOS
  // ============================================
  
  describe("Validação de Dados de Ativos", () => {
    it("nome do ativo deve ser obrigatório", () => {
      const validarAtivo = (data: { nome: string }) => {
        return data.nome.trim().length > 0;
      };

      expect(validarAtivo({ nome: "Surdo de Primeira" })).toBe(true);
      expect(validarAtivo({ nome: "" })).toBe(false);
      expect(validarAtivo({ nome: "   " })).toBe(false);
    });

    it("valor deve ser numérico válido", () => {
      const parseValor = (valor: string): number => {
        return parseFloat(valor.replace(",", ".")) || 0;
      };

      expect(parseValor("1500.00")).toBe(1500);
      expect(parseValor("1500,50")).toBe(1500.5);
      expect(parseValor("abc")).toBe(0);
      expect(parseValor("")).toBe(0);
    });

    it("máscara de data deve formatar corretamente", () => {
      const aplicarMascaraData = (text: string): string => {
        const cleaned = text.replace(/\D/g, "");
        let formatted = "";
        if (cleaned.length <= 2) formatted = cleaned;
        else if (cleaned.length <= 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        else formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        return formatted;
      };

      expect(aplicarMascaraData("15")).toBe("15");
      expect(aplicarMascaraData("1501")).toBe("15/01");
      expect(aplicarMascaraData("15012025")).toBe("15/01/2025");
    });
  });
});
