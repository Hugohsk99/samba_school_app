# TODO - Aplicativo de Gestão para Escolas de Samba

## Configuração Inicial
- [x] Atualizar paleta de cores no theme.config.js
- [x] Gerar logo personalizado do aplicativo
- [x] Atualizar nome do aplicativo no app.config.ts
- [x] Configurar estrutura de navegação com tabs

## Tela Home (Dashboard)
- [x] Criar layout da tela home com cards de resumo
- [x] Implementar cards de estatísticas (total de blocos, membros, materiais)
- [x] Adicionar seção de próximos ensaios
- [x] Implementar área de alertas e notificações
- [x] Criar botões de acesso rápido

## Gestão de Blocos
- [x] Criar tela de listagem de blocos
- [x] Implementar botão flutuante para adicionar novo bloco
- [ ] Criar formulário de cadastro de bloco
- [ ] Implementar tela de detalhes do bloco
- [ ] Adicionar funcionalidade de editar bloco
- [ ] Implementar exclusão de bloco com confirmação
- [x] Criar sistema de ícones para diferentes tipos de blocos

## Gestão de Integrantes
- [ ] Criar modelo de dados para integrantes
- [ ] Implementar listagem de integrantes por bloco
- [ ] Criar formulário de cadastro de integrante
- [ ] Adicionar funcionalidade de editar integrante
- [ ] Implementar associação de integrante a múltiplos blocos
- [ ] Adicionar foto de perfil para integrantes

## Gestão de Ensaios
- [x] Criar tela de calendário de ensaios
- [x] Implementar listagem de ensaios (futuros e passados)
- [ ] Criar formulário de agendamento de ensaio
- [ ] Implementar seleção de blocos participantes
- [ ] Adicionar funcionalidade de editar ensaio
- [ ] Implementar cancelamento de ensaio

## Registro de Presença
- [ ] Criar tela de registro de presença
- [ ] Implementar lista de integrantes com checkboxes
- [ ] Adicionar estados: Presente, Ausente, Justificado
- [ ] Implementar campo de justificativa para ausências
- [ ] Criar resumo de presença ao final do registro
- [ ] Adicionar indicadores visuais de status (cores)
- [ ] Implementar salvamento automático de presença

## Gestão de Almoxarifado
- [x] Criar tela de inventário de materiais
- [x] Implementar categorização de materiais
- [ ] Criar formulário de cadastro de material
- [ ] Adicionar funcionalidade de foto do material
- [x] Implementar controle de quantidade (disponível, em uso, necessária)
- [x] Criar sistema de alertas para materiais em falta
- [ ] Implementar registro de entrada/saída de material
- [ ] Adicionar histórico de movimentações

## Relatórios e Estatísticas
- [x] Criar tela de relatórios
- [x] Implementar estatísticas de presença por bloco
- [x] Adicionar gráficos de frequência
- [x] Criar relatório de inventário consolidado
- [ ] Implementar filtros por período
- [x] Adicionar visualizações gráficas (gráficos de barras, pizza)

## Configurações
- [ ] Criar tela de configurações
- [ ] Implementar edição de informações da escola
- [ ] Adicionar toggle de tema claro/escuro
- [ ] Criar seção "Sobre o aplicativo"
- [ ] Implementar configurações de notificações

## Persistência de Dados
- [ ] Configurar AsyncStorage para dados locais
- [ ] Implementar modelos de dados para todas as entidades
- [ ] Criar funções de CRUD para blocos
- [ ] Criar funções de CRUD para integrantes
- [ ] Criar funções de CRUD para ensaios
- [ ] Criar funções de CRUD para materiais
- [ ] Implementar sistema de backup de dados

## Melhorias de UX
- [ ] Adicionar feedback háptico em interações principais
- [ ] Implementar animações suaves de transição
- [ ] Adicionar estados de loading
- [ ] Implementar mensagens de erro amigáveis
- [ ] Adicionar confirmações para ações destrutivas
- [ ] Implementar busca e filtros em listas longas

## Testes e Validação
- [ ] Testar fluxo completo de criação de bloco
- [ ] Testar fluxo de registro de presença
- [ ] Testar fluxo de gerenciamento de materiais
- [ ] Validar persistência de dados
- [ ] Testar em diferentes tamanhos de tela
- [ ] Validar acessibilidade

## Documentação
- [ ] Criar guia de uso para o usuário
- [ ] Documentar estrutura de dados
- [ ] Criar README com instruções de desenvolvimento


## Sprint Atual - Fase 2

### Persistência de Dados
- [x] Criar módulo de storage com AsyncStorage
- [x] Implementar funções CRUD genéricas
- [x] Criar hooks customizados para cada entidade
- [x] Implementar contexto global de dados

### CRUD de Blocos
- [x] Criar formulário de novo bloco
- [x] Implementar edição de bloco existente
- [x] Adicionar confirmação de exclusão
- [x] Integrar com persistência de dados
- [x] Adicionar validação de formulários

### Registro de Presença
- [x] Criar tela de seleção de ensaio
- [x] Implementar lista de integrantes com checkboxes
- [x] Adicionar estados visuais (presente/ausente/justificado)
- [x] Implementar salvamento de presença
- [x] Criar resumo de presença ao final

### Homologação e Testes
- [x] Criar guia de testes com Expo Go
- [x] Documentar fluxos de teste
- [x] Preparar checklist de homologação


## Sprint 3 - Evolução do Aplicativo (Documento de Requisitos)

### Módulo 2: Gestão de Integrantes Aprimorada
- [x] Refatorar cadastro com campos completos (foto, nome, CPF, RG, endereço, contato emergência)
- [x] Implementar categorização obrigatória: Desfilante, Segmento ou Diretoria/Staff
- [x] Para Segmentos: associação a grupo específico (Bateria, Passistas, etc.)
- [x] Para Desfilantes: distinção entre Alas Comerciais e Alas da Comunidade
- [ ] Criar perfis de usuário detalhados com histórico
- [ ] Implementar listagem de integrantes por categoria/tipo

### Módulo 4: Gestão de Eventos e Controle de Presença
- [x] Desenvolver módulo de calendário de eventos (ensaios, feijoadas, reuniões)
- [x] Implementar sistema de check-in com QR Code único por integrante
- [x] Gerar QR Code no perfil de cada integrante
- [x] Criar tela de scanner de QR Code para check-in
- [x] Gerar relatórios detalhados de frequência por integrante, ala e segmento

### Módulo 5: Gestão de Fantasias/Almoxarifado
- [x] Criar CRUD completo de materiais/fantasias
- [x] Associar fantasia a ala e tamanho
- [ ] Implementar fluxo de entrega de fantasia (registro via QR Code)
- [ ] Implementar fluxo de devolução com estado de conservação
- [x] Dashboard com status do inventário em tempo real

### Funcionalidades de Busca e Filtros
- [x] Adicionar campo de busca na listagem de blocos
- [x] Adicionar campo de busca na listagem de integrantes
- [x] Adicionar filtros por categoria/tipo de integrante
- [x] Adicionar busca na listagem de materiais
- [x] Adicionar filtros por categoria de material
