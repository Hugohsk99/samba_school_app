# Revisão Sprint 19 - Problemas Identificados

## Problema 1: Landing não é a primeira tela
- O `_layout.tsx` tem `anchor: "(tabs)"` que faz o app abrir nas tabs
- Solução: Criar um index.tsx na raiz do app que redireciona para landing ou tabs baseado no estado de auth

## Problema 2: Hierarquia de roles incorreta no banco
- Banco tem: master, presidente, diretor, coordenador, integrante, contribuinte (6 roles)
- Documento pede: master, diretor_escola, diretor_carnaval, diretor_ala, diretor_segmento, integrante, pendente (7 níveis)
- Solução: Atualizar roleEnum no schema para os 7 níveis corretos

## Problema 3: Login não integrado ao banco
- Login atual usa AsyncStorage local para senhas
- Precisa usar banco de dados com hash de senha
- Solução: Criar tabela de credenciais ou campo de senha hash na tabela users

## Problema 4: auth-context desconectado do banco
- auth-context usa dados de Integrante (AsyncStorage) e não do banco users
- Precisa integrar com tRPC para buscar dados do banco
- Solução: Reescrever auth-context para usar tRPC + banco

## Problema 5: Fluxo de primeiro acesso
- Não existe fluxo para criar Diretor de Carnaval como primeiro usuário
- Quando escola é criada, precisa ter pelo menos um Diretor de Carnaval
- Solução: Criar tela de "Primeiro Acesso da Escola" que cadastra o diretor

## Plano de Ação
1. Atualizar schema com 7 roles corretos + campo senha_hash
2. Reescrever _layout.tsx para redirecionar para landing
3. Reescrever auth-context para integrar com banco
4. Atualizar login-cpf para usar banco
5. Criar fluxo de primeiro acesso (cadastro do diretor de carnaval)
