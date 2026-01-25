import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  escolas, 
  InsertEscola,
  convites,
  InsertConvite,
  solicitacoesAcesso,
  InsertSolicitacaoAcesso,
  permissoesCustomizadas,
  InsertPermissaoCustomizada,
  usuarioBlocos,
  InsertUsuarioBloco,
  auditLog,
  InsertAuditLog,
  notificacoes,
  InsertNotificacao,
  TipoNotificacao,
  Role,
  StatusUsuario,
  PERMISSOES_POR_ROLE,
  PermissaoSistema,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USUÁRIOS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "master";
      updateSet.role = "master";
      values.statusUsuario = "aprovado";
      updateSet.statusUsuario = "aprovado";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: Role, aprovadoPor: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ 
    role, 
    aprovadoPor,
    aprovadoEm: new Date(),
    statusUsuario: "aprovado",
  }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: StatusUsuario, aprovadoPor?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<InsertUser> = { statusUsuario: status };
  if (aprovadoPor) {
    updateData.aprovadoPor = aprovadoPor;
    updateData.aprovadoEm = new Date();
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function getUsersByEscola(escolaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.escolaId, escolaId));
}

export async function getUsuariosPendentes(escolaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(
    and(
      eq(users.escolaId, escolaId),
      eq(users.statusUsuario, "pendente")
    )
  );
}

export async function vincularUsuarioEscola(userId: number, escolaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ escolaId }).where(eq(users.id, userId));
}

// ============================================
// ESCOLAS
// ============================================

export async function createEscola(escola: InsertEscola): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(escolas).values(escola);
  return Number(result[0].insertId);
}

export async function getEscolaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(escolas).where(eq(escolas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEscolaBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(escolas).where(eq(escolas.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEscola(id: number, data: Partial<InsertEscola>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(escolas).set(data).where(eq(escolas.id, id));
}

export async function countUsuariosEscola(escolaId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.escolaId, escolaId));
  
  return result[0]?.count ?? 0;
}

export async function listarEscolas() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(escolas).where(eq(escolas.ativo, true));
}

// ============================================
// CONVITES
// ============================================

export async function createConvite(convite: InsertConvite): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(convites).values(convite);
  return Number(result[0].insertId);
}

export async function getConviteByCodigo(codigo: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(convites).where(eq(convites.codigo, codigo)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function usarConvite(codigo: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(convites).set({ usadoPor: userId }).where(eq(convites.codigo, codigo));
}

export async function getConvitesByEscola(escolaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(convites).where(eq(convites.escolaId, escolaId));
}

// ============================================
// SOLICITAÇÕES DE ACESSO
// ============================================

export async function createSolicitacaoAcesso(solicitacao: InsertSolicitacaoAcesso): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(solicitacoesAcesso).values(solicitacao);
  return Number(result[0].insertId);
}

export async function getSolicitacoesPendentes(escolaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(solicitacoesAcesso).where(
    and(
      eq(solicitacoesAcesso.escolaId, escolaId),
      eq(solicitacoesAcesso.status, "pendente")
    )
  );
}

export async function aprovarSolicitacao(id: number, analisadoPor: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(solicitacoesAcesso).set({
    status: "aprovada",
    analisadoPor,
    analisadoEm: new Date(),
  }).where(eq(solicitacoesAcesso.id, id));
}

export async function rejeitarSolicitacao(id: number, analisadoPor: number, motivo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(solicitacoesAcesso).set({
    status: "rejeitada",
    analisadoPor,
    analisadoEm: new Date(),
    motivoRejeicao: motivo,
  }).where(eq(solicitacoesAcesso.id, id));
}

// ============================================
// PERMISSÕES CUSTOMIZADAS
// ============================================

export async function addPermissaoCustomizada(permissao: InsertPermissaoCustomizada) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(permissoesCustomizadas).values(permissao).onDuplicateKeyUpdate({
    set: { valor: permissao.valor },
  });
}

export async function removePermissaoCustomizada(usuarioId: number, permissao: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(permissoesCustomizadas).where(
    and(
      eq(permissoesCustomizadas.usuarioId, usuarioId),
      eq(permissoesCustomizadas.permissao, permissao)
    )
  );
}

export async function getPermissoesCustomizadas(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(permissoesCustomizadas).where(eq(permissoesCustomizadas.usuarioId, usuarioId));
}

// ============================================
// USUÁRIO-BLOCOS
// ============================================

export async function vincularUsuarioBloco(vinculo: InsertUsuarioBloco) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(usuarioBlocos).values(vinculo).onDuplicateKeyUpdate({
    set: { cargo: vinculo.cargo, responsavel: vinculo.responsavel },
  });
}

export async function desvincularUsuarioBloco(usuarioId: number, blocoId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(usuarioBlocos).where(
    and(
      eq(usuarioBlocos.usuarioId, usuarioId),
      eq(usuarioBlocos.blocoId, blocoId)
    )
  );
}

export async function getBlocosDoUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(usuarioBlocos).where(eq(usuarioBlocos.usuarioId, usuarioId));
}

export async function getUsuariosDoBloco(blocoId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(usuarioBlocos).where(eq(usuarioBlocos.blocoId, blocoId));
}

// ============================================
// AUDITORIA
// ============================================

export async function registrarAuditoria(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Cannot log: database not available");
    return;
  }

  try {
    await db.insert(auditLog).values(log);
  } catch (error) {
    console.error("[Audit] Failed to log:", error);
  }
}

// ============================================
// VERIFICAÇÃO DE PERMISSÕES
// ============================================

export function temPermissaoRole(role: Role, permissao: PermissaoSistema): boolean {
  const permissoes = PERMISSOES_POR_ROLE[role];
  return permissoes.includes(permissao);
}

export async function temPermissao(userId: number, permissao: PermissaoSistema): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  // Master tem todas as permissões
  if (user.role === "master") return true;

  // Verifica permissão do role
  if (temPermissaoRole(user.role, permissao)) return true;

  // Verifica permissões customizadas
  const customizadas = await getPermissoesCustomizadas(userId);
  const customizada = customizadas.find(p => p.permissao === permissao);
  
  if (customizada) return customizada.valor;

  return false;
}

export async function verificarLimitePlano(escolaId: number): Promise<{ permitido: boolean; limite: number; atual: number }> {
  const escola = await getEscolaById(escolaId);
  if (!escola) return { permitido: false, limite: 0, atual: 0 };

  const atual = await countUsuariosEscola(escolaId);
  const limite = escola.limiteUsuarios;

  return {
    permitido: atual < limite,
    limite,
    atual,
  };
}

// ============================================
// SEED: USUÁRIO MASTER
// ============================================

export async function seedMasterUser(openId: string, email: string, nome: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verifica se já existe
  const existing = await getUserByOpenId(openId);
  if (existing) {
    console.log("[Seed] Master user already exists");
    return existing;
  }

  // Cria usuário master
  await db.insert(users).values({
    openId,
    email,
    name: nome,
    role: "master",
    statusUsuario: "aprovado",
    loginMethod: "seed",
  });

  console.log("[Seed] Master user created successfully");
  return getUserByOpenId(openId);
}

// ============================================
// NOTIFICAÇÕES INTERNAS
// ============================================

export async function criarNotificacao(notificacao: InsertNotificacao) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notificacao] Cannot create: database not available");
    return;
  }

  try {
    await db.insert(notificacoes).values(notificacao);
  } catch (error) {
    console.error("[Notificacao] Failed to create:", error);
  }
}

export async function getNotificacoesUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(notificacoes)
    .where(eq(notificacoes.usuarioId, usuarioId))
    .orderBy(desc(notificacoes.criadoEm))
    .limit(50);
}

export async function contarNotificacoesNaoLidas(usuarioId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notificacoes)
    .where(and(
      eq(notificacoes.usuarioId, usuarioId),
      eq(notificacoes.lida, false)
    ));

  return result[0]?.count ?? 0;
}

export async function marcarNotificacaoLida(id: number, usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notificacoes)
    .set({ lida: true, lidaEm: new Date() })
    .where(and(
      eq(notificacoes.id, id),
      eq(notificacoes.usuarioId, usuarioId)
    ));
}

export async function marcarTodasNotificacoesLidas(usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notificacoes)
    .set({ lida: true, lidaEm: new Date() })
    .where(and(
      eq(notificacoes.usuarioId, usuarioId),
      eq(notificacoes.lida, false)
    ));
}

export async function excluirNotificacao(id: number, usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(notificacoes)
    .where(and(
      eq(notificacoes.id, id),
      eq(notificacoes.usuarioId, usuarioId)
    ));
}

// Notificar gestores sobre nova solicitação de acesso
export async function notificarSolicitacaoAcesso(escolaId: number, solicitanteNome: string) {
  const db = await getDb();
  if (!db) return;

  // Buscar gestores da escola (presidente e diretores)
  const gestores = await db.select()
    .from(users)
    .where(and(
      eq(users.escolaId, escolaId),
      sql`${users.role} IN ('master', 'presidente', 'diretor')`,
      eq(users.statusUsuario, "aprovado")
    ));

  // Criar notificação para cada gestor
  for (const gestor of gestores) {
    await criarNotificacao({
      usuarioId: gestor.id,
      escolaId,
      tipo: "solicitacao_acesso",
      titulo: "Nova solicitação de acesso",
      mensagem: `${solicitanteNome} solicitou acesso à escola. Acesse a gestão de usuários para aprovar ou rejeitar.`,
      acaoUrl: "/gestao-usuarios",
      acaoTexto: "Ver solicitações",
    });
  }
}

// Notificar usuário sobre aprovação
export async function notificarUsuarioAprovado(usuarioId: number, escolaNome: string) {
  await criarNotificacao({
    usuarioId,
    tipo: "usuario_aprovado",
    titulo: "Acesso aprovado!",
    mensagem: `Seu acesso à ${escolaNome} foi aprovado. Bem-vindo(a)!`,
    acaoUrl: "/",
    acaoTexto: "Acessar",
  });
}

// Notificar usuário sobre rejeição
export async function notificarUsuarioRejeitado(usuarioId: number, escolaNome: string, motivo?: string) {
  await criarNotificacao({
    usuarioId,
    tipo: "usuario_rejeitado",
    titulo: "Solicitação não aprovada",
    mensagem: motivo 
      ? `Sua solicitação de acesso à ${escolaNome} não foi aprovada. Motivo: ${motivo}`
      : `Sua solicitação de acesso à ${escolaNome} não foi aprovada.`,
  });
}

// ============================================
// DASHBOARD / MÉTRICAS
// ============================================

export async function getMetricasEscola(escolaId: number) {
  const db = await getDb();
  if (!db) return null;

  // Contar usuários por status
  const usuariosResult = await db.select({
    total: sql<number>`count(*)`,
    aprovados: sql<number>`sum(case when ${users.statusUsuario} = 'aprovado' then 1 else 0 end)`,
    pendentes: sql<number>`sum(case when ${users.statusUsuario} = 'pendente' then 1 else 0 end)`,
  }).from(users).where(eq(users.escolaId, escolaId));

  // Buscar escola para info do plano
  const escola = await getEscolaById(escolaId);

  // Contar por role
  const porRole = await db.select({
    role: users.role,
    count: sql<number>`count(*)`,
  })
    .from(users)
    .where(and(
      eq(users.escolaId, escolaId),
      eq(users.statusUsuario, "aprovado")
    ))
    .groupBy(users.role);

  // Solicitações pendentes
  const solicitacoesPendentes = await db.select({ count: sql<number>`count(*)` })
    .from(solicitacoesAcesso)
    .where(and(
      eq(solicitacoesAcesso.escolaId, escolaId),
      eq(solicitacoesAcesso.status, "pendente")
    ));

  // Convites ativos
  const convitesAtivos = await db.select({ count: sql<number>`count(*)` })
    .from(convites)
    .where(and(
      eq(convites.escolaId, escolaId),
      sql`${convites.usadoPor} IS NULL`,
      sql`${convites.expiraEm} > NOW()`
    ));

  return {
    usuarios: {
      total: usuariosResult[0]?.total ?? 0,
      aprovados: usuariosResult[0]?.aprovados ?? 0,
      pendentes: usuariosResult[0]?.pendentes ?? 0,
    },
    porRole: porRole.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>),
    solicitacoesPendentes: solicitacoesPendentes[0]?.count ?? 0,
    convitesAtivos: convitesAtivos[0]?.count ?? 0,
    plano: escola?.plano ?? "gratuito",
    limiteUsuarios: escola?.limiteUsuarios ?? 50,
    planoExpiraEm: escola?.planoExpiraEm,
  };
}

export async function getAlertasSistema(escolaId: number) {
  const alertas: Array<{
    tipo: string;
    titulo: string;
    mensagem: string;
    cor: string;
    acaoUrl?: string;
  }> = [];

  const db = await getDb();
  if (!db) return alertas;

  // Verificar limite de usuários
  const escola = await getEscolaById(escolaId);
  if (escola) {
    const totalUsuarios = await countUsuariosEscola(escolaId);
    const percentual = (totalUsuarios / escola.limiteUsuarios) * 100;

    if (percentual >= 90) {
      alertas.push({
        tipo: "limite_usuarios",
        titulo: "Limite de usuários",
        mensagem: `Você está usando ${totalUsuarios} de ${escola.limiteUsuarios} usuários (${Math.round(percentual)}%)`,
        cor: percentual >= 100 ? "#EF4444" : "#F59E0B",
        acaoUrl: "/configuracoes",
      });
    }

    // Verificar expiração do plano
    if (escola.planoExpiraEm) {
      const diasRestantes = Math.ceil((escola.planoExpiraEm.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 30 && diasRestantes > 0) {
        alertas.push({
          tipo: "plano_expirando",
          titulo: "Plano expirando",
          mensagem: `Seu plano ${escola.plano} expira em ${diasRestantes} dias`,
          cor: diasRestantes <= 7 ? "#EF4444" : "#F59E0B",
          acaoUrl: "/configuracoes",
        });
      }
    }
  }

  // Verificar solicitações pendentes
  const pendentes = await db.select({ count: sql<number>`count(*)` })
    .from(solicitacoesAcesso)
    .where(and(
      eq(solicitacoesAcesso.escolaId, escolaId),
      eq(solicitacoesAcesso.status, "pendente")
    ));

  if ((pendentes[0]?.count ?? 0) > 0) {
    alertas.push({
      tipo: "solicitacoes_pendentes",
      titulo: "Solicitações pendentes",
      mensagem: `${pendentes[0]?.count} usuário(s) aguardando aprovação`,
      cor: "#3B82F6",
      acaoUrl: "/gestao-usuarios",
    });
  }

  // Verificar convites expirando
  const convitesExpirando = await db.select({ count: sql<number>`count(*)` })
    .from(convites)
    .where(and(
      eq(convites.escolaId, escolaId),
      sql`${convites.usadoPor} IS NULL`,
      sql`${convites.expiraEm} > NOW()`,
      sql`${convites.expiraEm} < DATE_ADD(NOW(), INTERVAL 3 DAY)`
    ));

  if ((convitesExpirando[0]?.count ?? 0) > 0) {
    alertas.push({
      tipo: "convites_expirando",
      titulo: "Convites expirando",
      mensagem: `${convitesExpirando[0]?.count} convite(s) expiram em breve`,
      cor: "#F59E0B",
      acaoUrl: "/convites",
    });
  }

  return alertas;
}

export async function getAtividadeRecente(escolaId: number, limite: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(auditLog)
    .where(eq(auditLog.escolaId, escolaId))
    .orderBy(desc(auditLog.criadoEm))
    .limit(limite);
}
