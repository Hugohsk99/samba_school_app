import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { Role, PermissaoSistema, PERMISSOES_POR_ROLE } from "../drizzle/schema";
import crypto from "crypto";

// Gerar código único para convites
function gerarCodigoConvite(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Gerar slug a partir do nome
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

export const appRouter = router({
  system: systemRouter,
  
  // ============================================
  // AUTENTICAÇÃO
  // ============================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Obter perfil completo com escola
    perfil: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      let escola = null;
      
      if (user.escolaId) {
        escola = await db.getEscolaById(user.escolaId);
      }

      const permissoes = PERMISSOES_POR_ROLE[user.role];
      const permissoesCustomizadas = await db.getPermissoesCustomizadas(user.id);
      const blocos = await db.getBlocosDoUsuario(user.id);

      return {
        user,
        escola,
        permissoes,
        permissoesCustomizadas,
        blocos,
      };
    }),

    // Verificar se tem permissão específica
    temPermissao: protectedProcedure
      .input(z.object({ permissao: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.temPermissao(ctx.user.id, input.permissao as PermissaoSistema);
      }),
  }),

  // ============================================
  // ESCOLAS
  // ============================================
  escolas: router({
    // Criar nova escola (primeiro acesso do presidente)
    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(3).max(255),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verifica se usuário já tem escola
        if (ctx.user.escolaId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Você já está vinculado a uma escola",
          });
        }

        // Gera slug único
        let slug = gerarSlug(input.nome);
        let slugExistente = await db.getEscolaBySlug(slug);
        let contador = 1;
        while (slugExistente) {
          slug = `${gerarSlug(input.nome)}-${contador}`;
          slugExistente = await db.getEscolaBySlug(slug);
          contador++;
        }

        // Cria escola
        const escolaId = await db.createEscola({
          nome: input.nome,
          slug,
          email: input.email,
          telefone: input.telefone,
          cidade: input.cidade,
          estado: input.estado,
        });

        // Atualiza usuário como presidente da escola
        await db.updateUserRole(ctx.user.id, "presidente", ctx.user.id);
        await db.vincularUsuarioEscola(ctx.user.id, escolaId);

        // Registra auditoria
        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId,
          acao: "criar",
          entidade: "escola",
          entidadeId: String(escolaId),
          detalhes: JSON.stringify({ nome: input.nome }),
        });

        return { escolaId, slug };
      }),

    // Obter escola atual
    atual: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return null;
      return db.getEscolaById(ctx.user.escolaId);
    }),

    // Atualizar escola
    atualizar: protectedProcedure
      .input(z.object({
        nome: z.string().min(3).max(255).optional(),
        logoUrl: z.string().optional(),
        corPrimaria: z.string().max(7).optional(),
        corSecundaria: z.string().max(7).optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.escolaId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não vinculado a escola" });
        }

        const temPermissao = await db.temPermissao(ctx.user.id, "escola.editar");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para editar escola" });
        }

        await db.updateEscola(ctx.user.escolaId, input);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId,
          acao: "atualizar",
          entidade: "escola",
          entidadeId: String(ctx.user.escolaId),
          detalhes: JSON.stringify(input),
        });

        return { success: true };
      }),

    // Listar escolas (para busca)
    listar: publicProcedure.query(async () => {
      return db.listarEscolas();
    }),

    // Buscar por slug
    porSlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getEscolaBySlug(input.slug);
      }),
  }),

  // ============================================
  // USUÁRIOS
  // ============================================
  usuarios: router({
    // Listar usuários da escola
    listar: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const temPermissao = await db.temPermissao(ctx.user.id, "usuarios.ver_todos");
      if (!temPermissao) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
      }

      return db.getUsersByEscola(ctx.user.escolaId);
    }),

    // Listar pendentes de aprovação
    pendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
      if (!temPermissao) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
      }

      return db.getUsuariosPendentes(ctx.user.escolaId);
    }),

    // Aprovar usuário
    aprovar: protectedProcedure
      .input(z.object({
        usuarioId: z.number(),
        role: z.enum(["diretor", "coordenador", "integrante", "contribuinte"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        // Verificar hierarquia de aprovação
        const roleHierarquia: Record<string, number> = {
          master: 5,
          presidente: 4,
          diretor: 3,
          coordenador: 2,
          integrante: 1,
          contribuinte: 0,
        };

        const meuNivel = roleHierarquia[ctx.user.role] ?? 0;
        const nivelAlvo = roleHierarquia[input.role] ?? 0;

        // Só pode aprovar para níveis inferiores ao seu
        if (nivelAlvo >= meuNivel && ctx.user.role !== "master") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Você não pode aprovar usuários como ${input.role}` 
          });
        }

        await db.updateUserRole(input.usuarioId, input.role, ctx.user.id);

        // Notificar usuário aprovado
        const escola = ctx.user.escolaId ? await db.getEscolaById(ctx.user.escolaId) : null;
        if (escola) {
          await db.notificarUsuarioAprovado(input.usuarioId, escola.nome);
        }

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "aprovar",
          entidade: "usuario",
          entidadeId: String(input.usuarioId),
          detalhes: JSON.stringify({ role: input.role }),
        });

        return { success: true };
      }),

    // Rejeitar usuário
    rejeitar: protectedProcedure
      .input(z.object({ 
        usuarioId: z.number(),
        motivo: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        await db.updateUserStatus(input.usuarioId, "rejeitado", ctx.user.id);

        // Notificar usuário rejeitado
        const escola = ctx.user.escolaId ? await db.getEscolaById(ctx.user.escolaId) : null;
        if (escola) {
          await db.notificarUsuarioRejeitado(input.usuarioId, escola.nome, input.motivo);
        }

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "rejeitar",
          entidade: "usuario",
          entidadeId: String(input.usuarioId),
          detalhes: input.motivo ? JSON.stringify({ motivo: input.motivo }) : undefined,
        });

        return { success: true };
      }),

    // Alterar role de usuário
    alterarRole: protectedProcedure
      .input(z.object({
        usuarioId: z.number(),
        role: z.enum(["presidente", "diretor", "coordenador", "integrante", "contribuinte"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "usuarios.alterar_role");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        // Não pode alterar próprio role
        if (input.usuarioId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não pode alterar próprio role" });
        }

        // Não pode promover a presidente se não for presidente/master
        if (input.role === "presidente" && ctx.user.role !== "master" && ctx.user.role !== "presidente") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas presidente pode promover outro presidente" });
        }

        await db.updateUserRole(input.usuarioId, input.role, ctx.user.id);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "alterar_role",
          entidade: "usuario",
          entidadeId: String(input.usuarioId),
          detalhes: JSON.stringify({ novoRole: input.role }),
        });

        return { success: true };
      }),

    // Suspender usuário
    suspender: protectedProcedure
      .input(z.object({ usuarioId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "usuarios.editar");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        await db.updateUserStatus(input.usuarioId, "suspenso", ctx.user.id);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "suspender",
          entidade: "usuario",
          entidadeId: String(input.usuarioId),
        });

        return { success: true };
      }),
  }),

  // ============================================
  // CONVITES
  // ============================================
  convites: router({
    // Criar convite
    criar: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(["diretor", "coordenador", "integrante", "contribuinte"]),
        diasValidade: z.number().min(1).max(30).default(7),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.escolaId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não vinculado a escola" });
        }

        const temPermissao = await db.temPermissao(ctx.user.id, "usuarios.cadastrar");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        // Verifica limite do plano
        const limite = await db.verificarLimitePlano(ctx.user.escolaId);
        if (!limite.permitido) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Limite de ${limite.limite} usuários atingido. Faça upgrade do plano.`,
          });
        }

        const codigo = gerarCodigoConvite();
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + input.diasValidade);

        await db.createConvite({
          escolaId: ctx.user.escolaId,
          email: input.email,
          role: input.role,
          codigo,
          criadoPor: ctx.user.id,
          expiraEm,
        });

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId,
          acao: "criar",
          entidade: "convite",
          detalhes: JSON.stringify({ email: input.email, role: input.role }),
        });

        return { codigo, expiraEm };
      }),

    // Usar convite
    usar: protectedProcedure
      .input(z.object({ codigo: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const convite = await db.getConviteByCodigo(input.codigo);
        
        if (!convite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        }

        if (convite.usadoPor) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite já utilizado" });
        }

        if (new Date() > convite.expiraEm) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite expirado" });
        }

        // Vincula usuário à escola com o role do convite
        await db.vincularUsuarioEscola(ctx.user.id, convite.escolaId);
        await db.updateUserRole(ctx.user.id, convite.role, convite.criadoPor);
        await db.usarConvite(input.codigo, ctx.user.id);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: convite.escolaId,
          acao: "usar",
          entidade: "convite",
          entidadeId: String(convite.id),
        });

        return { success: true, escolaId: convite.escolaId };
      }),

    // Listar convites da escola
    listar: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];
      return db.getConvitesByEscola(ctx.user.escolaId);
    }),
  }),

  // ============================================
  // SOLICITAÇÕES DE ACESSO
  // ============================================
  solicitacoes: router({
    // Solicitar acesso a uma escola
    criar: protectedProcedure
      .input(z.object({
        escolaId: z.number(),
        mensagem: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.escolaId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você já está vinculado a uma escola" });
        }

        await db.createSolicitacaoAcesso({
          usuarioId: ctx.user.id,
          escolaId: input.escolaId,
          mensagem: input.mensagem,
        });

        // Notificar gestores da escola sobre nova solicitação
        await db.notificarSolicitacaoAcesso(
          input.escolaId, 
          ctx.user.name || ctx.user.email || "Novo usuário"
        );

        return { success: true };
      }),

    // Listar solicitações pendentes
    pendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
      if (!temPermissao) return [];

      return db.getSolicitacoesPendentes(ctx.user.escolaId);
    }),

    // Aprovar solicitação
    aprovar: protectedProcedure
      .input(z.object({
        solicitacaoId: z.number(),
        role: z.enum(["diretor", "coordenador", "integrante", "contribuinte"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        // Busca solicitação para obter usuarioId
        const solicitacoes = await db.getSolicitacoesPendentes(ctx.user.escolaId!);
        const solicitacao = solicitacoes.find(s => s.id === input.solicitacaoId);
        
        if (!solicitacao) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
        }

        await db.aprovarSolicitacao(input.solicitacaoId, ctx.user.id);
        await db.vincularUsuarioEscola(solicitacao.usuarioId, ctx.user.escolaId!);
        await db.updateUserRole(solicitacao.usuarioId, input.role, ctx.user.id);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "aprovar",
          entidade: "solicitacao",
          entidadeId: String(input.solicitacaoId),
        });

        return { success: true };
      }),

    // Rejeitar solicitação
    rejeitar: protectedProcedure
      .input(z.object({
        solicitacaoId: z.number(),
        motivo: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        await db.rejeitarSolicitacao(input.solicitacaoId, ctx.user.id, input.motivo ?? "");

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "rejeitar",
          entidade: "solicitacao",
          entidadeId: String(input.solicitacaoId),
        });

        return { success: true };
      }),
  }),

  // ============================================
  // PERMISSÕES
  // ============================================
  permissoes: router({
    // Listar permissões do usuário atual
    minhas: protectedProcedure.query(async ({ ctx }) => {
      const permissoesRole = PERMISSOES_POR_ROLE[ctx.user.role];
      const permissoesCustomizadas = await db.getPermissoesCustomizadas(ctx.user.id);

      return {
        role: ctx.user.role,
        permissoesRole,
        permissoesCustomizadas,
      };
    }),

    // Adicionar permissão customizada
    adicionar: protectedProcedure
      .input(z.object({
        usuarioId: z.number(),
        permissao: z.string(),
        valor: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        // Apenas master e presidente podem adicionar permissões
        if (ctx.user.role !== "master" && ctx.user.role !== "presidente") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        await db.addPermissaoCustomizada({
          usuarioId: input.usuarioId,
          permissao: input.permissao,
          valor: input.valor,
          concedidoPor: ctx.user.id,
        });

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "adicionar",
          entidade: "permissao",
          detalhes: JSON.stringify(input),
        });

        return { success: true };
      }),

    // Remover permissão customizada
    remover: protectedProcedure
      .input(z.object({
        usuarioId: z.number(),
        permissao: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "master" && ctx.user.role !== "presidente") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        await db.removePermissaoCustomizada(input.usuarioId, input.permissao);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: ctx.user.escolaId ?? undefined,
          acao: "remover",
          entidade: "permissao",
          detalhes: JSON.stringify(input),
        });

        return { success: true };
      }),
  }),

  // ============================================
  // NOTIFICAÇÕES INTERNAS
  // ============================================
  notificacoes: router({
    // Listar notificações do usuário
    listar: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificacoesUsuario(ctx.user.id);
    }),

    // Contar não lidas
    contarNaoLidas: protectedProcedure.query(async ({ ctx }) => {
      return db.contarNotificacoesNaoLidas(ctx.user.id);
    }),

    // Marcar como lida
    marcarLida: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.marcarNotificacaoLida(input.id, ctx.user.id);
        return { success: true };
      }),

    // Marcar todas como lidas
    marcarTodasLidas: protectedProcedure.mutation(async ({ ctx }) => {
      await db.marcarTodasNotificacoesLidas(ctx.user.id);
      return { success: true };
    }),

    // Excluir notificação
    excluir: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.excluirNotificacao(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================
  // DASHBOARD / MÉTRICAS
  // ============================================
  dashboard: router({
    // Métricas gerais da escola (para presidente)
    metricas: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) {
        return null;
      }

      // Verificar se é gestor
      const isGestor = ["master", "presidente", "diretor"].includes(ctx.user.role);
      if (!isGestor) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
      }

      return db.getMetricasEscola(ctx.user.escolaId);
    }),

    // Usuários pendentes de aprovação
    usuariosPendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
      if (!temPermissao) return [];

      return db.getUsuariosPendentes(ctx.user.escolaId);
    }),

    // Alertas do sistema
    alertas: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const isGestor = ["master", "presidente", "diretor"].includes(ctx.user.role);
      if (!isGestor) return [];

      return db.getAlertasSistema(ctx.user.escolaId);
    }),

    // Atividade recente
    atividadeRecente: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const isGestor = ["master", "presidente", "diretor"].includes(ctx.user.role);
      if (!isGestor) return [];

      return db.getAtividadeRecente(ctx.user.escolaId, 20);
    }),
  }),
});

export type AppRouter = typeof appRouter;
