/**
 * Tipos de dados do aplicativo de gestão de escolas de samba
 * Baseado no documento de requisitos - Módulos 2, 4 e 5
 */

// ============================================
// TIPOS DE CATEGORIAS DE INTEGRANTES
// ============================================

// Categoria principal do integrante (Módulo 2)
export type CategoriaIntegrante = 'desfilante' | 'segmento' | 'diretoria';

// Subcategorias para Desfilantes
export type TipoDesfilante = 'ala_comercial' | 'ala_comunidade';

// Tipos de Segmentos especializados
export type TipoSegmento = 
  | 'bateria' 
  | 'passistas' 
  | 'baianas' 
  | 'velha_guarda' 
  | 'mestre_sala_porta_bandeira'
  | 'comissao_frente'
  | 'harmonia'
  | 'compositores'
  | 'outro';

// Cargos da Diretoria/Staff
export type CargoDiretoria = 
  | 'presidente'
  | 'vice_presidente'
  | 'diretor_carnaval'
  | 'diretor_harmonia'
  | 'diretor_bateria'
  | 'diretor_comunicacao'
  | 'coordenador'
  | 'staff'
  | 'outro';

// ============================================
// ENTIDADES PRINCIPAIS
// ============================================

// Bloco/Ala da escola de samba
export interface Bloco {
  id: string;
  nome: string;
  responsavel: string;
  descricao: string;
  cor: string;
  tipo: 'ala' | 'segmento';
  criadoEm: string;
  atualizadoEm: string;
}

// Integrante da escola (Módulo 2 - Aprimorado)
export interface Integrante {
  id: string;
  // Dados pessoais básicos
  nome: string;
  telefone: string;
  email: string;
  foto?: string;
  
  // Documentos (opcionais para MVP)
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  
  // Endereço
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  
  // Contato de emergência
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
  
  // Categorização obrigatória (Módulo 2)
  categoria: CategoriaIntegrante;
  
  // Campos específicos por categoria
  tipoDesfilante?: TipoDesfilante; // Se categoria = 'desfilante'
  tipoSegmento?: TipoSegmento;     // Se categoria = 'segmento'
  cargoDiretoria?: CargoDiretoria; // Se categoria = 'diretoria'
  
  // Associações
  blocosIds: string[];
  
  // QR Code único para check-in (Módulo 4)
  qrCodeId: string;
  
  // Histórico
  anoIngresso?: number;
  observacoes?: string;
  
  // Status
  ativo: boolean;
  
  // Timestamps
  criadoEm: string;
  atualizadoEm: string;
}

// Evento da escola (Módulo 4 - Expandido)
export interface Evento {
  id: string;
  titulo: string;
  tipo: 'ensaio' | 'feijoada' | 'reuniao' | 'desfile' | 'outro';
  data: string;
  horario: string;
  local: string;
  descricao: string;
  blocosIds: string[]; // 'todos' ou IDs específicos
  status: 'agendado' | 'em_andamento' | 'realizado' | 'cancelado';
  checkInAberto: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// Ensaio (mantido para compatibilidade)
export interface Ensaio {
  id: string;
  data: string;
  horario: string;
  local: string;
  blocosIds: string[];
  descricao: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  criadoEm: string;
  atualizadoEm: string;
}

// Check-in de presença (Módulo 4 - QR Code)
export interface CheckIn {
  id: string;
  eventoId: string;
  integranteId: string;
  qrCodeId: string;
  horarioCheckIn: string;
  metodo: 'qr_code' | 'manual';
  registradoPor?: string; // ID do staff que fez o check-in manual
}

// Registro de presença individual (mantido para compatibilidade)
export interface RegistroPresenca {
  id: string;
  ensaioId: string;
  integranteId: string;
  status: 'presente' | 'ausente' | 'justificado';
  justificativa?: string;
  registradoEm: string;
}

// ============================================
// MÓDULO 5: GESTÃO DE FANTASIAS/ALMOXARIFADO
// ============================================

// Categorias de materiais expandidas
export type CategoriaMaterial = 
  | 'fantasia'
  | 'aderecos'
  | 'instrumentos'
  | 'tecidos'
  | 'ferramentas'
  | 'decoracao'
  | 'outros';

// Tamanhos de fantasia
export type TamanhoFantasia = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG' | 'especial';

// Estado de conservação
export type EstadoConservacao = 'novo' | 'bom' | 'regular' | 'danificado' | 'inutilizavel';

// Status do material
export type StatusMaterial = 'disponivel' | 'emprestado' | 'em_manutencao' | 'reservado';

// Material do almoxarifado (Módulo 5 - Aprimorado)
export interface Material {
  id: string;
  nome: string;
  categoria: CategoriaMaterial;
  
  // Quantidades
  quantidadeDisponivel: number;
  quantidadeEmUso: number;
  quantidadeNecessaria: number;
  
  // Status atual (para itens únicos como fantasias)
  status?: StatusMaterial;
  integranteAtualId?: string; // Quem está com o item atualmente
  
  // Para fantasias
  tamanho?: TamanhoFantasia;
  alaId?: string; // Associação com ala específica
  
  // Detalhes
  foto?: string;
  blocoId?: string;
  descricao: string;
  localizacao?: string; // Onde está guardado
  
  // Timestamps
  criadoEm: string;
  atualizadoEm: string;
}

// Entrega de fantasia (Módulo 5)
export interface EntregaFantasia {
  id: string;
  materialId: string;
  integranteId: string;
  qrCodeIntegrante: string;
  dataEntrega: string;
  responsavelEntrega: string;
  observacaoEntrega?: string;
  
  // Devolução
  dataDevolucao?: string;
  responsavelDevolucao?: string;
  estadoConservacao?: EstadoConservacao;
  observacaoDevolucao?: string;
  
  status: 'entregue' | 'devolvido' | 'pendente' | 'extraviado';
}

// Tipo de movimentação expandido
export type TipoMovimentacao = 'entrada' | 'saida' | 'emprestimo' | 'devolucao' | 'ajuste' | 'manutencao';

// Movimentação de material (histórico completo)
export interface MovimentacaoMaterial {
  id: string;
  materialId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  responsavel: string;
  observacao: string;
  data: string;
  
  // Para empréstimos/devoluções
  integranteId?: string;
  integranteNome?: string;
  entregaFantasiaId?: string;
  estadoConservacao?: EstadoConservacao;
}

// ============================================
// ESTADO GLOBAL
// ============================================

export interface AppState {
  blocos: Bloco[];
  integrantes: Integrante[];
  ensaios: Ensaio[];
  eventos: Evento[];
  registrosPresenca: RegistroPresenca[];
  checkIns: CheckIn[];
  materiais: Material[];
  entregasFantasias: EntregaFantasia[];
  movimentacoes: MovimentacaoMaterial[];
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

export type BlocoFormData = Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type IntegranteFormData = Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm' | 'qrCodeId'>;
export type EnsaioFormData = Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type EventoFormData = Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type MaterialFormData = Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'>;

// ============================================
// HELPERS E CONSTANTES
// ============================================

export const CATEGORIAS_INTEGRANTE: { value: CategoriaIntegrante; label: string }[] = [
  { value: 'desfilante', label: 'Desfilante' },
  { value: 'segmento', label: 'Segmento' },
  { value: 'diretoria', label: 'Diretoria/Staff' },
];

export const TIPOS_DESFILANTE: { value: TipoDesfilante; label: string }[] = [
  { value: 'ala_comercial', label: 'Ala Comercial' },
  { value: 'ala_comunidade', label: 'Ala da Comunidade' },
];

export const TIPOS_SEGMENTO: { value: TipoSegmento; label: string }[] = [
  { value: 'bateria', label: 'Bateria' },
  { value: 'passistas', label: 'Passistas' },
  { value: 'baianas', label: 'Baianas' },
  { value: 'velha_guarda', label: 'Velha Guarda' },
  { value: 'mestre_sala_porta_bandeira', label: 'Mestre-Sala e Porta-Bandeira' },
  { value: 'comissao_frente', label: 'Comissão de Frente' },
  { value: 'harmonia', label: 'Harmonia' },
  { value: 'compositores', label: 'Compositores' },
  { value: 'outro', label: 'Outro' },
];

export const CARGOS_DIRETORIA: { value: CargoDiretoria; label: string }[] = [
  { value: 'presidente', label: 'Presidente' },
  { value: 'vice_presidente', label: 'Vice-Presidente' },
  { value: 'diretor_carnaval', label: 'Diretor de Carnaval' },
  { value: 'diretor_harmonia', label: 'Diretor de Harmonia' },
  { value: 'diretor_bateria', label: 'Diretor de Bateria' },
  { value: 'diretor_comunicacao', label: 'Diretor de Comunicação' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'staff', label: 'Staff' },
  { value: 'outro', label: 'Outro' },
];

export const CATEGORIAS_MATERIAL: { value: CategoriaMaterial; label: string }[] = [
  { value: 'fantasia', label: 'Fantasia' },
  { value: 'aderecos', label: 'Adereços' },
  { value: 'instrumentos', label: 'Instrumentos' },
  { value: 'tecidos', label: 'Tecidos' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'decoracao', label: 'Decoração' },
  { value: 'outros', label: 'Outros' },
];

export const TAMANHOS_FANTASIA: { value: TamanhoFantasia; label: string }[] = [
  { value: 'PP', label: 'PP' },
  { value: 'P', label: 'P' },
  { value: 'M', label: 'M' },
  { value: 'G', label: 'G' },
  { value: 'GG', label: 'GG' },
  { value: 'XG', label: 'XG' },
  { value: 'especial', label: 'Especial' },
];

export const TIPOS_EVENTO: { value: Evento['tipo']; label: string }[] = [
  { value: 'ensaio', label: 'Ensaio' },
  { value: 'feijoada', label: 'Feijoada' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'desfile', label: 'Desfile' },
  { value: 'outro', label: 'Outro' },
];


// ============================================
// CONFIGURAÇÃO E PERSONALIZAÇÃO DA ESCOLA
// ============================================

// Configuração da escola de samba
export interface EscolaConfig {
  id: string;
  nome: string;
  nomeCompleto?: string;
  logo?: string; // URI da imagem
  
  // Cores personalizadas
  corPrimaria: string;
  corSecundaria: string;
  corAcento?: string;
  
  // Informações adicionais
  fundacao?: string;
  cidade?: string;
  bairro?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  
  // Configurações do app
  onboardingConcluido: boolean;
  primeiroAcesso: boolean;
  
  // Timestamps
  criadoEm: string;
  atualizadoEm: string;
}

// Cores predefinidas para escolas de samba
export const CORES_PREDEFINIDAS = [
  { nome: 'Vermelho Carnaval', cor: '#E53935' },
  { nome: 'Azul Imperial', cor: '#1E88E5' },
  { nome: 'Verde Esperança', cor: '#43A047' },
  { nome: 'Dourado', cor: '#FFB300' },
  { nome: 'Rosa Choque', cor: '#D81B60' },
  { nome: 'Roxo Majestade', cor: '#8E24AA' },
  { nome: 'Laranja Vibrante', cor: '#FF6B35' },
  { nome: 'Branco Puro', cor: '#FAFAFA' },
  { nome: 'Preto Elegante', cor: '#212121' },
  { nome: 'Prata', cor: '#9E9E9E' },
];

// Configuração padrão
export const ESCOLA_CONFIG_PADRAO: Omit<EscolaConfig, 'id' | 'criadoEm' | 'atualizadoEm'> = {
  nome: 'Minha Escola de Samba',
  corPrimaria: '#FF6B35',
  corSecundaria: '#4ECDC4',
  onboardingConcluido: false,
  primeiroAcesso: true,
};

// Slides do onboarding
export interface OnboardingSlide {
  id: number;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    titulo: 'Bem-vindo ao Gestão Samba!',
    descricao: 'O aplicativo completo para gerenciar sua escola de samba de forma simples e organizada.',
    icone: '🎭',
    cor: '#FF6B35',
  },
  {
    id: 2,
    titulo: 'Gerencie seus Blocos',
    descricao: 'Cadastre e organize todos os blocos da escola: Bateria, Passistas, Baianas, Velha Guarda e muito mais.',
    icone: '👥',
    cor: '#4ECDC4',
  },
  {
    id: 3,
    titulo: 'Controle de Integrantes',
    descricao: 'Cadastre integrantes com todos os dados importantes e acompanhe a presença nos ensaios.',
    icone: '📋',
    cor: '#FFE66D',
  },
  {
    id: 4,
    titulo: 'Check-in com QR Code',
    descricao: 'Registre presença de forma rápida e prática usando o QR Code único de cada integrante.',
    icone: '📱',
    cor: '#95E1D3',
  },
  {
    id: 5,
    titulo: 'Almoxarifado Digital',
    descricao: 'Controle fantasias, instrumentos e materiais. Saiba exatamente o que tem disponível.',
    icone: '📦',
    cor: '#AA96DA',
  },
  {
    id: 6,
    titulo: 'Personalize sua Escola',
    descricao: 'Configure o app com a logo e as cores da sua escola de samba. Deixe com a sua cara!',
    icone: '🎨',
    cor: '#F38181',
  },
];


// ============================================
// MÓDULO FINANCEIRO
// ============================================

// Tipo de transação financeira
export type TipoTransacao = 'receita' | 'despesa';

// Categorias de receitas
export type CategoriaReceita = 
  | 'mensalidade'
  | 'fantasia'
  | 'evento'
  | 'patrocinio'
  | 'doacao'
  | 'venda'
  | 'outro';

// Categorias de despesas
export type CategoriaDespesa = 
  | 'fantasia'
  | 'aderecos'
  | 'instrumentos'
  | 'estrutura'
  | 'transporte'
  | 'alimentacao'
  | 'pessoal'
  | 'marketing'
  | 'manutencao'
  | 'outro';

// Status de pagamento
export type StatusPagamento = 'pendente' | 'pago' | 'cancelado' | 'atrasado';

// Forma de pagamento
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto' | 'outro';

// Transação financeira
export interface TransacaoFinanceira {
  id: string;
  tipo: TipoTransacao;
  categoriaReceita?: CategoriaReceita;
  categoriaDespesa?: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
  formaPagamento: FormaPagamento;
  status: StatusPagamento;
  
  // Referências opcionais
  integranteId?: string;
  eventoId?: string;
  blocoId?: string;
  
  // Comprovante
  comprovante?: string;
  
  // Observações
  observacao?: string;
  
  // Timestamps
  criadoEm: string;
  atualizadoEm: string;
}

// Constantes para categorias
export const CATEGORIAS_RECEITA: { value: CategoriaReceita; label: string; emoji: string }[] = [
  { value: 'mensalidade', label: 'Mensalidade', emoji: '💳' },
  { value: 'fantasia', label: 'Venda de Fantasia', emoji: '👗' },
  { value: 'evento', label: 'Evento', emoji: '🎉' },
  { value: 'patrocinio', label: 'Patrocínio', emoji: '🤝' },
  { value: 'doacao', label: 'Doação', emoji: '❤️' },
  { value: 'venda', label: 'Venda', emoji: '🛒' },
  { value: 'outro', label: 'Outro', emoji: '📋' },
];

export const CATEGORIAS_DESPESA: { value: CategoriaDespesa; label: string; emoji: string }[] = [
  { value: 'fantasia', label: 'Fantasia', emoji: '👗' },
  { value: 'aderecos', label: 'Adereços', emoji: '✨' },
  { value: 'instrumentos', label: 'Instrumentos', emoji: '🥁' },
  { value: 'estrutura', label: 'Estrutura/Barracão', emoji: '🏗️' },
  { value: 'transporte', label: 'Transporte', emoji: '🚌' },
  { value: 'alimentacao', label: 'Alimentação', emoji: '🍽️' },
  { value: 'pessoal', label: 'Pessoal/Salários', emoji: '👥' },
  { value: 'marketing', label: 'Marketing', emoji: '📢' },
  { value: 'manutencao', label: 'Manutenção', emoji: '🔧' },
  { value: 'outro', label: 'Outro', emoji: '📋' },
];

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string; emoji: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro', emoji: '💵' },
  { value: 'pix', label: 'PIX', emoji: '📱' },
  { value: 'cartao_credito', label: 'Cartão de Crédito', emoji: '💳' },
  { value: 'cartao_debito', label: 'Cartão de Débito', emoji: '💳' },
  { value: 'transferencia', label: 'Transferência', emoji: '🏦' },
  { value: 'boleto', label: 'Boleto', emoji: '📄' },
  { value: 'outro', label: 'Outro', emoji: '📋' },
];

export const STATUS_PAGAMENTO: { value: StatusPagamento; label: string; cor: string }[] = [
  { value: 'pago', label: 'Pago', cor: '#22C55E' },
  { value: 'pendente', label: 'Pendente', cor: '#F59E0B' },
  { value: 'atrasado', label: 'Atrasado', cor: '#EF4444' },
  { value: 'cancelado', label: 'Cancelado', cor: '#6B7280' },
];

// ============================================
// MÓDULO DE GALERIA DE FOTOS
// ============================================

// Foto de evento
export interface FotoEvento {
  id: string;
  eventoId: string;
  uri: string;
  descricao?: string;
  uploadPor: string;
  criadoEm: string;
}

// ============================================
// MÓDULO DE LEMBRETES/NOTIFICAÇÕES
// ============================================

// Tipo de lembrete
export type TipoLembrete = 'evento' | 'devolucao' | 'pagamento' | 'aniversario' | 'personalizado';

// Lembrete
export interface Lembrete {
  id: string;
  tipo: TipoLembrete;
  titulo: string;
  mensagem: string;
  dataHora: string;
  repetir: boolean;
  intervaloRepeticao?: 'diario' | 'semanal' | 'mensal';
  ativo: boolean;
  
  // Referências
  eventoId?: string;
  integranteId?: string;
  entregaFantasiaId?: string;
  transacaoId?: string;
  
  // Timestamps
  criadoEm: string;
}
