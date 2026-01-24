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


## Sprint 4 - Design, Usabilidade e Personalização

### Sistema de Personalização da Escola
- [x] Criar modelo de dados para configurações da escola (nome, logo, cores)
- [x] Implementar contexto de personalização com persistência
- [x] Criar tela de cadastro/edição da escola de samba
- [x] Implementar seletor de cores personalizado
- [x] Adicionar upload de logo da escola
- [x] Aplicar cores personalizadas em todo o app dinamicamente

### Tutorial de Onboarding
- [x] Criar telas de boas-vindas com explicação do app
- [x] Implementar carrossel de tutorial com imagens ilustrativas
- [x] Adicionar opção de pular tutorial
- [x] Salvar estado de "tutorial concluído" no dispositivo
- [x] Mostrar tutorial apenas na primeira abertura

### Melhorias de Design e Acessibilidade
- [x] Aumentar tamanho de fontes e botões para melhor legibilidade
- [x] Melhorar contraste de cores para acessibilidade
- [x] Adicionar ícones mais intuitivos e descritivos
- [x] Implementar feedback visual mais claro nas interações
- [x] Criar tooltips e dicas contextuais
- [x] Melhorar espaçamento e hierarquia visual


## Sprint 5 - Revisão e Aprimoramento Geral

### Correções de Bugs
- [x] Corrigir tutorial de onboarding (layout e navegação)
- [x] Adicionar feedback visual ao salvar configurações (loading, mensagem de sucesso)
- [x] Garantir que todas as ações tenham retorno visual para o usuário
- [ ] Revisar e corrigir posicionamento de elementos em todas as telas

### Melhoria de Indentação e Layout
- [ ] Revisar espaçamentos e alinhamentos em todas as telas
- [ ] Garantir consistência visual em todo o aplicativo
- [ ] Melhorar hierarquia visual dos elementos

### Dados de Exemplo
- [x] Criar dados de exemplo simulando escola de samba real
- [x] Inserir blocos típicos (Bateria, Passistas, Baianas, etc.)
- [x] Inserir integrantes de exemplo com dados completos
- [x] Inserir eventos de exemplo (ensaios, feijoadas)
- [x] Inserir materiais/fantasias de exemplo

### Controle de Dados
- [x] Criar tela de gerenciamento de dados
- [x] Adicionar opção de limpar todos os dados
- [x] Adicionar opção de carregar dados de exemplo
- [x] Implementar confirmações antes de ações destrutivas


### Sistema de Feedback Visual
- [x] Criar componente Toast/Notificação reutilizável
- [x] Implementar contexto global de notificações
- [x] Adicionar feedback de sucesso em todas as ações de salvar
- [x] Adicionar feedback de erro em todas as ações que podem falhar
- [x] Adicionar loading visual durante operações assíncronas
- [x] Garantir que toda interação tenha resposta visual


## Sprint 6 - Máscaras, Foto, QR Code e Hierarquia de Permissões

### Componentes de Entrada com Máscaras
- [x] Criar componente MaskedInput reutilizável
- [x] Implementar máscara para campo de telefone (XX) XXXXX-XXXX
- [x] Implementar máscara para campo de data DD/MM/AAAA
- [x] Implementar máscara para campo de horário HH:MM
- [x] Implementar validação de e-mail com feedback visual
- [x] Adicionar limite de caracteres em todos os campos
- [x] Adicionar ícone de ajuda (?) com tooltip explicativo em cada campo
- [x] Aplicar máscaras em todos os formulários do app

### Foto de Integrantes
- [x] Adicionar campo de foto no cadastro de integrante
- [x] Implementar seleção de foto da galeria
- [x] Implementar captura de foto pela câmera
- [x] Exibir foto no perfil e na listagem de integrantes
- [x] Exibir foto na carteirinha/QR Code do integrante

### Correção do Sistema de QR Code
- [x] Corrigir geração do QR Code único por integrante
- [x] Criar tela de "Carteirinha Digital" com QR Code do integrante
- [x] Implementar leitura correta do QR Code para check-in
- [x] Garantir que o QR Code contenha dados corretos do integrante

### Sistema de Hierarquia de Permissões
- [x] Definir níveis de acesso: Diretoria (total), Coordenador (parcial), Integrante (limitado)
- [x] Implementar contexto de autenticação/sessão do usuário logado
- [x] Diretoria: acesso total a todas as funcionalidades
- [x] Coordenador: pode fazer check-in, ver relatórios da sua ala
- [x] Integrante: acesso apenas ao próprio perfil e QR Code
- [ ] Ocultar/desabilitar funcionalidades baseado no nível de acesso
- [x] Criar tela de login/seleção de perfil



## Sprint 7 - Correções de Bugs

### Correções no Formulário de Eventos
- [x] Adicionar máscara de data (DD/MM/AAAA) no campo de data do evento
- [x] Adicionar máscara de horário (HH:MM) no campo de horário do evento
- [x] Garantir formato brasileiro em todas as datas e horários

### Correções na Foto de Integrantes
- [x] Corrigir funcionalidade da câmera para abrir a câmera do celular
- [x] Garantir que a foto seja salva corretamente
- [x] Adicionar opção de abrir carteirinha do integrante com QR Code



## Sprint 8 - Máscaras e Fluxo de Fantasias

### Máscaras em Formulários Restantes
- [x] Aplicar máscaras de data no formulário de ensaios
- [x] Aplicar máscaras de horário no formulário de ensaios
- [x] Aplicar máscaras no formulário de materiais (se aplicável)
- [x] Garantir consistência de formato em todo o app

### Fluxo de Entrega de Fantasias
- [x] Criar tela de entrega de fantasia
- [x] Implementar scanner de QR Code do integrante para entrega
- [x] Registrar entrega com data, hora e responsável
- [x] Criar tela de devolução de fantasia
- [x] Implementar registro de estado de conservação na devolução
- [ ] Criar histórico de movimentações por fantasia
- [ ] Adicionar relatório de fantasias entregues/devolvidas



## Sprint 9 - Correções de Bugs

### Correções Reportadas pelo Usuário
- [x] Corrigir funcionalidade de foto do integrante (não carrega/exibe corretamente)
- [x] Garantir que a foto seja salva e exibida na tela de integrante
- [x] Adicionar botão de adicionar material na tela de Estoque (só aparece na Home)
- [x] Verificar permissões de acesso ao botão de adicionar material



## Sprint 10 - Aprimoramento do Controle de Materiais/Fantasias

### Modelo de Dados e Rastreabilidade
- [x] Aprimorar tipo EntregaFantasia com campos completos (responsável, observações)
- [x] Criar relacionamento claro entre Material, Integrante e Entrega
- [x] Adicionar campo de status no Material (disponível, emprestado, em manutenção)
- [x] Implementar histórico de movimentações por material

### Fluxo de Empréstimo Aprimorado
- [x] Melhorar tela de entrega com seleção clara de material e integrante
- [x] Mostrar quem está com cada material na listagem
- [x] Adicionar validação para não emprestar material já emprestado
- [x] Implementar feedback visual claro após empréstimo

### Fluxo de Devolução Aprimorado
- [x] Criar tela de devolução com lista de itens emprestados ao integrante
- [x] Adicionar seleção de estado de conservação na devolução
- [x] Atualizar status do material automaticamente após devolução
- [x] Registrar histórico completo da movimentação

### Visualização e Histórico
- [x] Criar tela de histórico de movimentações por material
- [x] Mostrar timeline de empréstimos/devoluções
- [x] Adicionar filtros por integrante, material e período
- [x] Exibir estatísticas de uso (quantas vezes emprestado, tempo médio)

### Integração e Links
- [x] No perfil do integrante, mostrar materiais emprestados atualmente
- [x] No detalhe do material, mostrar quem está com ele e histórico
- [x] Criar alertas para materiais com empréstimo prolongado


## Sprint 11 - Login de Integrantes, Área Pessoal e Relatórios PDF

### Sistema de Login para Integrantes
- [x] Criar tela de login prático (CPF + data de nascimento ou código único)
- [x] Implementar autenticação simples baseada em dados cadastrados
- [x] Redirecionar para área do integrante após login bem-sucedido
- [x] Manter sessão do integrante logado
- [x] Adicionar opção de logout

### Área do Integrante (Acesso Limitado)
- [x] Criar tela principal do integrante com menu de opções
- [x] Exibir carteirinha digital com QR Code
- [x] Mostrar histórico de presença em eventos
- [x] Listar materiais/fantasias emprestados atualmente
- [x] Exibir próximos eventos/ensaios agendados
- [x] Mostrar dados pessoais do integrante

### Edição de Dados Pessoais
- [x] Criar tela de edição de dados para integrantes (campos limitados)
- [x] Permitir atualização de telefone, email, endereço
- [x] Bloquear edição de campos sensíveis (CPF, nome completo)
- [x] Implementar edição completa para gestores
- [x] Adicionar validação e feedback visual nas alterações

### Materiais Emprestados no Perfil
- [x] Mostrar lista de materiais em posse do integrante
- [x] Exibir data de entrega e responsável
- [x] Indicar materiais com devolução pendente
- [x] Criar alerta visual para devoluções atrasadas

### Exportação de Relatórios PDF (Gestores)
- [ ] Implementar geração de relatório de presença em PDF
- [ ] Implementar relatório de inventário/estoque em PDF
- [ ] Implementar relatório de entregas/devoluções em PDF
- [ ] Adicionar filtros por período e categoria
- [ ] Restringir acesso a relatórios apenas para gestores/diretoria

### Estrutura de Dados e Relacionamentos
- [ ] Garantir associação correta entre Material e Integrante via EntregaFantasia
- [ ] Implementar consultas otimizadas para buscar materiais por integrante
- [ ] Garantir integridade referencial nos dados

### Exportação de Relatórios em PDF (Sprint 11)
- [x] Criar tela de geração de relatórios (acesso apenas para gestores)
- [x] Implementar relatório de presença com ranking de integrantes
- [x] Implementar relatório de integrantes por categoria
- [x] Implementar relatório de materiais e empréstimos
- [x] Implementar relatório de eventos
- [x] Adicionar opção de compartilhar relatório via WhatsApp/email
