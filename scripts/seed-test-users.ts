/**
 * Script para criar escola Estácio + usuários de teste no banco de dados
 * 
 * Usuários criados:
 * 1. Márcio Aurélio (Diretor de Carnaval) - CPF: 999.999.999-01 / Senha: 123456Difininho
 * 2. Teste Master ADM (Master)             - CPF: 999.999.999-02 / Senha: 123456Master
 * 3. João da Bateria (Diretor de Ala)      - CPF: 999.999.999-03 / Senha: 123456Teste
 * 4. Maria das Baianas (Integrante)        - CPF: 999.999.999-04 / Senha: 123456Teste
 * 5. Carlos Passista (Integrante)          - CPF: 999.999.999-05 / Senha: 123456Teste
 * 6. Ana Porta-Bandeira (Diretor Segmento) - CPF: 999.999.999-06 / Senha: 123456Teste
 * 7. Pedro Mestre-Sala (Integrante)        - CPF: 999.999.999-07 / Senha: 123456Teste
 * 8. Lucia Harmonia (Diretor de Ala)       - CPF: 999.999.999-08 / Senha: 123456Teste
 * 
 * Execute com: npx tsx scripts/seed-test-users.ts
 */

import { getDb } from "../server/db";
import { escolas, users, ativosFixos } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function hashSenha(senha: string): string {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

interface TestUser {
  cpf: string;
  senha: string;
  nome: string;
  email: string;
  telefone: string;
  role: "master" | "diretor_escola" | "diretor_carnaval" | "diretor_ala" | "diretor_segmento" | "integrante" | "pendente";
  statusUsuario: "aprovado" | "pendente";
  medidasJson?: string;
  tamanhoRoupaJson?: string;
}

const TEST_USERS: TestUser[] = [
  {
    cpf: "99999999901",
    senha: "123456Difininho",
    nome: "Márcio Aurélio",
    email: "marcio@estacio.test",
    telefone: "(21) 99999-0001",
    role: "diretor_carnaval",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.78", peito: "102", cintura: "88", quadril: "96" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "G", calca: "42", sapato: "42" }),
  },
  {
    cpf: "99999999902",
    senha: "123456Master",
    nome: "Teste Master ADM",
    email: "master@estacio.test",
    telefone: "(21) 99999-0002",
    role: "master",
    statusUsuario: "aprovado",
  },
  {
    cpf: "99999999903",
    senha: "123456Teste",
    nome: "João da Bateria",
    email: "joao@estacio.test",
    telefone: "(21) 99999-0003",
    role: "diretor_ala",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.82", peito: "108", cintura: "92", quadril: "100" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "GG", calca: "44", sapato: "43" }),
  },
  {
    cpf: "99999999904",
    senha: "123456Teste",
    nome: "Maria das Baianas",
    email: "maria@estacio.test",
    telefone: "(21) 99999-0004",
    role: "integrante",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.62", peito: "94", cintura: "78", quadril: "102" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "M", calca: "40", sapato: "37" }),
  },
  {
    cpf: "99999999905",
    senha: "123456Teste",
    nome: "Carlos Passista",
    email: "carlos@estacio.test",
    telefone: "(21) 99999-0005",
    role: "integrante",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.75", peito: "98", cintura: "82", quadril: "94" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "M", calca: "40", sapato: "41" }),
  },
  {
    cpf: "99999999906",
    senha: "123456Teste",
    nome: "Ana Porta-Bandeira",
    email: "ana@estacio.test",
    telefone: "(21) 99999-0006",
    role: "diretor_segmento",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.68", peito: "90", cintura: "72", quadril: "98" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "P", calca: "38", sapato: "36" }),
  },
  {
    cpf: "99999999907",
    senha: "123456Teste",
    nome: "Pedro Mestre-Sala",
    email: "pedro@estacio.test",
    telefone: "(21) 99999-0007",
    role: "integrante",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.80", peito: "104", cintura: "86", quadril: "98" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "G", calca: "42", sapato: "42" }),
  },
  {
    cpf: "99999999908",
    senha: "123456Teste",
    nome: "Lucia Harmonia",
    email: "lucia@estacio.test",
    telefone: "(21) 99999-0008",
    role: "diretor_ala",
    statusUsuario: "aprovado",
    medidasJson: JSON.stringify({ altura: "1.65", peito: "92", cintura: "74", quadril: "100" }),
    tamanhoRoupaJson: JSON.stringify({ camisa: "M", calca: "40", sapato: "37" }),
  },
];

// Ativos fixos de exemplo
const TEST_ATIVOS = [
  {
    nome: "Surdo de Primeira",
    descricao: "Surdo de primeira linha, marca Contemporânea, 24 polegadas",
    categoria: "instrumentos" as const,
    valor: "2500.00",
    status: "bom" as const,
    localizacao: "Barracão - Sala de Instrumentos",
  },
  {
    nome: "Surdo de Segunda",
    descricao: "Surdo de segunda linha, marca Contemporânea, 22 polegadas",
    categoria: "instrumentos" as const,
    valor: "2200.00",
    status: "bom" as const,
    localizacao: "Barracão - Sala de Instrumentos",
  },
  {
    nome: "Caixa de Guerra",
    descricao: "Caixa de guerra profissional, 14 polegadas",
    categoria: "instrumentos" as const,
    valor: "800.00",
    status: "regular" as const,
    localizacao: "Barracão - Sala de Instrumentos",
  },
  {
    nome: "Repinique",
    descricao: "Repinique de alumínio, 12 polegadas",
    categoria: "instrumentos" as const,
    valor: "650.00",
    status: "bom" as const,
    localizacao: "Barracão - Sala de Instrumentos",
  },
  {
    nome: "Tamborim",
    descricao: "Tamborim profissional com baqueta",
    categoria: "instrumentos" as const,
    valor: "180.00",
    status: "bom" as const,
    localizacao: "Barracão - Sala de Instrumentos",
  },
  {
    nome: "Fantasia Ala das Baianas (Lote 50 unidades)",
    descricao: "Conjunto de 50 fantasias completas para ala das baianas, inclui saia, blusa, turbante e adereços",
    categoria: "fantasias" as const,
    valor: "75000.00",
    status: "bom" as const,
    localizacao: "Barracão - Sala de Fantasias",
  },
  {
    nome: "Carro Alegórico - Abre-Alas",
    descricao: "Carro alegórico principal, estrutura metálica com decoração",
    categoria: "alegorias" as const,
    valor: "180000.00",
    status: "manutencao" as const,
    localizacao: "Barracão - Galpão Principal",
  },
  {
    nome: "Adereço de Cabeça - Porta-Bandeira",
    descricao: "Coroa e adereço de cabeça para porta-bandeira, com cristais e plumas",
    categoria: "aderecos" as const,
    valor: "12000.00",
    status: "bom" as const,
    localizacao: "Barracão - Sala de Adereços",
  },
  {
    nome: "Mesa de Som 32 Canais",
    descricao: "Mesa de som digital, 32 canais, marca Yamaha",
    categoria: "equipamentos" as const,
    valor: "15000.00",
    status: "bom" as const,
    localizacao: "Quadra - Cabine de Som",
  },
  {
    nome: "Conjunto de Mesas e Cadeiras (Quadra)",
    descricao: "20 mesas plásticas e 80 cadeiras para eventos na quadra",
    categoria: "moveis" as const,
    valor: "8000.00",
    status: "regular" as const,
    localizacao: "Quadra - Depósito",
  },
];

async function main() {
  console.log("🎭 Seed de Dados de Teste - 100 Anos Gestão do Samba\n");
  console.log("=".repeat(60));

  const db = await getDb();
  if (!db) {
    console.error("❌ Não foi possível conectar ao banco de dados.");
    process.exit(1);
  }

  // ============================================
  // 1. Garantir que a escola Estácio existe
  // ============================================
  console.log("\n📌 Verificando escola Estácio de Sá...");

  let escolaId: number;
  const escolaExistente = await db.select().from(escolas).where(eq(escolas.slug, "estacio-de-sa")).limit(1);

  if (escolaExistente.length > 0) {
    escolaId = escolaExistente[0].id;
    console.log(`   ✅ Escola já existe (ID: ${escolaId})`);
  } else {
    const result = await db.insert(escolas).values({
      nome: "Estácio de Sá",
      slug: "estacio-de-sa",
      corPrimaria: "#CC0000",
      corSecundaria: "#FFFFFF",
      plano: "premium",
      limiteUsuarios: 500,
      email: "contato@estaciodesamba.com.br",
      telefone: "(21) 97584-1304",
      cidade: "Rio de Janeiro",
      estado: "RJ",
    });
    escolaId = Number(result[0].insertId);
    console.log(`   ✅ Escola criada (ID: ${escolaId})`);
  }

  // ============================================
  // 2. Inserir usuários de teste
  // ============================================
  console.log("\n👥 Inserindo usuários de teste...\n");

  for (const testUser of TEST_USERS) {
    // Verificar se CPF já existe
    const existente = await db.select().from(users).where(eq(users.cpf, testUser.cpf)).limit(1);

    if (existente.length > 0) {
      // Atualizar o existente para garantir dados corretos
      await db.update(users).set({
        senhaHash: hashSenha(testUser.senha),
        name: testUser.nome,
        email: testUser.email,
        telefone: testUser.telefone,
        role: testUser.role,
        statusUsuario: testUser.statusUsuario,
        escolaId: escolaId,
        loginMethod: "cpf",
        medidasJson: testUser.medidasJson || null,
        tamanhoRoupaJson: testUser.tamanhoRoupaJson || null,
      }).where(eq(users.cpf, testUser.cpf));

      console.log(`   🔄 Atualizado: ${testUser.nome} (CPF: ${testUser.cpf}) - ${testUser.role}`);
    } else {
      const openId = `cpf_${testUser.cpf}_seed`;
      await db.insert(users).values({
        cpf: testUser.cpf,
        senhaHash: hashSenha(testUser.senha),
        openId,
        name: testUser.nome,
        email: testUser.email,
        telefone: testUser.telefone,
        loginMethod: "cpf",
        role: testUser.role,
        statusUsuario: testUser.statusUsuario,
        escolaId: escolaId,
        medidasJson: testUser.medidasJson || null,
        tamanhoRoupaJson: testUser.tamanhoRoupaJson || null,
      });

      console.log(`   ✅ Criado: ${testUser.nome} (CPF: ${testUser.cpf}) - ${testUser.role}`);
    }
  }

  // ============================================
  // 3. Inserir ativos fixos de exemplo
  // ============================================
  console.log("\n📦 Inserindo ativos fixos de exemplo...\n");

  // Buscar o ID do Márcio Aurélio para ser o cadastrador
  const marcio = await db.select().from(users).where(eq(users.cpf, "99999999901")).limit(1);
  const cadastradoPor = marcio.length > 0 ? marcio[0].id : null;

  for (const ativo of TEST_ATIVOS) {
    // Verificar se já existe ativo com mesmo nome na escola
    const existente = await db.select().from(ativosFixos).where(
      and(eq(ativosFixos.escolaId, escolaId), eq(ativosFixos.nome, ativo.nome))
    ).limit(1);

    if (existente.length > 0) {
      console.log(`   🔄 Já existe: ${ativo.nome}`);
    } else {
      await db.insert(ativosFixos).values({
        escolaId,
        nome: ativo.nome,
        descricao: ativo.descricao,
        categoria: ativo.categoria,
        valor: ativo.valor,
        status: ativo.status,
        localizacao: ativo.localizacao,
        cadastradoPor,
        dataAquisicao: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      });
      console.log(`   ✅ Criado: ${ativo.nome} (${ativo.categoria}) - R$ ${ativo.valor}`);
    }
  }

  // ============================================
  // RESUMO
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Seed concluído com sucesso!\n");
  console.log("📋 Usuários de teste disponíveis:\n");
  console.log("┌─────────────────────────┬──────────────────┬──────────────────────┬─────────────────────┐");
  console.log("│ Nome                    │ CPF              │ Senha                │ Role                │");
  console.log("├─────────────────────────┼──────────────────┼──────────────────────┼─────────────────────┤");
  for (const u of TEST_USERS) {
    const cpfFormatado = `${u.cpf.slice(0,3)}.${u.cpf.slice(3,6)}.${u.cpf.slice(6,9)}-${u.cpf.slice(9)}`;
    console.log(`│ ${u.nome.padEnd(23)} │ ${cpfFormatado.padEnd(16)} │ ${u.senha.padEnd(20)} │ ${u.role.padEnd(19)} │`);
  }
  console.log("└─────────────────────────┴──────────────────┴──────────────────────┴─────────────────────┘");
  console.log("\n💡 Para testar: Na tela Landing, selecione 'Estácio de Sá' → Login CPF → Use os dados acima");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
