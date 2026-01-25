/**
 * Testes do fluxo de materiais/fantasias
 * Valida entrega, devolução e rastreabilidade
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Tipos simulados para teste
interface Material {
  id: string;
  nome: string;
  categoria: string;
  quantidadeDisponivel: number;
  quantidadeEmUso: number;
  quantidadeNecessaria: number;
  status?: string;
  integranteAtualId?: string;
}

interface Integrante {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  qrCodeId: string;
}

interface EntregaFantasia {
  id: string;
  materialId: string;
  integranteId: string;
  dataEntrega: string;
  responsavelEntrega: string;
  status: 'entregue' | 'devolvido' | 'pendente' | 'extraviado';
  estadoConservacao?: string;
  dataDevolucao?: string;
}

// Funções de lógica de negócio (simulando o comportamento real)
function verificarMaterialDisponivel(material: Material): boolean {
  return material.quantidadeDisponivel > 0;
}

function verificarIntegranteJaTemMaterial(
  entregasFantasias: EntregaFantasia[],
  integranteId: string,
  materialId: string
): boolean {
  return entregasFantasias.some(
    e => e.integranteId === integranteId && 
         e.materialId === materialId && 
         e.status === 'entregue'
  );
}

function registrarEntrega(
  material: Material,
  integrante: Integrante,
  responsavel: string
): { entrega: EntregaFantasia; materialAtualizado: Material } {
  const entrega: EntregaFantasia = {
    id: `entrega_${Date.now()}`,
    materialId: material.id,
    integranteId: integrante.id,
    dataEntrega: new Date().toISOString(),
    responsavelEntrega: responsavel,
    status: 'entregue',
  };

  const materialAtualizado: Material = {
    ...material,
    quantidadeDisponivel: material.quantidadeDisponivel - 1,
    quantidadeEmUso: (material.quantidadeEmUso || 0) + 1,
    status: material.quantidadeDisponivel - 1 === 0 ? 'emprestado' : 'disponivel',
    integranteAtualId: integrante.id,
  };

  return { entrega, materialAtualizado };
}

function registrarDevolucao(
  entrega: EntregaFantasia,
  material: Material,
  responsavel: string,
  estadoConservacao: string
): { entregaAtualizada: EntregaFantasia; materialAtualizado: Material } {
  const entregaAtualizada: EntregaFantasia = {
    ...entrega,
    status: 'devolvido',
    dataDevolucao: new Date().toISOString(),
    estadoConservacao,
  };

  const materialAtualizado: Material = {
    ...material,
    quantidadeDisponivel: material.quantidadeDisponivel + 1,
    quantidadeEmUso: Math.max(0, (material.quantidadeEmUso || 0) - 1),
    status: 'disponivel',
    integranteAtualId: undefined,
  };

  return { entregaAtualizada, materialAtualizado };
}

function getEntregasPendentes(entregasFantasias: EntregaFantasia[]): EntregaFantasia[] {
  return entregasFantasias.filter(e => e.status === 'entregue');
}

function getMateriaisDoIntegrante(
  entregasFantasias: EntregaFantasia[],
  materiais: Material[],
  integranteId: string
): { entrega: EntregaFantasia; material: Material }[] {
  return entregasFantasias
    .filter(e => e.integranteId === integranteId && e.status === 'entregue')
    .map(e => {
      const material = materiais.find(m => m.id === e.materialId);
      return material ? { entrega: e, material } : null;
    })
    .filter((item): item is { entrega: EntregaFantasia; material: Material } => item !== null);
}

function calcularDiasEmprestado(dataEntrega: string): number {
  const entrega = new Date(dataEntrega);
  const hoje = new Date();
  const diffTime = Math.abs(hoje.getTime() - entrega.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

describe('Fluxo de Materiais/Fantasias', () => {
  let materiais: Material[];
  let integrantes: Integrante[];
  let entregasFantasias: EntregaFantasia[];

  beforeEach(() => {
    // Dados de teste
    materiais = [
      {
        id: 'mat_1',
        nome: 'Fantasia Passista',
        categoria: 'fantasia',
        quantidadeDisponivel: 5,
        quantidadeEmUso: 0,
        quantidadeNecessaria: 10,
      },
      {
        id: 'mat_2',
        nome: 'Chapéu Ala',
        categoria: 'aderecos',
        quantidadeDisponivel: 0,
        quantidadeEmUso: 3,
        quantidadeNecessaria: 3,
      },
    ];

    integrantes = [
      {
        id: 'int_1',
        nome: 'Maria Silva',
        telefone: '(11) 99999-1111',
        ativo: true,
        qrCodeId: 'qr_maria_001',
      },
      {
        id: 'int_2',
        nome: 'João Santos',
        telefone: '(11) 99999-2222',
        ativo: true,
        qrCodeId: 'qr_joao_002',
      },
    ];

    entregasFantasias = [];
  });

  describe('Verificação de Disponibilidade', () => {
    it('deve retornar true quando material tem estoque disponível', () => {
      const resultado = verificarMaterialDisponivel(materiais[0]);
      expect(resultado).toBe(true);
    });

    it('deve retornar false quando material não tem estoque', () => {
      const resultado = verificarMaterialDisponivel(materiais[1]);
      expect(resultado).toBe(false);
    });
  });

  describe('Verificação de Duplicidade', () => {
    it('deve retornar false quando integrante não tem o material', () => {
      const resultado = verificarIntegranteJaTemMaterial(
        entregasFantasias,
        'int_1',
        'mat_1'
      );
      expect(resultado).toBe(false);
    });

    it('deve retornar true quando integrante já tem o material emprestado', () => {
      entregasFantasias.push({
        id: 'ent_1',
        materialId: 'mat_1',
        integranteId: 'int_1',
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: 'Admin',
        status: 'entregue',
      });

      const resultado = verificarIntegranteJaTemMaterial(
        entregasFantasias,
        'int_1',
        'mat_1'
      );
      expect(resultado).toBe(true);
    });

    it('deve retornar false quando material foi devolvido', () => {
      entregasFantasias.push({
        id: 'ent_1',
        materialId: 'mat_1',
        integranteId: 'int_1',
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: 'Admin',
        status: 'devolvido',
      });

      const resultado = verificarIntegranteJaTemMaterial(
        entregasFantasias,
        'int_1',
        'mat_1'
      );
      expect(resultado).toBe(false);
    });
  });

  describe('Registro de Entrega', () => {
    it('deve criar registro de entrega corretamente', () => {
      const { entrega, materialAtualizado } = registrarEntrega(
        materiais[0],
        integrantes[0],
        'Admin'
      );

      expect(entrega.materialId).toBe('mat_1');
      expect(entrega.integranteId).toBe('int_1');
      expect(entrega.status).toBe('entregue');
      expect(entrega.responsavelEntrega).toBe('Admin');
    });

    it('deve decrementar quantidade disponível após entrega', () => {
      const { materialAtualizado } = registrarEntrega(
        materiais[0],
        integrantes[0],
        'Admin'
      );

      expect(materialAtualizado.quantidadeDisponivel).toBe(4);
      expect(materialAtualizado.quantidadeEmUso).toBe(1);
    });

    it('deve marcar material como emprestado quando última unidade é entregue', () => {
      const materialUnico: Material = {
        ...materiais[0],
        quantidadeDisponivel: 1,
      };

      const { materialAtualizado } = registrarEntrega(
        materialUnico,
        integrantes[0],
        'Admin'
      );

      expect(materialAtualizado.quantidadeDisponivel).toBe(0);
      expect(materialAtualizado.status).toBe('emprestado');
    });

    it('deve registrar integrante atual no material', () => {
      const { materialAtualizado } = registrarEntrega(
        materiais[0],
        integrantes[0],
        'Admin'
      );

      expect(materialAtualizado.integranteAtualId).toBe('int_1');
    });
  });

  describe('Registro de Devolução', () => {
    it('deve atualizar status da entrega para devolvido', () => {
      const entregaOriginal: EntregaFantasia = {
        id: 'ent_1',
        materialId: 'mat_1',
        integranteId: 'int_1',
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: 'Admin',
        status: 'entregue',
      };

      const materialComEmprestimo: Material = {
        ...materiais[0],
        quantidadeDisponivel: 4,
        quantidadeEmUso: 1,
      };

      const { entregaAtualizada } = registrarDevolucao(
        entregaOriginal,
        materialComEmprestimo,
        'Admin',
        'bom'
      );

      expect(entregaAtualizada.status).toBe('devolvido');
      expect(entregaAtualizada.estadoConservacao).toBe('bom');
      expect(entregaAtualizada.dataDevolucao).toBeDefined();
    });

    it('deve incrementar quantidade disponível após devolução', () => {
      const entregaOriginal: EntregaFantasia = {
        id: 'ent_1',
        materialId: 'mat_1',
        integranteId: 'int_1',
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: 'Admin',
        status: 'entregue',
      };

      const materialComEmprestimo: Material = {
        ...materiais[0],
        quantidadeDisponivel: 4,
        quantidadeEmUso: 1,
      };

      const { materialAtualizado } = registrarDevolucao(
        entregaOriginal,
        materialComEmprestimo,
        'Admin',
        'bom'
      );

      expect(materialAtualizado.quantidadeDisponivel).toBe(5);
      expect(materialAtualizado.quantidadeEmUso).toBe(0);
    });

    it('deve limpar integrante atual do material após devolução', () => {
      const entregaOriginal: EntregaFantasia = {
        id: 'ent_1',
        materialId: 'mat_1',
        integranteId: 'int_1',
        dataEntrega: new Date().toISOString(),
        responsavelEntrega: 'Admin',
        status: 'entregue',
      };

      const materialComEmprestimo: Material = {
        ...materiais[0],
        quantidadeDisponivel: 4,
        quantidadeEmUso: 1,
        integranteAtualId: 'int_1',
      };

      const { materialAtualizado } = registrarDevolucao(
        entregaOriginal,
        materialComEmprestimo,
        'Admin',
        'bom'
      );

      expect(materialAtualizado.integranteAtualId).toBeUndefined();
      expect(materialAtualizado.status).toBe('disponivel');
    });
  });

  describe('Consultas de Entregas', () => {
    it('deve retornar apenas entregas pendentes', () => {
      entregasFantasias = [
        {
          id: 'ent_1',
          materialId: 'mat_1',
          integranteId: 'int_1',
          dataEntrega: new Date().toISOString(),
          responsavelEntrega: 'Admin',
          status: 'entregue',
        },
        {
          id: 'ent_2',
          materialId: 'mat_2',
          integranteId: 'int_2',
          dataEntrega: new Date().toISOString(),
          responsavelEntrega: 'Admin',
          status: 'devolvido',
        },
      ];

      const pendentes = getEntregasPendentes(entregasFantasias);
      expect(pendentes.length).toBe(1);
      expect(pendentes[0].id).toBe('ent_1');
    });

    it('deve retornar materiais emprestados ao integrante', () => {
      entregasFantasias = [
        {
          id: 'ent_1',
          materialId: 'mat_1',
          integranteId: 'int_1',
          dataEntrega: new Date().toISOString(),
          responsavelEntrega: 'Admin',
          status: 'entregue',
        },
        {
          id: 'ent_2',
          materialId: 'mat_2',
          integranteId: 'int_2',
          dataEntrega: new Date().toISOString(),
          responsavelEntrega: 'Admin',
          status: 'entregue',
        },
      ];

      const materiaisInt1 = getMateriaisDoIntegrante(
        entregasFantasias,
        materiais,
        'int_1'
      );

      expect(materiaisInt1.length).toBe(1);
      expect(materiaisInt1[0].material.id).toBe('mat_1');
    });

    it('deve retornar lista vazia quando integrante não tem materiais', () => {
      const materiaisInt = getMateriaisDoIntegrante(
        entregasFantasias,
        materiais,
        'int_1'
      );

      expect(materiaisInt.length).toBe(0);
    });
  });

  describe('Cálculo de Dias Emprestado', () => {
    it('deve calcular corretamente dias de empréstimo', () => {
      // Data de 5 dias atrás
      const dataEntrega = new Date();
      dataEntrega.setDate(dataEntrega.getDate() - 5);

      const dias = calcularDiasEmprestado(dataEntrega.toISOString());
      expect(dias).toBe(5);
    });

    it('deve retornar 1 para empréstimo no mesmo dia', () => {
      const dias = calcularDiasEmprestado(new Date().toISOString());
      expect(dias).toBeGreaterThanOrEqual(0);
      expect(dias).toBeLessThanOrEqual(1);
    });
  });

  describe('Fluxo Completo', () => {
    it('deve completar ciclo entrega -> devolução corretamente', () => {
      // 1. Verificar disponibilidade
      expect(verificarMaterialDisponivel(materiais[0])).toBe(true);

      // 2. Verificar que integrante não tem o material
      expect(
        verificarIntegranteJaTemMaterial(entregasFantasias, 'int_1', 'mat_1')
      ).toBe(false);

      // 3. Registrar entrega
      const { entrega, materialAtualizado: materialAposEntrega } = registrarEntrega(
        materiais[0],
        integrantes[0],
        'Admin'
      );
      entregasFantasias.push(entrega);

      expect(materialAposEntrega.quantidadeDisponivel).toBe(4);
      expect(materialAposEntrega.quantidadeEmUso).toBe(1);

      // 4. Verificar que integrante agora tem o material
      expect(
        verificarIntegranteJaTemMaterial(entregasFantasias, 'int_1', 'mat_1')
      ).toBe(true);

      // 5. Verificar pendências
      const pendentes = getEntregasPendentes(entregasFantasias);
      expect(pendentes.length).toBe(1);

      // 6. Registrar devolução
      const { entregaAtualizada, materialAtualizado: materialAposDevolucao } = registrarDevolucao(
        entrega,
        materialAposEntrega,
        'Admin',
        'bom'
      );

      expect(entregaAtualizada.status).toBe('devolvido');
      expect(materialAposDevolucao.quantidadeDisponivel).toBe(5);
      expect(materialAposDevolucao.quantidadeEmUso).toBe(0);

      // 7. Atualizar lista de entregas
      const index = entregasFantasias.findIndex(e => e.id === entrega.id);
      entregasFantasias[index] = entregaAtualizada;

      // 8. Verificar que não há mais pendências
      const pendentesApos = getEntregasPendentes(entregasFantasias);
      expect(pendentesApos.length).toBe(0);

      // 9. Verificar que integrante não tem mais o material
      expect(
        verificarIntegranteJaTemMaterial(entregasFantasias, 'int_1', 'mat_1')
      ).toBe(false);
    });
  });
});
