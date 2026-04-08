import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { Role, PermissaoSistema, PERMISSOES_POR_ROLE, HIERARQUIA_ROLES, podeAprovarRole } from "../drizzle/schema";
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

// Roles válidos para aprovação e convites
const ROLES_APROVACAO = ["diretor_carnaval", "diretor_ala", "diretor_segmento", "integrante"] as const;
const ROLES_ALTERACAO = ["diretor_escola", "diretor_carnaval", "diretor_ala", "diretor_segmento", "integrante", "pendente"] as const;

// Roles gestores (podem acessar dashboard, alertas, etc.)
function isGestor(role: string): boolean {
  return ["master", "diretor_escola", "diretor_carnaval", "diretor_ala"].includes(role);
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

      return {
        ...user,
        escola,
      };
    }),

    // Login por CPF + Senha
    loginCpf: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
        senha: z.string().min(4),
      }))
      .mutation(async ({ input }) => {
        const result = await db.loginCpf(input.cpf, input.senha);
        
        if (!result.success) {
          return {
            success: false as const,
            error: result.error,
            user: null,
          };
        }

        const user = result.user;
        let escola = null;
        if (user.escolaId) {
          escola = await db.getEscolaById(user.escolaId);
        }

        return {
          success: true as const,
          error: null,
          user: {
            id: user.id,
            cpf: user.cpf,
            nome: user.name,
            email: user.email,
            telefone: user.telefone,
            role: user.role,
            statusUsuario: user.statusUsuario,
            escolaId: user.escolaId,
            alaId: user.alaId,
            segmentoId: user.segmentoId,
            fotoUrl: user.fotoUrl,
            escola,
          },
        };
      }),

    // Registrar novo usuário por CPF
    registrarCpf: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
        senha: z.string().min(4),
        nome: z.string().min(2),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        escolaId: z.number(),
        comprovantePix: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se CPF já existe
        const existente = await db.getUserByCpf(input.cpf);
        if (existente) {
          return {
            success: false as const,
            error: "cpf_ja_cadastrado",
            userId: null,
          };
        }

        const userId = await db.createUserCpf({
          cpf: input.cpf,
          senha: input.senha,
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          escolaId: input.escolaId,
          comprovantePix: input.comprovantePix,
        });

        // Notificar gestores sobre nova solicitação
        await db.notificarSolicitacaoAcesso(input.escolaId, input.nome);

        return {
          success: true as const,
          error: null,
          userId,
        };
      }),

    // Registrar primeiro diretor de carnaval (sem aprovação)
    registrarDiretorCarnaval: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
        senha: z.string().min(4),
        nome: z.string().min(2),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        escolaId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se escola já tem diretor de carnaval
        const temDiretor = await db.escolaTemDiretorCarnaval(input.escolaId);
        if (temDiretor) {
          return {
            success: false as const,
            error: "escola_ja_tem_diretor_carnaval",
            userId: null,
          };
        }

        // Verificar se CPF já existe
        const existente = await db.getUserByCpf(input.cpf);
        if (existente) {
          return {
            success: false as const,
            error: "cpf_ja_cadastrado",
            userId: null,
          };
        }

        const userId = await db.criarDiretorCarnaval({
          cpf: input.cpf,
          senha: input.senha,
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          escolaId: input.escolaId,
        });

        return {
          success: true as const,
          error: null,
          userId,
        };
      }),

    // Verificar status de um CPF
    verificarCpf: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
      }))
      .query(async ({ input }) => {
        const user = await db.getUserByCpf(input.cpf);
        if (!user) {
          return { existe: false as const, status: null, role: null };
        }
        return {
          existe: true as const,
          status: user.statusUsuario,
          role: user.role,
        };
      }),

    // Verificar se escola tem diretor de carnaval
    escolaTemDiretor: publicProcedure
      .input(z.object({
        escolaId: z.number(),
      }))
      .query(async ({ input }) => {
        return { temDiretor: await db.escolaTemDiretorCarnaval(input.escolaId) };
      }),
  }),

  // ============================================
  // ESCOLAS
  // ============================================
  escolas: router({
    // Listar escolas disponíveis
    listar: publicProcedure.query(async () => {
      return db.listarEscolas();
    }),

    // Criar nova escola
    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(3).max(255),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Gera slug único
        let slug = gerarSlug(input.nome);
        let contador = 0;
        while (await db.getEscolaBySlug(slug)) {
          contador++;
          slug = `${gerarSlug(input.nome)}-${contador}`;
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

        // Atualiza usuário como diretor_escola da escola
        await db.updateUserRole(ctx.user.id, "diretor_escola", ctx.user.id);
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

    // Obter escola por ID
    obter: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEscolaById(input.id);
      }),
  }),

  // ============================================
  // GESTÃO DE USUÁRIOS
  // ============================================
  usuarios: router({
    // Listar usuários da escola
    listar: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];
      
      const temPermissao = await db.temPermissao(ctx.user.id, "usuarios.ver_todos");
      if (!temPermissao) return [];

      return db.getUsersByEscola(ctx.user.escolaId);
    }),

    // Listar usuários pendentes
    pendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
      if (!temPermissao) return [];

      return db.getUsuariosPendentes(ctx.user.escolaId);
    }),

    // Aprovar usuário
    aprovar: protectedProcedure
      .input(z.object({
        usuarioId: z.number(),
        role: z.enum(ROLES_APROVACAO),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
        }

        // Verificar hierarquia - só pode aprovar roles abaixo do seu
        if (!podeAprovarRole(ctx.user.role as Role, input.role)) {
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
        role: z.enum(ROLES_ALTERACAO),
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

        // Verificar hierarquia
        if (!podeAprovarRole(ctx.user.role as Role, input.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Não pode promover a um nível igual ou superior ao seu" });
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
        role: z.enum(ROLES_APROVACAO),
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
        const escola = await db.getEscolaById(ctx.user.escolaId);
        if (escola) {
          const totalUsuarios = await db.countUsuariosEscola(ctx.user.escolaId);
          if (totalUsuarios >= escola.limiteUsuarios) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Limite de usuários atingido" });
          }
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

        return { codigo };
      }),

    // Listar convites da escola
    listar: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];
      return db.getConvitesByEscola(ctx.user.escolaId);
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
        await db.usarConvite(convite.codigo, ctx.user.id);

        return { success: true, escolaId: convite.escolaId };
      }),
  }),

  // ============================================
  // SOLICITAÇÕES DE ACESSO
  // ============================================
  solicitacoes: router({
    // Criar solicitação
    criar: protectedProcedure
      .input(z.object({
        escolaId: z.number(),
        mensagem: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSolicitacaoAcesso({
          usuarioId: ctx.user.id,
          escolaId: input.escolaId,
          mensagem: input.mensagem,
        });

        // Notificar gestores da escola
        const userName = ctx.user.name ?? "Novo usuário";
        await db.notificarSolicitacaoAcesso(input.escolaId, userName);

        await db.registrarAuditoria({
          usuarioId: ctx.user.id,
          escolaId: input.escolaId,
          acao: "solicitar_acesso",
          entidade: "solicitacao",
        });

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
        role: z.enum(ROLES_APROVACAO),
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
      const permissoesRole = PERMISSOES_POR_ROLE[ctx.user.role as Role] ?? [];
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
        // Apenas master e diretor_escola podem adicionar permissões
        if (ctx.user.role !== "master" && ctx.user.role !== "diretor_escola") {
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
        if (ctx.user.role !== "master" && ctx.user.role !== "diretor_escola") {
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
    listar: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificacoesUsuario(ctx.user.id);
    }),

    contarNaoLidas: protectedProcedure.query(async ({ ctx }) => {
      return db.contarNotificacoesNaoLidas(ctx.user.id);
    }),

    marcarLida: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.marcarNotificacaoLida(input.id, ctx.user.id);
        return { success: true };
      }),

    marcarTodasLidas: protectedProcedure.mutation(async ({ ctx }) => {
      await db.marcarTodasNotificacoesLidas(ctx.user.id);
      return { success: true };
    }),

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
    metricas: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return null;

      if (!isGestor(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
      }

      return db.getMetricasEscola(ctx.user.escolaId);
    }),

    usuariosPendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
      if (!temPermissao) return [];

      return db.getUsuariosPendentes(ctx.user.escolaId);
    }),

    alertas: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      if (!isGestor(ctx.user.role)) return [];

      return db.getAlertasSistema(ctx.user.escolaId);
    }),

    atividadeRecente: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];

      if (!isGestor(ctx.user.role)) return [];

      return db.getAtividadeRecente(ctx.user.escolaId, 20);
    }),
  }),

  // ============================================
  // PATRIMÔNIO (ATIVOS FIXOS)
  // ============================================
  patrimonio: router({
    listar: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];
      return db.getAtivosFixos(ctx.user.escolaId);
    }),

    buscarPorId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAtivoFixoById(input.id);
      }),

    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        categoria: z.enum(["carnavalescos", "instrumentos", "fantasias", "alegorias", "aderecos", "equipamentos", "moveis", "outros"]),
        valor: z.string().optional(),
        dataAquisicao: z.string().optional(),
        status: z.enum(["bom", "regular", "ruim", "manutencao", "baixado"]).optional(),
        localizacao: z.string().optional(),
        responsavelId: z.number().optional(),
        fotoUrl: z.string().optional(),
        observacoes: z.string().optional(),
        taxaDepreciacaoAnual: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.escolaId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usu\u00e1rio sem escola vinculada" });
        }
        const temPermissao = await db.temPermissao(ctx.user.id, "patrimonio.cadastrar");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permiss\u00e3o para cadastrar ativos" });
        }
        return db.createAtivoFixo({
          ...input,
          escolaId: ctx.user.escolaId,
          cadastradoPor: ctx.user.id,
          valor: input.valor || "0.00",
          dataAquisicao: input.dataAquisicao ? new Date(input.dataAquisicao) : undefined,
          taxaDepreciacaoAnual: input.taxaDepreciacaoAnual || "10.00",
        });
      }),

    atualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        categoria: z.enum(["carnavalescos", "instrumentos", "fantasias", "alegorias", "aderecos", "equipamentos", "moveis", "outros"]).optional(),
        valor: z.string().optional(),
        status: z.enum(["bom", "regular", "ruim", "manutencao", "baixado"]).optional(),
        localizacao: z.string().optional(),
        responsavelId: z.number().optional(),
        fotoUrl: z.string().optional(),
        observacoes: z.string().optional(),
        taxaDepreciacaoAnual: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "patrimonio.editar");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permiss\u00e3o para editar ativos" });
        }
        const { id, ...data } = input;
        return db.updateAtivoFixo(id, data);
      }),

    excluir: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const temPermissao = await db.temPermissao(ctx.user.id, "patrimonio.excluir");
        if (!temPermissao) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permiss\u00e3o para excluir ativos" });
        }
        return db.deleteAtivoFixo(input.id);
      }),
  }),

  // ============================================
  // PAINEL DO PRESIDENTE (MÉTRICAS COMPLETAS)
  // ============================================
  painel: router({
    metricasCompletas: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return null;
      if (!isGestor(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
      }
      return db.getMetricasDashboard(ctx.user.escolaId);
    }),

    pendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.escolaId) return [];
      const temPermissao = await db.temPermissao(ctx.user.id, "escola.aprovar_usuarios");
      if (!temPermissao) return [];
      return db.getUsuariosPendentes(ctx.user.escolaId);
    }),
  }),

  // ============================================
  // MEDIDAS CORPORAIS
  // ============================================
  medidas: router({
    atualizar: protectedProcedure
      .input(z.object({
        userId: z.number(),
        medidas: z.string(),
        tamanhoRoupa: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Usu\u00e1rio pode editar as pr\u00f3prias medidas, ou gestor pode editar de qualquer um
        if (ctx.user.id !== input.userId && !isGestor(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permiss\u00e3o" });
        }
        return db.updateMedidasUsuario(input.userId, input.medidas, input.tamanhoRoupa);
      }),
  }),
});

export type AppRouter = typeof appRouter;
