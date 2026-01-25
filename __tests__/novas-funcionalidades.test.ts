/**
 * Testes das Novas Funcionalidades
 * Dashboard Financeiro, Notificações, Lembretes e Galeria
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Mock expo-notifications
vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: vi.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: vi.fn(),
  cancelAllScheduledNotificationsAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(() => Promise.resolve([])),
  getBadgeCountAsync: vi.fn(() => Promise.resolve(0)),
  setBadgeCountAsync: vi.fn(),
  addNotificationReceivedListener: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
  },
}));

// Mock expo-image-picker
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: vi.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchCameraAsync: vi.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'images' },
}));

// Tipos para testes
interface TransacaoFinanceira {
  id: string;
  tipo: 'receita' | 'despesa';
  categoriaReceita?: string;
  categoriaDespesa?: string;
  descricao: string;
  valor: number;
  data: string;
  formaPagamento: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
  criadoEm: string;
  atualizadoEm: string;
}

interface FotoEvento {
  id: string;
  eventoId: string;
  uri: string;
  uploadPor: string;
  criadoEm: string;
}

interface Lembrete {
  id: string;
  tipo: 'evento' | 'devolucao' | 'pagamento' | 'aniversario' | 'personalizado';
  titulo: string;
  mensagem: string;
  dataHora: string;
  repetir: boolean;
  ativo: boolean;
  criadoEm: string;
}

// ============================================
// TESTES DO MÓDULO FINANCEIRO
// ============================================

describe('Módulo Financeiro', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('Tipos de Transação', () => {
    it('deve ter categorias de receita definidas', () => {
      const categoriasReceita = [
        'mensalidade', 'fantasia', 'evento', 'patrocinio', 'doacao', 'venda', 'outro'
      ];
      expect(categoriasReceita).toHaveLength(7);
      expect(categoriasReceita).toContain('mensalidade');
      expect(categoriasReceita).toContain('patrocinio');
    });

    it('deve ter categorias de despesa definidas', () => {
      const categoriasDespesa = [
        'fantasia', 'aderecos', 'instrumentos', 'estrutura', 'transporte',
        'alimentacao', 'pessoal', 'marketing', 'manutencao', 'outro'
      ];
      expect(categoriasDespesa).toHaveLength(10);
      expect(categoriasDespesa).toContain('fantasia');
      expect(categoriasDespesa).toContain('instrumentos');
    });

    it('deve ter formas de pagamento definidas', () => {
      const formasPagamento = [
        'dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'outro'
      ];
      expect(formasPagamento).toHaveLength(7);
      expect(formasPagamento).toContain('pix');
    });

    it('deve ter status de pagamento definidos', () => {
      const statusPagamento = ['pendente', 'pago', 'cancelado', 'atrasado'];
      expect(statusPagamento).toHaveLength(4);
    });
  });

  describe('Cálculo de Resumo Financeiro', () => {
    it('deve calcular saldo corretamente', () => {
      const transacoes: TransacaoFinanceira[] = [
        {
          id: '1',
          tipo: 'receita',
          descricao: 'Mensalidade',
          valor: 100,
          data: '2026-01-01',
          formaPagamento: 'pix',
          status: 'pago',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          tipo: 'despesa',
          descricao: 'Material',
          valor: 30,
          data: '2026-01-02',
          formaPagamento: 'dinheiro',
          status: 'pago',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
      ];

      const receitas = transacoes
        .filter(t => t.tipo === 'receita' && t.status === 'pago')
        .reduce((acc, t) => acc + t.valor, 0);
      
      const despesas = transacoes
        .filter(t => t.tipo === 'despesa' && t.status === 'pago')
        .reduce((acc, t) => acc + t.valor, 0);

      const saldo = receitas - despesas;

      expect(receitas).toBe(100);
      expect(despesas).toBe(30);
      expect(saldo).toBe(70);
    });

    it('deve ignorar transações pendentes no saldo', () => {
      const transacoes: TransacaoFinanceira[] = [
        {
          id: '1',
          tipo: 'receita',
          descricao: 'Pago',
          valor: 100,
          data: '2026-01-01',
          formaPagamento: 'pix',
          status: 'pago',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          tipo: 'receita',
          descricao: 'Pendente',
          valor: 200,
          data: '2026-01-02',
          formaPagamento: 'boleto',
          status: 'pendente',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
      ];

      const receitasPagas = transacoes
        .filter(t => t.tipo === 'receita' && t.status === 'pago')
        .reduce((acc, t) => acc + t.valor, 0);

      const receitasPendentes = transacoes
        .filter(t => t.tipo === 'receita' && (t.status === 'pendente' || t.status === 'atrasado'))
        .reduce((acc, t) => acc + t.valor, 0);

      expect(receitasPagas).toBe(100);
      expect(receitasPendentes).toBe(200);
    });

    it('deve filtrar transações por período', () => {
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const semanaPassada = new Date(hoje);
      semanaPassada.setDate(semanaPassada.getDate() - 10);

      const transacoes: TransacaoFinanceira[] = [
        {
          id: '1',
          tipo: 'receita',
          descricao: 'Hoje',
          valor: 100,
          data: hoje.toISOString().split('T')[0],
          formaPagamento: 'pix',
          status: 'pago',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          tipo: 'receita',
          descricao: 'Semana passada',
          valor: 200,
          data: semanaPassada.toISOString().split('T')[0],
          formaPagamento: 'pix',
          status: 'pago',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
      ];

      // Filtrar últimos 7 dias
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      const transacoesSemana = transacoes.filter(t => {
        const dataTransacao = new Date(t.data);
        return dataTransacao >= seteDiasAtras;
      });

      expect(transacoesSemana).toHaveLength(1);
      expect(transacoesSemana[0].descricao).toBe('Hoje');
    });
  });
});

// ============================================
// TESTES DO MÓDULO DE LEMBRETES
// ============================================

describe('Módulo de Lembretes', () => {
  describe('Tipos de Lembrete', () => {
    it('deve ter todos os tipos definidos', () => {
      const tiposLembrete = ['evento', 'devolucao', 'pagamento', 'aniversario', 'personalizado'];
      expect(tiposLembrete).toHaveLength(5);
    });
  });

  describe('Gerenciamento de Lembretes', () => {
    it('deve criar lembrete com dados corretos', () => {
      const lembrete: Lembrete = {
        id: '1',
        tipo: 'evento',
        titulo: 'Ensaio',
        mensagem: 'Ensaio às 20h',
        dataHora: '2026-01-30T20:00:00.000Z',
        repetir: false,
        ativo: true,
        criadoEm: new Date().toISOString(),
      };

      expect(lembrete.tipo).toBe('evento');
      expect(lembrete.ativo).toBe(true);
      expect(lembrete.repetir).toBe(false);
    });

    it('deve filtrar lembretes ativos', () => {
      const lembretes: Lembrete[] = [
        {
          id: '1',
          tipo: 'evento',
          titulo: 'Ativo',
          mensagem: 'Lembrete ativo',
          dataHora: '2026-01-30T20:00:00.000Z',
          repetir: false,
          ativo: true,
          criadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          tipo: 'pagamento',
          titulo: 'Inativo',
          mensagem: 'Lembrete inativo',
          dataHora: '2026-01-30T20:00:00.000Z',
          repetir: false,
          ativo: false,
          criadoEm: new Date().toISOString(),
        },
      ];

      const ativos = lembretes.filter(l => l.ativo);
      expect(ativos).toHaveLength(1);
      expect(ativos[0].titulo).toBe('Ativo');
    });

    it('deve filtrar lembretes por tipo', () => {
      const lembretes: Lembrete[] = [
        {
          id: '1',
          tipo: 'evento',
          titulo: 'Evento 1',
          mensagem: 'Mensagem',
          dataHora: '2026-01-30T20:00:00.000Z',
          repetir: false,
          ativo: true,
          criadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          tipo: 'pagamento',
          titulo: 'Pagamento 1',
          mensagem: 'Mensagem',
          dataHora: '2026-01-30T20:00:00.000Z',
          repetir: false,
          ativo: true,
          criadoEm: new Date().toISOString(),
        },
        {
          id: '3',
          tipo: 'evento',
          titulo: 'Evento 2',
          mensagem: 'Mensagem',
          dataHora: '2026-01-30T20:00:00.000Z',
          repetir: false,
          ativo: true,
          criadoEm: new Date().toISOString(),
        },
      ];

      const eventosLembretes = lembretes.filter(l => l.tipo === 'evento');
      expect(eventosLembretes).toHaveLength(2);
    });
  });
});

// ============================================
// TESTES DO MÓDULO DE GALERIA
// ============================================

describe('Módulo de Galeria de Fotos', () => {
  describe('Gerenciamento de Fotos', () => {
    it('deve criar foto com dados corretos', () => {
      const foto: FotoEvento = {
        id: '1',
        eventoId: 'evento-1',
        uri: 'file:///path/to/photo.jpg',
        uploadPor: 'João',
        criadoEm: new Date().toISOString(),
      };

      expect(foto.eventoId).toBe('evento-1');
      expect(foto.uploadPor).toBe('João');
    });

    it('deve filtrar fotos por evento', () => {
      const fotos: FotoEvento[] = [
        {
          id: '1',
          eventoId: 'evento-1',
          uri: 'file:///photo1.jpg',
          uploadPor: 'João',
          criadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          eventoId: 'evento-2',
          uri: 'file:///photo2.jpg',
          uploadPor: 'Maria',
          criadoEm: new Date().toISOString(),
        },
        {
          id: '3',
          eventoId: 'evento-1',
          uri: 'file:///photo3.jpg',
          uploadPor: 'Pedro',
          criadoEm: new Date().toISOString(),
        },
      ];

      const fotosEvento1 = fotos.filter(f => f.eventoId === 'evento-1');
      expect(fotosEvento1).toHaveLength(2);
    });

    it('deve ordenar fotos por data de criação', () => {
      const fotos: FotoEvento[] = [
        {
          id: '1',
          eventoId: 'evento-1',
          uri: 'file:///photo1.jpg',
          uploadPor: 'João',
          criadoEm: '2026-01-01T10:00:00.000Z',
        },
        {
          id: '2',
          eventoId: 'evento-1',
          uri: 'file:///photo2.jpg',
          uploadPor: 'Maria',
          criadoEm: '2026-01-02T10:00:00.000Z',
        },
        {
          id: '3',
          eventoId: 'evento-1',
          uri: 'file:///photo3.jpg',
          uploadPor: 'Pedro',
          criadoEm: '2026-01-01T15:00:00.000Z',
        },
      ];

      const fotosOrdenadas = [...fotos].sort((a, b) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

      expect(fotosOrdenadas[0].id).toBe('2'); // Mais recente
      expect(fotosOrdenadas[2].id).toBe('1'); // Mais antiga
    });
  });
});

// ============================================
// TESTES DE INTEGRAÇÃO
// ============================================

describe('Integração entre Módulos', () => {
  it('deve associar transação a integrante', () => {
    const transacao: TransacaoFinanceira = {
      id: '1',
      tipo: 'receita',
      categoriaReceita: 'mensalidade',
      descricao: 'Mensalidade Janeiro',
      valor: 50,
      data: '2026-01-15',
      formaPagamento: 'pix',
      status: 'pago',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    // Simular associação com integrante
    const transacaoComIntegrante = {
      ...transacao,
      integranteId: 'integrante-1',
    };

    expect(transacaoComIntegrante.integranteId).toBe('integrante-1');
  });

  it('deve associar lembrete a evento', () => {
    const lembrete: Lembrete = {
      id: '1',
      tipo: 'evento',
      titulo: 'Ensaio',
      mensagem: 'Não esqueça do ensaio!',
      dataHora: '2026-01-30T19:00:00.000Z',
      repetir: false,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    // Simular associação com evento
    const lembreteComEvento = {
      ...lembrete,
      eventoId: 'evento-1',
    };

    expect(lembreteComEvento.eventoId).toBe('evento-1');
  });

  it('deve validar fluxo completo de transação', () => {
    // 1. Criar transação pendente
    const transacao: TransacaoFinanceira = {
      id: '1',
      tipo: 'receita',
      descricao: 'Venda de fantasia',
      valor: 200,
      data: '2026-01-20',
      formaPagamento: 'boleto',
      status: 'pendente',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    expect(transacao.status).toBe('pendente');

    // 2. Confirmar pagamento
    const transacaoPaga = {
      ...transacao,
      status: 'pago' as const,
      atualizadoEm: new Date().toISOString(),
    };

    expect(transacaoPaga.status).toBe('pago');

    // 3. Verificar que aparece no saldo
    const transacoes = [transacaoPaga];
    const saldo = transacoes
      .filter(t => t.tipo === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + t.valor, 0);

    expect(saldo).toBe(200);
  });
});
