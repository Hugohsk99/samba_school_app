/**
 * Tipos de dados do aplicativo de gestão de escolas de samba
 */

// Bloco da escola de samba
export interface Bloco {
  id: string;
  nome: string;
  responsavel: string;
  descricao: string;
  cor: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Integrante da escola
export interface Integrante {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  foto?: string;
  blocosIds: string[];
  criadoEm: string;
  atualizadoEm: string;
}

// Ensaio da escola
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

// Registro de presença individual
export interface RegistroPresenca {
  id: string;
  ensaioId: string;
  integranteId: string;
  status: 'presente' | 'ausente' | 'justificado';
  justificativa?: string;
  registradoEm: string;
}

// Material do almoxarifado
export interface Material {
  id: string;
  nome: string;
  categoria: 'fantasias' | 'adereccos' | 'instrumentos' | 'tecidos' | 'outros';
  quantidadeDisponivel: number;
  quantidadeEmUso: number;
  quantidadeNecessaria: number;
  foto?: string;
  blocoId?: string;
  descricao: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Movimentação de material
export interface MovimentacaoMaterial {
  id: string;
  materialId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  responsavel: string;
  observacao: string;
  data: string;
}

// Estado global do aplicativo
export interface AppState {
  blocos: Bloco[];
  integrantes: Integrante[];
  ensaios: Ensaio[];
  registrosPresenca: RegistroPresenca[];
  materiais: Material[];
  movimentacoes: MovimentacaoMaterial[];
}

// Tipos para formulários
export type BlocoFormData = Omit<Bloco, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type IntegranteFormData = Omit<Integrante, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type EnsaioFormData = Omit<Ensaio, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type MaterialFormData = Omit<Material, 'id' | 'criadoEm' | 'atualizadoEm'>;
