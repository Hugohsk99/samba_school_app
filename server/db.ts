import { eq, and, sql } from "drizzle-orm";
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
