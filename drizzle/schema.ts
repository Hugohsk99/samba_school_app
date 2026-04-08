import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ============================================
// ENUMS
// ============================================

// Roles do sistema - 7 níveis conforme documento "100 Anos"
export const roleEnum = mysqlEnum("role", [
  "master",             // 1. Acesso total global (100 Anos Gestão de Samba)
  "diretor_escola",     // 2. Máximo dentro da escola
  "diretor_carnaval",   // 3. Operacional avançado na escola
  "diretor_ala",        // 4. Restrito à ala
  "diretor_segmento",   // 5. Restrito ao segmento
  "integrante",         // 6. Membro aprovado (leitura)
  "pendente"            // 7. Aguardando aprovação
]);

// Status do usuário
export const statusUsuarioEnum = mysqlEnum("status_usuario", [
  "pendente",   // Aguardando aprovação
  "aprovado",   // Acesso liberado
  "rejeitado",  // Acesso negado
  "suspenso"    // Temporariamente bloqueado
]);

// Planos disponíveis
export const planoEnum = mysqlEnum("plano", [
  "gratuito",   // Até 50 usuários, funcionalidades básicas
  "basico",     // Até 200 usuários, relatórios
  "premium",    // Usuários ilimitados, todas funcionalidades
  "enterprise"  // Customização, suporte dedicado
]);

// ============================================
// TABELA: ESCOLAS
// ============================================

export const escolas = mysqlTable("escolas", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  nome: varchar("nome", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  
  // Personalização visual
  logoUrl: text("logo_url"),
  corPrimaria: varchar("cor_primaria", { length: 7 }).default("#FF6B35"),
  corSecundaria: varchar("cor_secundaria", { length: 7 }).default("#1A1A1A"),
  
  // Plano/Assinatura
  plano: planoEnum.default("gratuito").notNull(),
  planoExpiraEm: timestamp("plano_expira_em"),
  limiteUsuarios: int("limite_usuarios").default(50).notNull(),
  
  // Dados de contato
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  
  // Metadados
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
  ativo: boolean("ativo").default(true).notNull(),
});

export type Escola = typeof escolas.$inferSelect;
export type InsertEscola = typeof escolas.$inferInsert;

// ============================================
// TABELA: USUÁRIOS
// ============================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  
  // Autenticação por CPF + Senha
  cpf: varchar("cpf", { length: 14 }),
  senhaHash: varchar("senha_hash", { length: 255 }),
  
  // OAuth (Manus) - mantido para compatibilidade
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  
  // Preparação para OAuth adicional (futuro)
  googleId: varchar("google_id", { length: 128 }),
  appleId: varchar("apple_id", { length: 128 }),
  
  // Dados pessoais
  telefone: varchar("telefone", { length: 20 }),
  fotoUrl: text("foto_url"),
  
  // Vinculação com escola
  escolaId: int("escola_id"),
  
  // Role e permissões (7 níveis)
  role: roleEnum.default("pendente").notNull(),
  
  // Vinculação com ala/segmento
  alaId: varchar("ala_id", { length: 36 }),
  segmentoId: varchar("segmento_id", { length: 36 }),
  
  // Status de aprovação
  statusUsuario: statusUsuarioEnum.default("pendente").notNull(),
  aprovadoPor: int("aprovado_por"),
  aprovadoEm: timestamp("aprovado_em"),
  
  // Comprovante PIX
  comprovantePix: text("comprovante_pix"),
  
  // Vinculação com dados de integrante (AsyncStorage)
  integranteId: varchar("integrante_id", { length: 36 }),
  
  // Metadados
  criadoEm: timestamp("createdAt").defaultNow().notNull(),
  atualizadoEm: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// TABELA: PERMISSÕES CUSTOMIZADAS
// ============================================

export const permissoesCustomizadas = mysqlTable("permissoes_customizadas", {
  id: int("id").autoincrement().primaryKey(),
  
  usuarioId: int("usuario_id").notNull(),
  permissao: varchar("permissao", { length: 100 }).notNull(),
  valor: boolean("valor").default(true).notNull(),
  concedidoPor: int("concedido_por").notNull(),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
}, (table) => ({
  uniquePermissao: uniqueIndex("unique_usuario_permissao").on(table.usuarioId, table.permissao),
}));

export type PermissaoCustomizada = typeof permissoesCustomizadas.$inferSelect;
export type InsertPermissaoCustomizada = typeof permissoesCustomizadas.$inferInsert;

// ============================================
// TABELA: USUÁRIO-BLOCOS (N:N)
// ============================================

export const usuarioBlocos = mysqlTable("usuario_blocos", {
  id: int("id").autoincrement().primaryKey(),
  
  usuarioId: int("usuario_id").notNull(),
  blocoId: varchar("bloco_id", { length: 36 }).notNull(),
  cargo: varchar("cargo", { length: 100 }),
  responsavel: boolean("responsavel").default(false).notNull(),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
}, (table) => ({
  uniqueUsuarioBloco: uniqueIndex("unique_usuario_bloco").on(table.usuarioId, table.blocoId),
}));

export type UsuarioBloco = typeof usuarioBlocos.$inferSelect;
export type InsertUsuarioBloco = typeof usuarioBlocos.$inferInsert;

// ============================================
// TABELA: CONVITES
// ============================================

export const convites = mysqlTable("convites", {
  id: int("id").autoincrement().primaryKey(),
  
  escolaId: int("escola_id").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: roleEnum.default("integrante").notNull(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  
  criadoPor: int("criado_por").notNull(),
  usadoPor: int("usado_por"),
  
  expiraEm: timestamp("expira_em").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type Convite = typeof convites.$inferSelect;
export type InsertConvite = typeof convites.$inferInsert;

// ============================================
// TABELA: SOLICITAÇÕES DE ACESSO
// ============================================

export const solicitacoesAcesso = mysqlTable("solicitacoes_acesso", {
  id: int("id").autoincrement().primaryKey(),
  
  usuarioId: int("usuario_id").notNull(),
  escolaId: int("escola_id").notNull(),
  mensagem: text("mensagem"),
  
  // Comprovante PIX
  comprovantePix: text("comprovante_pix"),
  alaPretendida: varchar("ala_pretendida", { length: 100 }),
  segmentoPretendido: varchar("segmento_pretendido", { length: 100 }),
  
  status: mysqlEnum("status", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),
  analisadoPor: int("analisado_por"),
  analisadoEm: timestamp("analisado_em"),
  motivoRejeicao: text("motivo_rejeicao"),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type SolicitacaoAcesso = typeof solicitacoesAcesso.$inferSelect;
export type InsertSolicitacaoAcesso = typeof solicitacoesAcesso.$inferInsert;

// ============================================
// TABELA: LOG DE AUDITORIA
// ============================================

export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  
  usuarioId: int("usuario_id").notNull(),
  escolaId: int("escola_id"),
  acao: varchar("acao", { length: 100 }).notNull(),
  entidade: varchar("entidade", { length: 100 }).notNull(),
  entidadeId: varchar("entidade_id", { length: 100 }),
  detalhes: text("detalhes"),
  
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ============================================
// TIPOS AUXILIARES
// ============================================

// Roles disponíveis - 7 níveis
export type Role = "master" | "diretor_escola" | "diretor_carnaval" | "diretor_ala" | "diretor_segmento" | "integrante" | "pendente";

// Status do usuário
export type StatusUsuario = "pendente" | "aprovado" | "rejeitado" | "suspenso";

// Planos
export type Plano = "gratuito" | "basico" | "premium" | "enterprise";

// Hierarquia de roles (do mais alto ao mais baixo)
export const HIERARQUIA_ROLES: Role[] = [
  "master",
  "diretor_escola",
  "diretor_carnaval",
  "diretor_ala",
  "diretor_segmento",
  "integrante",
  "pendente",
];

// Nomes amigáveis dos roles
export const NOMES_ROLES: Record<Role, string> = {
  master: "Master (100 Anos)",
  diretor_escola: "Diretor de Escola",
  diretor_carnaval: "Diretor de Carnaval",
  diretor_ala: "Diretor de Ala",
  diretor_segmento: "Diretor de Segmento",
  integrante: "Integrante",
  pendente: "Pendente",
};

// Lista de permissões do sistema
export const PERMISSOES_SISTEMA = [
  // Escola
  "escola.editar",
  "escola.gerenciar_plano",
  "escola.aprovar_usuarios",
  
  // Usuários
  "usuarios.ver_todos",
  "usuarios.cadastrar",
  "usuarios.editar",
  "usuarios.excluir",
  "usuarios.alterar_role",
  
  // Blocos/Alas
  "blocos.ver_todos",
  "blocos.cadastrar",
  "blocos.editar",
  "blocos.excluir",
  
  // Eventos
  "eventos.ver_todos",
  "eventos.cadastrar",
  "eventos.editar",
  "eventos.excluir",
  "eventos.checkin",
  
  // Almoxarifado
  "almoxarifado.ver",
  "almoxarifado.cadastrar",
  "almoxarifado.editar",
  "almoxarifado.excluir",
  "almoxarifado.entregar_devolver",
  
  // Financeiro
  "financeiro.ver",
  "financeiro.cadastrar",
  "financeiro.editar",
  "financeiro.excluir",
  "financeiro.relatorios",
  
  // Relatórios
  "relatorios.presenca",
  "relatorios.financeiro",
  "relatorios.geral",
  
  // Configurações
  "configuracoes.acessar",
  "configuracoes.gestao_dados",
] as const;

export type PermissaoSistema = typeof PERMISSOES_SISTEMA[number];

// Mapeamento de permissões por role (7 níveis)
export const PERMISSOES_POR_ROLE: Record<Role, PermissaoSistema[]> = {
  master: [...PERMISSOES_SISTEMA], // Todas as permissões
  
  diretor_escola: [
    "escola.editar",
    "escola.gerenciar_plano",
    "escola.aprovar_usuarios",
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "usuarios.editar",
    "usuarios.excluir",
    "usuarios.alterar_role",
    "blocos.ver_todos",
    "blocos.cadastrar",
    "blocos.editar",
    "blocos.excluir",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.excluir",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.cadastrar",
    "almoxarifado.editar",
    "almoxarifado.excluir",
    "almoxarifado.entregar_devolver",
    "financeiro.ver",
    "financeiro.cadastrar",
    "financeiro.editar",
    "financeiro.excluir",
    "financeiro.relatorios",
    "relatorios.presenca",
    "relatorios.financeiro",
    "relatorios.geral",
    "configuracoes.acessar",
    "configuracoes.gestao_dados",
  ],
  
  diretor_carnaval: [
    "escola.aprovar_usuarios",
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "usuarios.editar",
    "usuarios.alterar_role",
    "blocos.ver_todos",
    "blocos.cadastrar",
    "blocos.editar",
    "blocos.excluir",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.excluir",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.cadastrar",
    "almoxarifado.editar",
    "almoxarifado.excluir",
    "almoxarifado.entregar_devolver",
    "financeiro.ver",
    "financeiro.cadastrar",
    "financeiro.editar",
    "relatorios.presenca",
    "relatorios.financeiro",
    "relatorios.geral",
  ],
  
  diretor_ala: [
    "escola.aprovar_usuarios",
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "usuarios.editar",
    "blocos.ver_todos",
    "blocos.editar",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.cadastrar",
    "almoxarifado.editar",
    "almoxarifado.entregar_devolver",
    "relatorios.presenca",
  ],
  
  diretor_segmento: [
    "usuarios.ver_todos",
    "usuarios.cadastrar",
    "blocos.ver_todos",
    "eventos.ver_todos",
    "eventos.cadastrar",
    "eventos.editar",
    "eventos.checkin",
    "almoxarifado.ver",
    "almoxarifado.entregar_devolver",
    "relatorios.presenca",
  ],
  
  integrante: [
    "blocos.ver_todos",
    "eventos.ver_todos",
  ],
  
  pendente: [],
};

// Limites por plano
export const LIMITES_POR_PLANO: Record<Plano, { usuarios: number; funcionalidades: string[] }> = {
  gratuito: {
    usuarios: 50,
    funcionalidades: ["basico"],
  },
  basico: {
    usuarios: 200,
    funcionalidades: ["basico", "relatorios"],
  },
  premium: {
    usuarios: -1,
    funcionalidades: ["basico", "relatorios", "financeiro", "notificacoes", "galeria"],
  },
  enterprise: {
    usuarios: -1,
    funcionalidades: ["*"],
  },
};

// ============================================
// TABELA: NOTIFICAÇÕES INTERNAS
// ============================================

export const tipoNotificacaoEnum = mysqlEnum("tipo_notificacao", [
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
]);

export const notificacoes = mysqlTable("notificacoes", {
  id: int("id").autoincrement().primaryKey(),
  
  usuarioId: int("usuario_id").notNull(),
  escolaId: int("escola_id"),
  
  tipo: tipoNotificacaoEnum.notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  
  dados: text("dados"),
  
  acaoUrl: varchar("acao_url", { length: 255 }),
  acaoTexto: varchar("acao_texto", { length: 100 }),
  
  lida: boolean("lida").default(false).notNull(),
  lidaEm: timestamp("lida_em"),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  expiraEm: timestamp("expira_em"),
});

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
export type TipoNotificacao = "solicitacao_acesso" | "usuario_aprovado" | "usuario_rejeitado" | 
  "convite_enviado" | "convite_aceito" | "convite_expirando" | "material_pendente" | 
  "evento_proximo" | "evento_criado" | "alerta_sistema" | "limite_usuarios" | "plano_expirando";

// Função auxiliar para verificar permissão
export function temPermissaoRole(role: Role, permissao: PermissaoSistema): boolean {
  return PERMISSOES_POR_ROLE[role]?.includes(permissao) ?? false;
}

// Verificar se um role pode aprovar outro
export function podeAprovarRole(roleAprovador: Role, roleAlvo: Role): boolean {
  const hierarquiaAprovador = HIERARQUIA_ROLES.indexOf(roleAprovador);
  const hierarquiaAlvo = HIERARQUIA_ROLES.indexOf(roleAlvo);
  // Só pode aprovar roles abaixo na hierarquia
  return hierarquiaAprovador < hierarquiaAlvo;
}
