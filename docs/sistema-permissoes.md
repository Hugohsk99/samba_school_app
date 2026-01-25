# Sistema de Autenticação e Permissões

## Visão Geral

Este documento descreve a arquitetura do sistema de autenticação e permissões para o aplicativo de gestão de escolas de samba, incluindo hierarquia de usuários, estrutura do banco de dados e preparação para funcionalidades futuras.

## Hierarquia de Papéis (Roles)

### Níveis de Acesso

| Role | Descrição | Escopo |
|------|-----------|--------|
| **master** | Acesso total ao sistema | Global |
| **presidente** | Gestor principal da escola | Escola |
| **diretor** | Diretor de área/bloco | Bloco/Área |
| **coordenador** | Coordenador de atividades | Bloco/Área |
| **integrante** | Membro da escola | Próprio perfil |
| **contribuinte** | Apoiador/patrocinador | Visualização limitada |

### Matriz de Permissões

| Funcionalidade | Master | Presidente | Diretor | Coordenador | Integrante | Contribuinte |
|----------------|--------|------------|---------|-------------|------------|--------------|
| **Gestão de Escola** |
| Editar dados da escola | ✓ | ✓ | - | - | - | - |
| Gerenciar plano/assinatura | ✓ | ✓ | - | - | - | - |
| Aprovar novos usuários | ✓ | ✓ | ✓ | - | - | - |
| **Gestão de Usuários** |
| Ver todos usuários | ✓ | ✓ | ✓ | ✓ | - | - |
| Cadastrar usuários | ✓ | ✓ | ✓ | - | - | - |
| Editar usuários | ✓ | ✓ | ✓ | - | - | - |
| Excluir usuários | ✓ | ✓ | - | - | - | - |
| Alterar roles | ✓ | ✓ | - | - | - | - |
| **Gestão de Blocos** |
| Ver todos blocos | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Cadastrar blocos | ✓ | ✓ | - | - | - | - |
| Editar blocos | ✓ | ✓ | ✓* | - | - | - |
| Excluir blocos | ✓ | ✓ | - | - | - | - |
| **Gestão de Eventos** |
| Ver todos eventos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cadastrar eventos | ✓ | ✓ | ✓ | ✓ | - | - |
| Editar eventos | ✓ | ✓ | ✓ | ✓ | - | - |
| Excluir eventos | ✓ | ✓ | ✓ | - | - | - |
| Fazer check-in | ✓ | ✓ | ✓ | ✓ | - | - |
| **Almoxarifado** |
| Ver materiais | ✓ | ✓ | ✓ | ✓ | - | - |
| Cadastrar materiais | ✓ | ✓ | ✓ | ✓ | - | - |
| Entregar/devolver | ✓ | ✓ | ✓ | ✓ | - | - |
| Excluir materiais | ✓ | ✓ | ✓ | - | - | - |
| **Financeiro** |
| Ver dashboard | ✓ | ✓ | - | - | - | - |
| Cadastrar transações | ✓ | ✓ | - | - | - | - |
| Relatórios financeiros | ✓ | ✓ | - | - | - | - |
| **Próprio Perfil** |
| Ver próprio perfil | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editar próprio perfil | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver carteirinha | ✓ | ✓ | ✓ | ✓ | ✓ | - |

*Apenas blocos sob sua responsabilidade

## Estrutura do Banco de Dados

### Tabela: escolas

Representa uma escola de samba cadastrada no sistema.

```sql
CREATE TABLE escolas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#FF6B35',
  cor_secundaria VARCHAR(7) DEFAULT '#1A1A1A',
  
  -- Plano/Assinatura
  plano ENUM('gratuito', 'basico', 'premium', 'enterprise') DEFAULT 'gratuito',
  plano_expira_em TIMESTAMP NULL,
  limite_usuarios INT DEFAULT 50,
  
  -- Dados de contato
  email VARCHAR(320),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  
  -- Metadados
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE
);
```

### Tabela: usuarios

Usuários do sistema com autenticação OAuth.

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- OAuth (Manus)
  open_id VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(320),
  nome VARCHAR(255),
  foto_url TEXT,
  login_method VARCHAR(64),
  
  -- Preparação para OAuth adicional (futuro)
  google_id VARCHAR(128) NULL,
  apple_id VARCHAR(128) NULL,
  
  -- Vinculação com escola
  escola_id INT NULL,
  
  -- Role e permissões
  role ENUM('master', 'presidente', 'diretor', 'coordenador', 'integrante', 'contribuinte') DEFAULT 'integrante',
  
  -- Status de aprovação
  status ENUM('pendente', 'aprovado', 'rejeitado', 'suspenso') DEFAULT 'pendente',
  aprovado_por INT NULL,
  aprovado_em TIMESTAMP NULL,
  
  -- Vinculação com integrante (dados detalhados)
  integrante_id VARCHAR(36) NULL,
  
  -- Metadados
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP NULL,
  
  FOREIGN KEY (escola_id) REFERENCES escolas(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id)
);
```

### Tabela: permissoes_customizadas

Permite permissões específicas além do role padrão.

```sql
CREATE TABLE permissoes_customizadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  permissao VARCHAR(100) NOT NULL,
  valor BOOLEAN DEFAULT TRUE,
  concedido_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY (usuario_id, permissao),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (concedido_por) REFERENCES usuarios(id)
);
```

### Tabela: usuario_blocos

Relacionamento N:N entre usuários e blocos.

```sql
CREATE TABLE usuario_blocos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  bloco_id VARCHAR(36) NOT NULL,
  cargo VARCHAR(100) NULL,
  responsavel BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY (usuario_id, bloco_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### Tabela: convites

Convites para novos usuários.

```sql
CREATE TABLE convites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  escola_id INT NOT NULL,
  email VARCHAR(320) NOT NULL,
  role ENUM('presidente', 'diretor', 'coordenador', 'integrante', 'contribuinte') DEFAULT 'integrante',
  codigo VARCHAR(64) UNIQUE NOT NULL,
  criado_por INT NOT NULL,
  usado_por INT NULL,
  expira_em TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (escola_id) REFERENCES escolas(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  FOREIGN KEY (usado_por) REFERENCES usuarios(id)
);
```

## Fluxos de Autenticação

### Fluxo 1: Primeiro Acesso (Presidente)

1. Presidente faz login via OAuth (Manus)
2. Sistema cria registro em `usuarios` com status `aprovado` e role `presidente`
3. Sistema cria registro em `escolas` com dados básicos
4. Presidente configura dados da escola
5. Presidente pode convidar outros usuários

### Fluxo 2: Novo Usuário Convidado

1. Presidente/Diretor cria convite com email e role
2. Sistema envia link de convite
3. Usuário acessa link e faz login via OAuth
4. Sistema cria registro em `usuarios` com role do convite e status `aprovado`
5. Usuário vinculado à escola automaticamente

### Fluxo 3: Novo Usuário Solicitante

1. Usuário faz login via OAuth
2. Sistema cria registro em `usuarios` com status `pendente`
3. Usuário solicita acesso a uma escola (por código ou busca)
4. Presidente/Diretor recebe notificação
5. Presidente/Diretor aprova ou rejeita
6. Se aprovado, status muda para `aprovado`

### Fluxo 4: Usuário Master (Testes)

1. Usuário master é criado via seed do banco
2. Tem acesso total a todas as escolas
3. Pode simular qualquer role para testes
4. Não aparece em listagens normais

## Preparação para Futuro

### OAuth Adicional

Os campos `google_id` e `apple_id` estão preparados para integração futura:

```typescript
// Futuro: Login com Google
const googleUser = await googleAuth.signIn();
await linkGoogleAccount(userId, googleUser.id);

// Futuro: Login com Apple
const appleUser = await appleAuth.signIn();
await linkAppleAccount(userId, appleUser.id);
```

### Sistema de Planos

A estrutura de planos permite:

- **Gratuito**: Até 50 usuários, funcionalidades básicas
- **Básico**: Até 200 usuários, relatórios
- **Premium**: Usuários ilimitados, todas funcionalidades
- **Enterprise**: Customização, suporte dedicado

```typescript
// Verificar limite de usuários
const escola = await getEscola(escolaId);
const totalUsuarios = await countUsuarios(escolaId);

if (totalUsuarios >= escola.limiteUsuarios) {
  throw new Error("Limite de usuários atingido. Faça upgrade do plano.");
}
```

### Verificação de Plano

```typescript
function verificarPermissaoPlano(escola: Escola, funcionalidade: string): boolean {
  const funcionalidadesPorPlano = {
    gratuito: ['basico'],
    basico: ['basico', 'relatorios'],
    premium: ['basico', 'relatorios', 'financeiro', 'notificacoes'],
    enterprise: ['*'],
  };
  
  const permitidas = funcionalidadesPorPlano[escola.plano];
  return permitidas.includes('*') || permitidas.includes(funcionalidade);
}
```

## Implementação no Frontend

### Hook useAuth Atualizado

```typescript
interface AuthContextType {
  user: Usuario | null;
  escola: Escola | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Permissões
  temPermissao: (permissao: string) => boolean;
  temAcessoBloco: (blocoId: string) => boolean;
  temAcessoFinanceiro: () => boolean;
  
  // Ações
  login: () => Promise<void>;
  logout: () => Promise<void>;
  solicitarAcesso: (escolaId: number) => Promise<void>;
}
```

### Componente de Proteção de Rota

```tsx
function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredPermission 
}: {
  children: React.ReactNode;
  requiredRole?: Role[];
  requiredPermission?: string;
}) {
  const { role, temPermissao, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  
  if (requiredRole && !requiredRole.includes(role)) {
    return <AccessDenied />;
  }
  
  if (requiredPermission && !temPermissao(requiredPermission)) {
    return <AccessDenied />;
  }
  
  return children;
}
```

## Segurança

### Validação no Backend

Todas as rotas protegidas devem validar:

1. Token de autenticação válido
2. Usuário existe e está ativo
3. Usuário tem role/permissão necessária
4. Usuário pertence à escola correta
5. Plano da escola permite a funcionalidade

### Auditoria

Registrar todas as ações sensíveis:

- Alterações de role
- Aprovações/rejeições
- Exclusões
- Alterações de plano
