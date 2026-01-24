# Design de Interface - Aplicativo de Gestão para Escolas de Samba

## Princípios de Design

Este aplicativo segue as diretrizes do **Apple Human Interface Guidelines (HIG)** e padrões de aplicativos iOS mainstream. O design prioriza **orientação retrato (9:16)** e **uso com uma mão**, garantindo que os controles principais estejam acessíveis na parte inferior da tela.

## Paleta de Cores

O aplicativo utiliza cores que remetem ao carnaval brasileiro, mantendo profissionalismo e legibilidade:

| Elemento | Cor (Light Mode) | Cor (Dark Mode) | Uso |
|----------|------------------|-----------------|-----|
| Primary | `#FF6B35` (Laranja vibrante) | `#FF8C5A` (Laranja suave) | Botões principais, destaques |
| Background | `#FFFFFF` (Branco) | `#151718` (Preto suave) | Fundo das telas |
| Surface | `#F5F5F5` (Cinza claro) | `#1E2022` (Cinza escuro) | Cards, superfícies elevadas |
| Foreground | `#11181C` (Preto) | `#ECEDEE` (Branco) | Texto principal |
| Muted | `#687076` (Cinza médio) | `#9BA1A6` (Cinza claro) | Texto secundário |
| Success | `#22C55E` (Verde) | `#4ADE80` (Verde claro) | Confirmações, presença |
| Warning | `#F59E0B` (Amarelo) | `#FBBF24` (Amarelo claro) | Alertas |
| Error | `#EF4444` (Vermelho) | `#F87171` (Vermelho claro) | Erros, ausências |

## Lista de Telas

### 1. Home (Tela Inicial)
**Conteúdo Principal:**
- Resumo visual do status da escola (cards com estatísticas)
- Próximos ensaios agendados
- Alertas importantes (materiais em falta, pendências)
- Acesso rápido às funcionalidades principais

**Funcionalidade:**
- Navegação rápida para outras seções
- Visualização de dashboard com métricas importantes
- Notificações e lembretes

**Layout:**
- Header com logo e nome da escola
- Grid de cards com informações resumidas
- Lista de próximos eventos
- Botões de ação rápida na parte inferior

### 2. Blocos
**Conteúdo Principal:**
- Lista de todos os blocos da escola (Bateria, Passistas, Ala das Baianas, etc.)
- Informações de cada bloco: nome, responsável, número de integrantes

**Funcionalidade:**
- Visualizar lista completa de blocos
- Adicionar novo bloco
- Editar informações de bloco existente
- Ver detalhes de cada bloco (toque no card)

**Layout:**
- Lista vertical com cards para cada bloco
- Botão flutuante (+) para adicionar novo bloco
- Cada card mostra: nome, ícone, responsável, número de membros

### 3. Detalhes do Bloco
**Conteúdo Principal:**
- Informações completas do bloco
- Lista de integrantes
- Histórico de presença
- Materiais associados

**Funcionalidade:**
- Editar informações do bloco
- Adicionar/remover integrantes
- Registrar presença em ensaios
- Associar materiais ao bloco

**Layout:**
- Header com nome e ícone do bloco
- Seções organizadas em tabs: Informações, Integrantes, Presença, Materiais
- Botão de edição no header

### 4. Ensaios
**Conteúdo Principal:**
- Calendário de ensaios
- Lista de ensaios futuros e passados
- Registro de presença por bloco

**Funcionalidade:**
- Criar novo ensaio (data, horário, local, blocos participantes)
- Registrar presença dos integrantes
- Visualizar histórico de ensaios
- Estatísticas de frequência

**Layout:**
- Calendário visual na parte superior
- Lista de ensaios abaixo
- Cada ensaio mostra: data, horário, local, blocos, taxa de presença
- Botão para adicionar novo ensaio

### 5. Registro de Presença
**Conteúdo Principal:**
- Lista de integrantes do(s) bloco(s) participante(s)
- Status de presença: Presente, Ausente, Justificado

**Funcionalidade:**
- Marcar presença rapidamente (toque simples)
- Adicionar justificativa para ausências
- Visualizar resumo de presença ao final

**Layout:**
- Lista de integrantes com checkboxes grandes
- Cores visuais: verde (presente), vermelho (ausente), amarelo (justificado)
- Botão de finalizar registro na parte inferior

### 6. Almoxarifado
**Conteúdo Principal:**
- Inventário completo de materiais
- Categorias: Fantasias, Adereços, Instrumentos, Tecidos, Outros
- Quantidade disponível, em uso, necessária

**Funcionalidade:**
- Adicionar novo item ao inventário
- Editar quantidade e status de item
- Registrar entrada/saída de material
- Alertas de materiais em falta

**Layout:**
- Tabs para categorias de materiais
- Lista de itens com cards mostrando: nome, foto, quantidade, status
- Indicadores visuais para materiais em falta (vermelho)
- Botão flutuante para adicionar novo item

### 7. Detalhes do Material
**Conteúdo Principal:**
- Informações completas do material
- Foto do item
- Histórico de movimentações
- Bloco/pessoa responsável

**Funcionalidade:**
- Editar informações do material
- Registrar entrada ou saída
- Associar a bloco específico
- Adicionar notas e observações

**Layout:**
- Imagem grande do material no topo
- Informações organizadas em seções
- Histórico de movimentações em timeline
- Botões de ação na parte inferior

### 8. Relatórios
**Conteúdo Principal:**
- Estatísticas de presença por bloco
- Inventário consolidado
- Gráficos e visualizações

**Funcionalidade:**
- Visualizar dados consolidados
- Filtrar por período
- Exportar relatórios (futuro)

**Layout:**
- Cards com gráficos e estatísticas
- Filtros na parte superior
- Scroll vertical para visualizar todos os dados

### 9. Configurações
**Conteúdo Principal:**
- Informações da escola
- Preferências do aplicativo
- Sobre o aplicativo

**Funcionalidade:**
- Editar nome e logo da escola
- Configurar notificações
- Alternar tema claro/escuro
- Informações de versão

**Layout:**
- Lista de opções agrupadas por categoria
- Switches para configurações booleanas
- Navegação para sub-telas quando necessário

## Fluxos de Usuário Principais

### Fluxo 1: Registrar Presença em Ensaio
1. Usuário abre o app → **Home**
2. Toca em "Próximos Ensaios" ou navega para aba **Ensaios**
3. Seleciona o ensaio atual
4. Sistema abre tela **Registro de Presença**
5. Usuário marca presença de cada integrante (toque rápido)
6. Toca em "Finalizar Registro"
7. Sistema salva e mostra resumo de presença

### Fluxo 2: Adicionar Material ao Almoxarifado
1. Usuário navega para aba **Almoxarifado**
2. Toca no botão flutuante (+)
3. Sistema abre formulário de novo material
4. Usuário preenche: nome, categoria, quantidade, foto (opcional)
5. Toca em "Salvar"
6. Sistema adiciona ao inventário e retorna para lista

### Fluxo 3: Criar Novo Bloco
1. Usuário navega para aba **Blocos**
2. Toca no botão flutuante (+)
3. Sistema abre formulário de novo bloco
4. Usuário preenche: nome, responsável, descrição
5. Toca em "Salvar"
6. Sistema cria o bloco e retorna para lista

### Fluxo 4: Visualizar Estatísticas
1. Usuário navega para aba **Relatórios**
2. Visualiza gráficos e estatísticas consolidadas
3. Pode aplicar filtros por período ou bloco
4. Sistema atualiza visualizações em tempo real

## Componentes de Interface

### Cards
Utilizados para exibir informações resumidas de blocos, materiais, ensaios. Design com bordas arredondadas, sombra sutil, e espaçamento adequado.

### Botões
- **Primários**: Fundo laranja, texto branco, bordas arredondadas
- **Secundários**: Fundo transparente, borda laranja, texto laranja
- **Flutuantes**: Ícone (+), posicionado no canto inferior direito

### Listas
Utilizadas para exibir múltiplos itens. Cada item é um card tocável com informações resumidas e ícone indicativo.

### Formulários
Campos de entrada com labels claros, validação em tempo real, e feedback visual para erros.

### Navegação
Tab bar na parte inferior com 5 tabs principais: Home, Blocos, Ensaios, Almoxarifado, Relatórios.

## Acessibilidade

- Tamanho mínimo de toque: 44x44 pontos
- Contraste adequado entre texto e fundo
- Suporte a VoiceOver (iOS) e TalkBack (Android)
- Texto escalável conforme preferências do sistema
- Indicadores visuais claros para estados de interação

## Responsividade

O aplicativo é otimizado para dispositivos móveis em orientação retrato. Suporta diferentes tamanhos de tela (iPhone SE até iPhone Pro Max, e tablets).
