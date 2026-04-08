# Análise Sprint 19 - Problemas Identificados

## Problema Principal
O auth-context.tsx usa dados **locais** (AsyncStorage) e NÃO está integrado ao banco de dados.
O login-cpf.tsx verifica senhas no AsyncStorage, não no banco.
A landing.tsx funciona mas usa escola hardcoded local.

## O que precisa ser feito:

### 1. Auth-Context (lib/auth-context.tsx)
- REESCREVER para integrar com banco de dados via tRPC
- Usar roles do schema: master, diretor_escola, diretor_carnaval, diretor_ala, diretor_segmento, integrante, pendente
- Manter loginComoAdmin para testes
- Adicionar loginCpf(cpf, senha) que chama API do servidor
- Adicionar registrar(dados) que cria usuário no banco

### 2. Server Routers (server/routers.ts)
- Adicionar rota auth.loginCpf (CPF + senha → verificar no banco → retornar sessão)
- Adicionar rota auth.registrar (criar usuário com CPF + senha + dados)
- Usar crypto para hash de senha (já importado)

### 3. Server DB (server/db.ts)
- Adicionar getUserByCpf(cpf)
- Adicionar createUserCpf(cpf, senhaHash, nome, email, telefone, escolaId)
- Adicionar verificarSenha(cpf, senha)

### 4. Login-CPF (app/login-cpf.tsx)
- Chamar auth.loginCpf via tRPC em vez de AsyncStorage
- Manter validação de CPF local
- Redirecionar baseado no status do banco

### 5. Landing (app/landing.tsx)
- Buscar escolas do banco via tRPC (escolas.listar)
- Manter escola padrão como fallback

### 6. Fluxo de Primeiro Acesso
- Usuário seleciona escola na Landing
- Vai para Login CPF
- Se CPF não existe → Cadastro (cria user no banco com role=pendente)
- Se pendente → Status Cadastro
- Se aprovado → Home (tabs)
- Diretor de Carnaval é o PRIMEIRO usuário necessário para uma escola funcionar

## Schema do banco (já correto):
- users.cpf, users.senhaHash, users.role (7 níveis), users.statusUsuario, users.escolaId
- escolas (com plano, limites, etc.)
