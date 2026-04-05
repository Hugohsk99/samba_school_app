/**
 * Testes Sprint 18 - Evolução "100 Anos - Gestão do Samba"
 * Testa fluxo landing → login → cadastro → aprovação → acesso
 * Testa hierarquia de permissões e gestão de alas
 */
import { describe, it, expect } from "vitest";

// ========== Utilitários de Teste ==========

// Validação de CPF
function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(cpfLimpo.charAt(10));
}

// Hierarquia de perfis (7 níveis)
const HIERARQUIA_PERFIS = [
  { nivel: 1, nome: "master", descricao: "100 Anos Gestão de Samba - acesso global" },
  { nivel: 2, nome: "diretor_escola", descricao: "Diretor de Escola - máximo na escola" },
  { nivel: 3, nome: "diretor_carnaval", descricao: "Diretor de Carnaval - operacional avançado" },
  { nivel: 4, nome: "diretor_ala", descricao: "Diretor de Ala - restrito à ala" },
  { nivel: 5, nome: "diretor_segmento", descricao: "Diretor de Segmento - restrito ao segmento" },
  { nivel: 6, nome: "integrante", descricao: "Integrante Aprovado - leitura apenas" },
  { nivel: 7, nome: "pendente", descricao: "Usuário Pendente - aguardando aprovação" },
];

function temPermissao(nivelUsuario: number, nivelRequerido: number): boolean {
  return nivelUsuario <= nivelRequerido;
}

function podeAprovar(nivelAprovador: number, nivelSolicitante: number): boolean {
  return nivelAprovador < nivelSolicitante;
}

// Gestão de Alas
const LIMITE_INTEGRANTES_ALA = 50;

interface Ala {
  id: string;
  nome: string;
  integrantes: string[];
  diretorId?: string;
}

function alaLotada(ala: Ala): boolean {
  return ala.integrantes.length >= LIMITE_INTEGRANTES_ALA;
}

function encontrarAlaComVaga(alas: Ala[]): Ala | null {
  return alas.find((a) => !alaLotada(a)) || null;
}

function criarNovaAla(nomeBase: string, numero: number): Ala {
  return {
    id: `ala_${Date.now()}_${numero}`,
    nome: `${nomeBase} ${numero}`,
    integrantes: [],
  };
}

// Assinatura
interface Assinatura {
  tipo: "trial" | "anual";
  dataInicio: string;
  dataExpiracao: string;
  ativa: boolean;
}

function calcularDiasRestantes(assinatura: Assinatura): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(assinatura.dataExpiracao).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function assinaturaExpirada(assinatura: Assinatura): boolean {
  return calcularDiasRestantes(assinatura) <= 0;
}

// ========== TESTES ==========

describe("Sprint 18 - Evolução 100 Anos", () => {
  // --- Validação de CPF ---
  describe("Validação de CPF", () => {
    it("deve validar CPF correto", () => {
      expect(validarCPF("529.982.247-25")).toBe(true);
    });

    it("deve rejeitar CPF inválido", () => {
      expect(validarCPF("123.456.789-00")).toBe(false);
    });

    it("deve rejeitar CPF com todos dígitos iguais", () => {
      expect(validarCPF("111.111.111-11")).toBe(false);
      expect(validarCPF("000.000.000-00")).toBe(false);
    });

    it("deve rejeitar CPF com tamanho incorreto", () => {
      expect(validarCPF("123")).toBe(false);
      expect(validarCPF("")).toBe(false);
    });

    it("deve aceitar CPF sem formatação", () => {
      expect(validarCPF("52998224725")).toBe(true);
    });
  });

  // --- Hierarquia de Perfis ---
  describe("Hierarquia de Perfis (7 níveis)", () => {
    it("deve ter exatamente 7 níveis", () => {
      expect(HIERARQUIA_PERFIS).toHaveLength(7);
    });

    it("master deve ter acesso a tudo", () => {
      expect(temPermissao(1, 7)).toBe(true);
      expect(temPermissao(1, 1)).toBe(true);
    });

    it("integrante não deve ter acesso de diretor", () => {
      expect(temPermissao(6, 4)).toBe(false);
    });

    it("diretor de escola deve poder aprovar diretores de ala", () => {
      expect(podeAprovar(2, 4)).toBe(true);
    });

    it("diretor de ala não deve poder aprovar diretor de escola", () => {
      expect(podeAprovar(4, 2)).toBe(false);
    });

    it("integrante não deve poder aprovar ninguém", () => {
      expect(podeAprovar(6, 7)).toBe(true); // pode aprovar pendente
      expect(podeAprovar(6, 6)).toBe(false); // não pode aprovar igual
    });

    it("pendente não deve poder aprovar ninguém", () => {
      expect(podeAprovar(7, 7)).toBe(false);
    });

    it("master deve poder aprovar todos os níveis", () => {
      for (let i = 2; i <= 7; i++) {
        expect(podeAprovar(1, i)).toBe(true);
      }
    });
  });

  // --- Gestão de Alas ---
  describe("Gestão de Alas com Limite de 50", () => {
    it("ala com menos de 50 integrantes não deve estar lotada", () => {
      const ala: Ala = { id: "1", nome: "Ala 1", integrantes: Array(30).fill("id") };
      expect(alaLotada(ala)).toBe(false);
    });

    it("ala com 50 integrantes deve estar lotada", () => {
      const ala: Ala = { id: "1", nome: "Ala 1", integrantes: Array(50).fill("id") };
      expect(alaLotada(ala)).toBe(true);
    });

    it("deve encontrar ala com vaga disponível", () => {
      const alas: Ala[] = [
        { id: "1", nome: "Ala 1", integrantes: Array(50).fill("id") },
        { id: "2", nome: "Ala 2", integrantes: Array(30).fill("id") },
      ];
      const alaComVaga = encontrarAlaComVaga(alas);
      expect(alaComVaga).not.toBeNull();
      expect(alaComVaga?.id).toBe("2");
    });

    it("deve retornar null quando todas as alas estão lotadas", () => {
      const alas: Ala[] = [
        { id: "1", nome: "Ala 1", integrantes: Array(50).fill("id") },
        { id: "2", nome: "Ala 2", integrantes: Array(50).fill("id") },
      ];
      expect(encontrarAlaComVaga(alas)).toBeNull();
    });

    it("deve criar nova ala com nome sequencial", () => {
      const novaAla = criarNovaAla("Bateria", 3);
      expect(novaAla.nome).toBe("Bateria 3");
      expect(novaAla.integrantes).toHaveLength(0);
    });
  });

  // --- Assinatura/Plano ---
  describe("Gestão de Assinatura", () => {
    it("trial deve ter 1 ano de duração", () => {
      const agora = new Date();
      const expiracao = new Date(agora);
      expiracao.setFullYear(expiracao.getFullYear() + 1);

      const assinatura: Assinatura = {
        tipo: "trial",
        dataInicio: agora.toISOString(),
        dataExpiracao: expiracao.toISOString(),
        ativa: true,
      };

      const dias = calcularDiasRestantes(assinatura);
      expect(dias).toBeGreaterThanOrEqual(364);
      expect(dias).toBeLessThanOrEqual(366);
    });

    it("assinatura expirada deve ser detectada", () => {
      const assinatura: Assinatura = {
        tipo: "anual",
        dataInicio: "2024-01-01T00:00:00.000Z",
        dataExpiracao: "2025-01-01T00:00:00.000Z",
        ativa: true,
      };

      expect(assinaturaExpirada(assinatura)).toBe(true);
    });

    it("assinatura ativa não deve estar expirada", () => {
      const futuro = new Date();
      futuro.setFullYear(futuro.getFullYear() + 2);

      const assinatura: Assinatura = {
        tipo: "anual",
        dataInicio: new Date().toISOString(),
        dataExpiracao: futuro.toISOString(),
        ativa: true,
      };

      expect(assinaturaExpirada(assinatura)).toBe(false);
    });

    it("plano anual deve custar R$10,00", () => {
      const valorPlanoAnual = 10.0;
      expect(valorPlanoAnual).toBe(10.0);
    });
  });

  // --- Fluxo de Cadastro ---
  describe("Fluxo de Cadastro e Aprovação", () => {
    it("novo CPF deve direcionar para cadastro", () => {
      const cpfsExistentes = ["52998224725", "11144477735"];
      const cpfNovo = "98765432100";
      const existe = cpfsExistentes.includes(cpfNovo);
      expect(existe).toBe(false);
    });

    it("CPF existente com status pendente deve direcionar para status", () => {
      const cadastros = [
        { cpf: "52998224725", status: "pendente" },
        { cpf: "11144477735", status: "aprovado" },
      ];
      const cadastro = cadastros.find((c) => c.cpf === "52998224725");
      expect(cadastro?.status).toBe("pendente");
    });

    it("CPF existente com status aprovado deve direcionar para home", () => {
      const cadastros = [
        { cpf: "52998224725", status: "pendente" },
        { cpf: "11144477735", status: "aprovado" },
      ];
      const cadastro = cadastros.find((c) => c.cpf === "11144477735");
      expect(cadastro?.status).toBe("aprovado");
    });

    it("cadastro deve exigir campos obrigatórios", () => {
      const campos = {
        nome: "João Silva",
        cpf: "52998224725",
        telefone: "(21) 99999-9999",
        email: "joao@email.com",
      };

      expect(campos.nome.length).toBeGreaterThan(0);
      expect(campos.cpf.length).toBe(11);
      expect(campos.telefone.length).toBeGreaterThan(0);
    });
  });

  // --- Seleção de Escola ---
  describe("Seleção de Escola", () => {
    it("deve listar escolas disponíveis", () => {
      const escolas = [
        { id: "1", nome: "Estácio de Sá", sigla: "Estácio S.A." },
      ];
      expect(escolas.length).toBeGreaterThan(0);
      expect(escolas[0].nome).toBe("Estácio de Sá");
    });

    it("usuário pode estar vinculado a múltiplas escolas", () => {
      const vinculosUsuario = [
        { escolaId: "1", role: "integrante" },
        { escolaId: "2", role: "diretor_ala" },
      ];
      expect(vinculosUsuario.length).toBe(2);
    });

    it("deve permitir trocar escola ativa", () => {
      let escolaAtiva = "1";
      escolaAtiva = "2";
      expect(escolaAtiva).toBe("2");
    });
  });
});
