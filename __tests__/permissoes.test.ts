/**
 * Testes do Sistema de Permissões
 */

import { describe, it, expect } from "vitest";
import { 
  PERMISSOES_POR_ROLE, 
  temPermissaoRole, 
  Role,
  PermissaoSistema,
} from "../drizzle/schema";

describe("Sistema de Permissões", () => {
  describe("Hierarquia de Roles", () => {
    it("Master deve ter todas as permissões", () => {
      const permissoesMaster = PERMISSOES_POR_ROLE.master;
      expect(permissoesMaster.length).toBeGreaterThan(30);
      expect(permissoesMaster).toContain("escola.editar");
      expect(permissoesMaster).toContain("usuarios.alterar_role");
      expect(permissoesMaster).toContain("financeiro.relatorios");
      expect(permissoesMaster).toContain("configuracoes.gestao_dados");
    });

    it("Presidente deve ter permissões de gestão completa", () => {
      const permissoesPresidente = PERMISSOES_POR_ROLE.presidente;
      expect(permissoesPresidente).toContain("escola.editar");
      expect(permissoesPresidente).toContain("escola.gerenciar_plano");
      expect(permissoesPresidente).toContain("escola.aprovar_usuarios");
      expect(permissoesPresidente).toContain("usuarios.alterar_role");
      expect(permissoesPresidente).toContain("financeiro.ver");
      expect(permissoesPresidente).toContain("financeiro.relatorios");
    });

    it("Diretor deve ter permissões de gestão de blocos e eventos", () => {
      const permissoesDiretor = PERMISSOES_POR_ROLE.diretor;
      expect(permissoesDiretor).toContain("escola.aprovar_usuarios");
      expect(permissoesDiretor).toContain("blocos.ver_todos");
      expect(permissoesDiretor).toContain("blocos.editar");
      expect(permissoesDiretor).toContain("eventos.cadastrar");
      expect(permissoesDiretor).toContain("eventos.checkin");
      expect(permissoesDiretor).toContain("almoxarifado.entregar_devolver");
      // Não deve ter acesso financeiro
      expect(permissoesDiretor).not.toContain("financeiro.ver");
    });

    it("Coordenador deve ter permissões operacionais", () => {
      const permissoesCoordenador = PERMISSOES_POR_ROLE.coordenador;
      expect(permissoesCoordenador).toContain("eventos.checkin");
      expect(permissoesCoordenador).toContain("almoxarifado.entregar_devolver");
      expect(permissoesCoordenador).toContain("relatorios.presenca");
      // Não deve aprovar usuários
      expect(permissoesCoordenador).not.toContain("escola.aprovar_usuarios");
    });

    it("Integrante deve ter permissões básicas de visualização", () => {
      const permissoesIntegrante = PERMISSOES_POR_ROLE.integrante;
      expect(permissoesIntegrante).toContain("blocos.ver_todos");
      expect(permissoesIntegrante).toContain("eventos.ver_todos");
      // Não deve cadastrar ou editar
      expect(permissoesIntegrante).not.toContain("eventos.cadastrar");
      expect(permissoesIntegrante).not.toContain("almoxarifado.cadastrar");
    });

    it("Contribuinte deve ter permissões mínimas", () => {
      const permissoesContribuinte = PERMISSOES_POR_ROLE.contribuinte;
      expect(permissoesContribuinte).toContain("eventos.ver_todos");
      expect(permissoesContribuinte.length).toBeLessThan(5);
      // Não deve ver blocos
      expect(permissoesContribuinte).not.toContain("blocos.ver_todos");
    });
  });

  describe("Função temPermissaoRole", () => {
    it("deve retornar true para permissões do role", () => {
      expect(temPermissaoRole("master", "escola.editar")).toBe(true);
      expect(temPermissaoRole("presidente", "usuarios.alterar_role")).toBe(true);
      expect(temPermissaoRole("diretor", "eventos.checkin")).toBe(true);
    });

    it("deve retornar false para permissões não pertencentes ao role", () => {
      expect(temPermissaoRole("integrante", "financeiro.ver")).toBe(false);
      expect(temPermissaoRole("contribuinte", "blocos.cadastrar")).toBe(false);
      expect(temPermissaoRole("coordenador", "usuarios.alterar_role")).toBe(false);
    });
  });

  describe("Hierarquia de Permissões", () => {
    it("roles superiores devem ter mais permissões que inferiores", () => {
      const master = PERMISSOES_POR_ROLE.master.length;
      const presidente = PERMISSOES_POR_ROLE.presidente.length;
      const diretor = PERMISSOES_POR_ROLE.diretor.length;
      const coordenador = PERMISSOES_POR_ROLE.coordenador.length;
      const integrante = PERMISSOES_POR_ROLE.integrante.length;
      const contribuinte = PERMISSOES_POR_ROLE.contribuinte.length;

      expect(master).toBeGreaterThanOrEqual(presidente);
      expect(presidente).toBeGreaterThan(diretor);
      expect(diretor).toBeGreaterThan(coordenador);
      expect(coordenador).toBeGreaterThan(integrante);
      expect(integrante).toBeGreaterThanOrEqual(contribuinte);
    });
  });

  describe("Permissões Específicas", () => {
    it("apenas presidente e master podem gerenciar plano", () => {
      expect(temPermissaoRole("master", "escola.gerenciar_plano")).toBe(true);
      expect(temPermissaoRole("presidente", "escola.gerenciar_plano")).toBe(true);
      expect(temPermissaoRole("diretor", "escola.gerenciar_plano")).toBe(false);
      expect(temPermissaoRole("coordenador", "escola.gerenciar_plano")).toBe(false);
    });

    it("apenas gestores podem aprovar usuários", () => {
      expect(temPermissaoRole("master", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("presidente", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("diretor", "escola.aprovar_usuarios")).toBe(true);
      expect(temPermissaoRole("coordenador", "escola.aprovar_usuarios")).toBe(false);
      expect(temPermissaoRole("integrante", "escola.aprovar_usuarios")).toBe(false);
    });

    it("apenas presidente e master podem alterar roles", () => {
      expect(temPermissaoRole("master", "usuarios.alterar_role")).toBe(true);
      expect(temPermissaoRole("presidente", "usuarios.alterar_role")).toBe(true);
      expect(temPermissaoRole("diretor", "usuarios.alterar_role")).toBe(false);
    });

    it("financeiro deve ser restrito a presidente e master", () => {
      expect(temPermissaoRole("master", "financeiro.ver")).toBe(true);
      expect(temPermissaoRole("presidente", "financeiro.ver")).toBe(true);
      expect(temPermissaoRole("diretor", "financeiro.ver")).toBe(false);
      expect(temPermissaoRole("coordenador", "financeiro.ver")).toBe(false);
    });

    it("check-in deve ser acessível para coordenadores e acima", () => {
      expect(temPermissaoRole("master", "eventos.checkin")).toBe(true);
      expect(temPermissaoRole("presidente", "eventos.checkin")).toBe(true);
      expect(temPermissaoRole("diretor", "eventos.checkin")).toBe(true);
      expect(temPermissaoRole("coordenador", "eventos.checkin")).toBe(true);
      expect(temPermissaoRole("integrante", "eventos.checkin")).toBe(false);
    });
  });

  describe("Consistência do Schema", () => {
    it("todos os roles devem estar definidos", () => {
      const roles: Role[] = ["master", "presidente", "diretor", "coordenador", "integrante", "contribuinte"];
      roles.forEach(role => {
        expect(PERMISSOES_POR_ROLE[role]).toBeDefined();
        expect(Array.isArray(PERMISSOES_POR_ROLE[role])).toBe(true);
      });
    });

    it("não deve haver permissões duplicadas em um role", () => {
      Object.entries(PERMISSOES_POR_ROLE).forEach(([role, permissoes]) => {
        const unique = new Set(permissoes);
        expect(unique.size).toBe(permissoes.length);
      });
    });
  });
});
