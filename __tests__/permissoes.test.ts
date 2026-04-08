/**
 * Testes do Sistema de Permissões - Hierarquia 7 Níveis
 */

import { describe, it, expect } from "vitest";
import { 
  PERMISSOES_POR_ROLE, 
  temPermissaoRole, 
  type Role,
} from "../drizzle/schema";

describe("Sistema de Permissões - 7 Níveis", () => {
  describe("Hierarquia de Roles", () => {
    it("Master deve ter todas as permissões", () => {
      const permissoesMaster = PERMISSOES_POR_ROLE.master;
      expect(permissoesMaster.length).toBeGreaterThan(20);
      expect(permissoesMaster).toContain("escola.editar");
      expect(permissoesMaster).toContain("escola.aprovar_usuarios");
    });

    it("Diretor de Escola deve ter permissões de gestão completa", () => {
      const permissoes = PERMISSOES_POR_ROLE.diretor_escola;
      expect(permissoes).toContain("escola.editar");
      expect(permissoes).toContain("escola.gerenciar_plano");
      expect(permissoes).toContain("escola.aprovar_usuarios");
    });

    it("Diretor de Carnaval deve ter permissões operacionais avançadas", () => {
      const permissoes = PERMISSOES_POR_ROLE.diretor_carnaval;
      expect(permissoes).toContain("eventos.cadastrar");
      expect(permissoes).toContain("eventos.editar");
      expect(permissoes).toContain("escola.aprovar_usuarios");
    });

    it("Diretor de Ala deve ter permissões de gestão de ala", () => {
      const permissoes = PERMISSOES_POR_ROLE.diretor_ala;
      expect(permissoes).toContain("usuarios.ver_todos");
    });

    it("Diretor de Segmento deve ter permissões limitadas ao segmento", () => {
      const permissoes = PERMISSOES_POR_ROLE.diretor_segmento;
      expect(permissoes).toContain("usuarios.ver_todos");
    });

    it("Integrante deve ter permissões básicas de visualização", () => {
      const permissoes = PERMISSOES_POR_ROLE.integrante;
      expect(permissoes).toContain("eventos.ver_todos");
      expect(permissoes).toContain("blocos.ver_todos");
    });

    it("Pendente não deve ter permissões", () => {
      const permissoes = PERMISSOES_POR_ROLE.pendente;
      expect(permissoes.length).toBe(0);
    });
  });

  describe("Função temPermissaoRole", () => {
    it("deve retornar true para permissões do role", () => {
      expect(temPermissaoRole("master", "escola.editar")).toBe(true);
      expect(temPermissaoRole("diretor_escola", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("diretor_carnaval", "eventos.cadastrar")).toBe(true);
    });

    it("deve retornar false para permissões não pertencentes ao role", () => {
      expect(temPermissaoRole("integrante", "financeiro.ver")).toBe(false);
      expect(temPermissaoRole("pendente", "eventos.ver_todos")).toBe(false);
    });
  });

  describe("Hierarquia de Permissões", () => {
    it("roles superiores devem ter mais permissões que inferiores", () => {
      const master = PERMISSOES_POR_ROLE.master.length;
      const dirEscola = PERMISSOES_POR_ROLE.diretor_escola.length;
      const dirCarnaval = PERMISSOES_POR_ROLE.diretor_carnaval.length;
      const dirAla = PERMISSOES_POR_ROLE.diretor_ala.length;
      const dirSegmento = PERMISSOES_POR_ROLE.diretor_segmento.length;
      const integrante = PERMISSOES_POR_ROLE.integrante.length;
      const pendente = PERMISSOES_POR_ROLE.pendente.length;

      expect(master).toBeGreaterThanOrEqual(dirEscola);
      expect(dirEscola).toBeGreaterThanOrEqual(dirCarnaval);
      expect(dirCarnaval).toBeGreaterThanOrEqual(dirAla);
      expect(dirAla).toBeGreaterThanOrEqual(dirSegmento);
      expect(dirSegmento).toBeGreaterThanOrEqual(integrante);
      expect(integrante).toBeGreaterThan(pendente);
    });
  });

  describe("Permissões Específicas", () => {
    it("apenas diretor_escola e master podem gerenciar plano", () => {
      expect(temPermissaoRole("master", "escola.gerenciar_plano")).toBe(true);
      expect(temPermissaoRole("diretor_escola", "escola.gerenciar_plano")).toBe(true);
      expect(temPermissaoRole("diretor_carnaval", "escola.gerenciar_plano")).toBe(false);
      expect(temPermissaoRole("integrante", "escola.gerenciar_plano")).toBe(false);
    });

    it("gestores podem aprovar usuários", () => {
      expect(temPermissaoRole("master", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("diretor_escola", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("diretor_carnaval", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("integrante", "escola.aprovar_usuarios")).toBe(false);
    });
  });

  describe("Consistência do Schema", () => {
    it("todos os 7 roles devem estar definidos", () => {
      const roles: Role[] = [
        "master",
        "diretor_escola",
        "diretor_carnaval",
        "diretor_ala",
        "diretor_segmento",
        "integrante",
        "pendente",
      ];
      roles.forEach(role => {
        expect(PERMISSOES_POR_ROLE[role]).toBeDefined();
        expect(Array.isArray(PERMISSOES_POR_ROLE[role])).toBe(true);
      });
    });

    it("não deve haver permissões duplicadas em um role", () => {
      Object.entries(PERMISSOES_POR_ROLE).forEach(([, permissoes]) => {
        const unique = new Set(permissoes);
        expect(unique.size).toBe(permissoes.length);
      });
    });
  });
});
