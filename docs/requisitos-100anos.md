# Requisitos Consolidados - 100 Anos Gestão do Samba

## Dados Fixos
- Nome do app: 100 Anos (Gestão do Samba)
- Primeira escola: Estácio S.A.
- E-mail: 100anosgestaodesamba@gmail.com
- Telefone 1: 21 97584-1304
- Telefone 2: 21 99930-4505
- Usuário master: "100 anos gestão de samba"

## Hierarquia de Perfis (7 níveis)
1. Master (100 Anos Gestão de Samba) - Acesso total global
2. Diretor de Escola - Máximo dentro da escola
3. Diretor de Carnaval/Administrativo - Operacional avançado na escola
4. Diretor de Ala - Restrito à ala
5. Diretor de Segmento - Restrito ao segmento
6. Integrante Aprovado - Leitura apenas
7. Usuário Pendente - Aguardando aprovação
8. Usuário Externo - Sem CPF, só contato

## Autenticação
- CPF + Senha (não OAuth/Google)
- Comportamento dinâmico conforme CPF existente/status/perfil

## Fluxo de Cadastro
1. Selecionar escola
2. Preencher: nome, CPF, telefone, e-mail, ala/segmento pretendido
3. Anexar comprovante PIX
4. Status "aguardando aprovação"
5. Diretor aprova/rejeita
6. Após aprovação: dados bloqueados para autoedição

## Regras de Negócio Críticas
- RN12: Cada ala max 50 integrantes
- RN13: Criação automática de nova ala ao atingir 50
- RN09: Dados bloqueados após cadastro (só diretor/master edita)
- RN08: Cadastro exige comprovante PIX
- RN01: Primeira tela = seleção de escola
- RN04: Master inicial = "100 anos gestão de samba"

## Telas Obrigatórias (17+)
1. Seleção de Escola (Landing) - com botão "+" para associação
2. Login (CPF + Senha)
3. Cadastro de Integrante (com comprovante PIX)
4. Status de Cadastro (Aguardando aprovação)
5. Home do Diretor de Escola (Dashboard)
6. Gerenciar Alas
7. Gerenciar Integrantes
8. Detalhes de Integrante
9. Perfil de Integrante (carteira)
10. Home do Diretor de Ala
11. Home do ADM (Master)
12. Adicionar Nova Escola
13. Eventos
14. Calendário
15. Notificações/Comunicados
16. Assinatura/Plano
17. Contato para Associação

## Assinatura/Monetização
- Período de teste: 3 meses (ou 1 ano se possível)
- Plano anual: R$ 10,00
- Expirado: bloqueia funções administrativas, mantém leitura

## Banco de Dados (Entidades)
- schools, users, roles, user_school_roles
- wings (alas), segments (segmentos)
- membership_requests, payment_receipts
- events, calendar_entries, notifications
- subscriptions, audit_logs

## Requisitos Adicionais do PDF
- Multi-tenant: schema compartilhado com tenant_id (school_id)
- RBAC com escopo por escola (user pode ter roles diferentes em escolas diferentes)
- Alas: max 50 integrantes, criação automática da próxima (Ala 1, Ala 2...)
- Comprovante PIX: upload obrigatório no cadastro, armazenamento seguro
- PIX é para bens físicos (taxa de inscrição, fantasia), não para acesso ao app
- Assinatura do app: via In-App Purchase (R$10/ano), trial de 1 ano
- Segurança: hash bcrypt/Argon2 para senhas, TLS 1.3, LGPD compliance
- Presigned URLs para comprovantes PIX (TTL curto)
- Audit logs para ações críticas
- State machine para fluxo do usuário: externo → cadastro → pendente → aprovado

## Telas Prioritárias para Implementar Agora
1. Landing/Seleção de Escola (com Estácio S.A. e botão +)
2. Login por CPF + Senha
3. Cadastro de Integrante com comprovante PIX
4. Status de Cadastro (aguardando aprovação)
5. Dashboard Diretor de Escola
6. Gestão de Alas (com limite 50)
7. Fila de Aprovação
8. Carteira do Integrante
9. Tela de Contato/Associação
10. Gestão de Assinatura/Plano
