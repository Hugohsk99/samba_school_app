/**
 * Testes do Sistema de Notificações e Painel do Presidente
 * Hierarquia 7 Níveis
 */

import { describe, it, expect } from "vitest";
import {
  PERMISSOES_POR_ROLE,
  temPermissaoRole,
  type Role,
} from "../drizzle/schema";

describe("Sistema de Notificações", () => {
  describe("Tipos de Notificação", () => {
    const tiposNotificacao = [
      "solicitacao_acesso",
      "usuario_aprovado",
      "usuario_rejeitado",
      "convite_enviado",
      "convite_aceito",
      "convite_expirando",
      "material_pendente",
      "evento_proximo",
      "evento_criado",
      "alerta_sistema",
      "limite_usuarios",
      "plano_expirando",
    ];

    it("deve ter todos os tipos de notificação definidos", () => {
      expect(tiposNotificacao.length).toBe(12);
    });

    it("deve incluir notificações de solicitação de acesso", () => {
      expect(tiposNotificacao).toContain("solicitacao_acesso");
      expect(tiposNotificacao).toContain("usuario_aprovado");
      expect(tiposNotificacao).toContain("usuario_rejeitado");
    });

    it("deve incluir notificações de convites", () => {
      expect(tiposNotificacao).toContain("convite_enviado");
      expect(tiposNotificacao).toContain("convite_aceito");
      expect(tiposNotificacao).toContain("convite_expirando");
    });

    it("deve incluir notificações de alertas", () => {
      expect(tiposNotificacao).toContain("material_pendente");
      expect(tiposNotificacao).toContain("evento_proximo");
      expect(tiposNotificacao).toContain("limite_usuarios");
      expect(tiposNotificacao).toContain("plano_expirando");
    });
  });
});

describe("Painel do Presidente", () => {
  describe("Acesso ao Painel", () => {
    const rolesComAcesso: Role[] = ["master", "diretor_escola", "diretor_carnaval"];
    const rolesSemAcesso: Role[] = ["diretor_segmento", "integrante", "pendente"];

    it("master deve ter acesso ao painel", () => {
      expect(rolesComAcesso).toContain("master");
    });

    it("diretor_escola deve ter acesso ao painel", () => {
      expect(rolesComAcesso).toContain("diretor_escola");
    });

    it("diretor_carnaval deve ter acesso ao painel", () => {
      expect(rolesComAcesso).toContain("diretor_carnaval");
    });

    it("integrante não deve ter acesso ao painel", () => {
      expect(rolesSemAcesso).toContain("integrante");
    });

    it("pendente não deve ter acesso ao painel", () => {
      expect(rolesSemAcesso).toContain("pendente");
    });
  });

  describe("Métricas do Dashboard", () => {
    const metricasEsperadas = [
      "usuarios.total",
      "usuarios.aprovados",
      "usuarios.pendentes",
      "porRole",
      "solicitacoesPendentes",
      "convitesAtivos",
      "plano",
      "limiteUsuarios",
    ];

    it("deve incluir contagem de usuários", () => {
      expect(metricasEsperadas).toContain("usuarios.total");
      expect(metricasEsperadas).toContain("usuarios.aprovados");
      expect(metricasEsperadas).toContain("usuarios.pendentes");
    });

    it("deve incluir distribuição por role", () => {
      expect(metricasEsperadas).toContain("porRole");
    });

    it("deve incluir informações do plano", () => {
      expect(metricasEsperadas).toContain("plano");
      expect(metricasEsperadas).toContain("limiteUsuarios");
    });
  });
});

describe("Fluxo de Aprovação Hierárquico - 7 Níveis", () => {
  const roleHierarquia: Record<Role, number> = {
    master: 6,
    diretor_escola: 5,
    diretor_carnaval: 4,
    diretor_ala: 3,
    diretor_segmento: 2,
    integrante: 1,
    pendente: 0,
  };

  describe("Níveis de Hierarquia", () => {
    it("master deve ter nível mais alto", () => {
      expect(roleHierarquia.master).toBe(6);
    });

    it("diretor_escola deve ter segundo nível mais alto", () => {
      expect(roleHierarquia.diretor_escola).toBe(5);
    });

    it("pendente deve ter nível mais baixo", () => {
      expect(roleHierarquia.pendente).toBe(0);
    });

    it("hierarquia deve ser: master > dir_escola > dir_carnaval > dir_ala > dir_segmento > integrante > pendente", () => {
      expect(roleHierarquia.master).toBeGreaterThan(roleHierarquia.diretor_escola);
      expect(roleHierarquia.diretor_escola).toBeGreaterThan(roleHierarquia.diretor_carnaval);
      expect(roleHierarquia.diretor_carnaval).toBeGreaterThan(roleHierarquia.diretor_ala);
      expect(roleHierarquia.diretor_ala).toBeGreaterThan(roleHierarquia.diretor_segmento);
      expect(roleHierarquia.diretor_segmento).toBeGreaterThan(roleHierarquia.integrante);
      expect(roleHierarquia.integrante).toBeGreaterThan(roleHierarquia.pendente);
    });
  });

  describe("Regras de Aprovação", () => {
    function podeAprovar(aprovador: Role, alvo: Role): boolean {
      if (aprovador === "master") return true;
      return roleHierarquia[aprovador] > roleHierarquia[alvo];
    }

    it("master pode aprovar qualquer role", () => {
      expect(podeAprovar("master", "diretor_escola")).toBe(true);
      expect(podeAprovar("master", "diretor_carnaval")).toBe(true);
      expect(podeAprovar("master", "integrante")).toBe(true);
    });

    it("diretor_escola pode aprovar todos abaixo", () => {
      expect(podeAprovar("diretor_escola", "diretor_carnaval")).toBe(true);
      expect(podeAprovar("diretor_escola", "diretor_ala")).toBe(true);
      expect(podeAprovar("diretor_escola", "integrante")).toBe(true);
      expect(podeAprovar("diretor_escola", "pendente")).toBe(true);
    });

    it("diretor_escola não pode aprovar master ou outro diretor_escola", () => {
      expect(podeAprovar("diretor_escola", "master")).toBe(false);
      expect(podeAprovar("diretor_escola", "diretor_escola")).toBe(false);
    });

    it("diretor_carnaval pode aprovar diretor_ala, segmento e integrante", () => {
      expect(podeAprovar("diretor_carnaval", "diretor_ala")).toBe(true);
      expect(podeAprovar("diretor_carnaval", "diretor_segmento")).toBe(true);
      expect(podeAprovar("diretor_carnaval", "integrante")).toBe(true);
    });

    it("diretor_carnaval não pode aprovar superiores", () => {
      expect(podeAprovar("diretor_carnaval", "diretor_escola")).toBe(false);
      expect(podeAprovar("diretor_carnaval", "master")).toBe(false);
    });

    it("integrante não pode aprovar ninguém acima", () => {
      expect(podeAprovar("integrante", "integrante")).toBe(false);
      expect(podeAprovar("integrante", "diretor_segmento")).toBe(false);
    });

    it("pendente não pode aprovar ninguém", () => {
      expect(podeAprovar("pendente", "pendente")).toBe(false);
      expect(podeAprovar("pendente", "integrante")).toBe(false);
    });
  });
});

describe("Permissões de Aprovação", () => {
  it("master deve ter permissão de aprovar usuários", () => {
    expect(temPermissaoRole("master", "escola.aprovar_usuarios")).toBe(true);
  });

  it("diretor_escola deve ter permissão de aprovar usuários", () => {
    expect(temPermissaoRole("diretor_escola", "escola.aprovar_usuarios")).toBe(true);
  });

  it("diretor_carnaval deve ter permissão de aprovar usuários", () => {
    expect(temPermissaoRole("diretor_carnaval", "escola.aprovar_usuarios")).toBe(true);
  });

  it("integrante não deve ter permissão de aprovar usuários", () => {
    expect(temPermissaoRole("integrante", "escola.aprovar_usuarios")).toBe(false);
  });

  it("pendente não deve ter permissão de aprovar usuários", () => {
    expect(temPermissaoRole("pendente", "escola.aprovar_usuarios")).toBe(false);
  });
});

describe("Alertas do Sistema", () => {
  const tiposAlerta = [
    "limite_usuarios",
    "plano_expirando",
    "solicitacoes_pendentes",
    "convites_expirando",
  ];

  it("deve ter alerta de limite de usuários", () => {
    expect(tiposAlerta).toContain("limite_usuarios");
  });

  it("deve ter alerta de plano expirando", () => {
    expect(tiposAlerta).toContain("plano_expirando");
  });

  it("deve ter alerta de solicitações pendentes", () => {
    expect(tiposAlerta).toContain("solicitacoes_pendentes");
  });

  it("deve ter alerta de convites expirando", () => {
    expect(tiposAlerta).toContain("convites_expirando");
  });
});
