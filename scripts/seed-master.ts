/**
 * Script para criar usuário master para testes
 * 
 * Execute com: npx tsx scripts/seed-master.ts
 */

import { seedMasterUser } from "../server/db";

const MASTER_USER = {
  openId: "master-test-user-001",
  email: "master@escoladesamba.app",
  nome: "Administrador Master",
};

async function main() {
  console.log("🔧 Criando usuário master para testes...\n");
  
  try {
    const user = await seedMasterUser(
      MASTER_USER.openId,
      MASTER_USER.email,
      MASTER_USER.nome
    );
    
    if (user) {
      console.log("✅ Usuário master criado/atualizado com sucesso!\n");
      console.log("📋 Dados do usuário:");
      console.log(`   ID: ${user.id}`);
      console.log(`   OpenID: ${user.openId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.statusUsuario}`);
      console.log("\n🎯 Este usuário tem acesso total a todas as funcionalidades.");
    } else {
      console.log("⚠️ Não foi possível criar o usuário master.");
    }
  } catch (error) {
    console.error("❌ Erro ao criar usuário master:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
