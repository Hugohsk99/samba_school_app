# Guia de Homologação e Testes - Gestão Samba

Este documento fornece instruções detalhadas para testar e homologar o aplicativo **Gestão Samba** utilizando o Expo Go em dispositivos móveis reais.

## Sumário

1. [Visão Geral do Processo](#visão-geral-do-processo)
2. [Configuração do Ambiente de Testes](#configuração-do-ambiente-de-testes)
3. [Testando com Expo Go](#testando-com-expo-go)
4. [Checklist de Homologação](#checklist-de-homologação)
5. [Fluxos de Teste Detalhados](#fluxos-de-teste-detalhados)
6. [Resolução de Problemas](#resolução-de-problemas)
7. [Critérios de Aceitação](#critérios-de-aceitação)

---

## Visão Geral do Processo

O processo de homologação segue uma metodologia estruturada em **três fases principais**:

| Fase | Objetivo | Ferramentas |
|------|----------|-------------|
| **Desenvolvimento** | Implementar funcionalidades | VS Code, Terminal |
| **Testes** | Validar comportamento | Expo Go, Dispositivo Móvel |
| **Homologação** | Aprovar para produção | Checklist, Documentação |

O aplicativo utiliza **React Native com Expo SDK 54**, permitindo testes em tempo real através do Expo Go sem necessidade de compilação nativa.

---

## Configuração do Ambiente de Testes

### Pré-requisitos

Antes de iniciar os testes, certifique-se de ter:

1. **Smartphone** (iOS ou Android) com conexão à internet
2. **Expo Go** instalado no dispositivo
3. **Acesso à mesma rede** que o servidor de desenvolvimento (ou usar túnel)

### Instalando o Expo Go

| Plataforma | Link de Download |
|------------|------------------|
| **iOS** | [App Store](https://apps.apple.com/app/expo-go/id982107779) |
| **Android** | [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |

### Conectando ao Projeto

Existem **duas formas** de conectar seu dispositivo ao projeto:

#### Opção 1: QR Code (Recomendado)

1. Abra o painel **Preview** na interface do Manus
2. Localize o **QR Code** exibido
3. No Expo Go, toque em **"Scan QR Code"**
4. Aponte a câmera para o QR Code
5. O aplicativo será carregado automaticamente

#### Opção 2: URL Direta

Se o QR Code não funcionar, você pode usar a URL direta:

```
exps://8081-i5nqkoe10u6d2rp631pvd-a0d790ba.us1.manus.computer
```

1. Abra o Expo Go
2. Toque em **"Enter URL manually"**
3. Cole a URL acima
4. Toque em **"Connect"**

---

## Testando com Expo Go

### Funcionalidades de Desenvolvimento

Durante os testes, você tem acesso a recursos especiais:

| Gesto/Ação | Função |
|------------|--------|
| **Shake** (agitar o dispositivo) | Abre o menu de desenvolvedor |
| **Dois dedos + pressionar** | Abre inspetor de elementos |
| **Pull to refresh** | Recarrega o aplicativo |

### Hot Reload

O Expo Go suporta **Hot Reload**, o que significa que alterações no código são refletidas automaticamente no dispositivo sem necessidade de recarregar manualmente.

---

## Checklist de Homologação

### Funcionalidades Principais

Use este checklist para validar cada funcionalidade do aplicativo:

#### Navegação
- [ ] Tab bar exibe todos os 5 ícones corretamente
- [ ] Navegação entre tabs funciona sem travamentos
- [ ] Botão voltar funciona em todas as telas secundárias
- [ ] Transições de tela são suaves

#### Tela Home (Dashboard)
- [ ] Cards de estatísticas exibem números corretos
- [ ] Alertas são exibidos quando aplicável
- [ ] Botões de ação rápida navegam corretamente
- [ ] Lista de próximos ensaios é exibida
- [ ] Scroll funciona suavemente

#### Gestão de Blocos
- [ ] Lista de blocos é exibida corretamente
- [ ] Botão "+" abre formulário de novo bloco
- [ ] Formulário valida campos obrigatórios
- [ ] Seleção de cor funciona
- [ ] Bloco é salvo e aparece na lista
- [ ] Detalhes do bloco são exibidos ao tocar
- [ ] Edição de bloco funciona
- [ ] Exclusão de bloco com confirmação funciona
- [ ] Dados persistem após fechar e reabrir o app

#### Gestão de Ensaios
- [ ] Lista de ensaios é exibida
- [ ] Ensaios agendados e realizados são separados
- [ ] Botão "+" abre formulário de novo ensaio
- [ ] Seleção de blocos participantes funciona
- [ ] Ensaio é salvo corretamente

#### Registro de Presença
- [ ] Tela de presença abre ao tocar em ensaio
- [ ] Lista de integrantes é exibida
- [ ] Toggle de status funciona (presente/ausente/justificado)
- [ ] Estatísticas são atualizadas em tempo real
- [ ] Botão "Marcar todos presentes" funciona
- [ ] Presença é salva corretamente
- [ ] Dados persistem após fechar o app

#### Almoxarifado
- [ ] Lista de materiais é exibida
- [ ] Filtro por categoria funciona
- [ ] Status de falta/ok é exibido corretamente
- [ ] Barra de progresso reflete quantidade

#### Relatórios
- [ ] Estatísticas gerais são exibidas
- [ ] Gráficos de presença por bloco funcionam
- [ ] Inventário por categoria é exibido
- [ ] Alertas e recomendações são mostrados

### Testes de Persistência

- [ ] Criar um bloco, fechar o app, reabrir → bloco ainda existe
- [ ] Registrar presença, fechar o app, reabrir → presença salva
- [ ] Editar um bloco, fechar o app, reabrir → alterações mantidas

### Testes de Performance

- [ ] App abre em menos de 3 segundos
- [ ] Navegação entre telas é instantânea
- [ ] Scroll em listas longas é suave
- [ ] Não há travamentos ou crashes

### Testes de Interface

- [ ] Textos são legíveis em todos os tamanhos de tela
- [ ] Cores são consistentes com o tema
- [ ] Botões têm feedback visual ao tocar
- [ ] Formulários são fáceis de preencher
- [ ] Teclado não cobre campos de entrada

---

## Fluxos de Teste Detalhados

### Fluxo 1: Cadastro Completo de Bloco

**Objetivo:** Validar o ciclo completo de CRUD de blocos.

**Passos:**

1. Abra o aplicativo
2. Navegue para a tab **Blocos**
3. Toque no botão **+** (flutuante)
4. Preencha os campos:
   - Nome: "Bateria Teste"
   - Responsável: "João da Silva"
   - Descrição: "Bloco de teste"
5. Selecione uma cor
6. Toque em **Salvar**
7. Verifique se o bloco aparece na lista
8. Toque no bloco para ver detalhes
9. Toque em **Editar**
10. Altere o nome para "Bateria Teste Editado"
11. Salve
12. Verifique se o nome foi atualizado
13. Toque em **Excluir Bloco**
14. Confirme a exclusão
15. Verifique se o bloco foi removido da lista

**Resultado Esperado:** Todas as operações CRUD funcionam corretamente.

### Fluxo 2: Registro de Presença em Ensaio

**Objetivo:** Validar o fluxo completo de registro de presença.

**Passos:**

1. Navegue para a tab **Ensaios**
2. Toque em **Registrar Presença** em um ensaio agendado
3. Verifique se a lista de integrantes é exibida
4. Toque em alguns integrantes para alternar o status
5. Observe as estatísticas atualizando
6. Toque em **Marcar Todos como Presentes**
7. Toque em **Salvar**
8. Confirme a mensagem de sucesso
9. Volte para a lista de ensaios
10. Verifique se a taxa de presença é exibida

**Resultado Esperado:** Presença é registrada e estatísticas são atualizadas.

### Fluxo 3: Navegação Completa

**Objetivo:** Validar a navegação entre todas as telas.

**Passos:**

1. Inicie na tab **Home**
2. Toque em cada card de estatística
3. Volte para Home
4. Navegue para **Blocos** via tab bar
5. Navegue para **Ensaios** via tab bar
6. Navegue para **Almoxarifado** via tab bar
7. Navegue para **Relatórios** via tab bar
8. Volte para **Home**
9. Use os botões de ação rápida

**Resultado Esperado:** Navegação fluida sem travamentos.

---

## Resolução de Problemas

### Problema: QR Code não funciona

**Soluções:**
1. Verifique se o dispositivo está na mesma rede Wi-Fi
2. Tente usar a URL direta em vez do QR Code
3. Reinicie o Expo Go
4. Verifique se o servidor de desenvolvimento está rodando

### Problema: App não carrega

**Soluções:**
1. Feche completamente o Expo Go e reabra
2. Limpe o cache do Expo Go (shake → "Clear cache")
3. Verifique a conexão com a internet
4. Tente reconectar usando o QR Code

### Problema: Dados não persistem

**Soluções:**
1. Verifique se o AsyncStorage está funcionando
2. Não force o fechamento do app durante operações de salvamento
3. Aguarde a confirmação de salvamento antes de fechar

### Problema: Tela em branco

**Soluções:**
1. Shake o dispositivo para abrir o menu de desenvolvedor
2. Toque em "Reload"
3. Se persistir, feche e reabra o Expo Go

---

## Critérios de Aceitação

O aplicativo será considerado **homologado** quando:

| Critério | Requisito |
|----------|-----------|
| **Funcionalidade** | 100% das funcionalidades principais funcionando |
| **Persistência** | Dados são mantidos após fechar/reabrir o app |
| **Performance** | Tempo de carregamento < 3 segundos |
| **Estabilidade** | Zero crashes durante os testes |
| **Usabilidade** | Interface intuitiva e responsiva |

### Níveis de Severidade de Bugs

| Nível | Descrição | Ação |
|-------|-----------|------|
| **Crítico** | App não abre ou perde dados | Bloqueia homologação |
| **Alto** | Funcionalidade principal não funciona | Deve ser corrigido |
| **Médio** | Funcionalidade secundária com problemas | Pode ser adiado |
| **Baixo** | Problemas visuais menores | Backlog |

---

## Próximos Passos Após Homologação

Após a aprovação nos testes de homologação:

1. **Documentar resultados** dos testes
2. **Corrigir bugs** identificados (se houver)
3. **Preparar build de produção** (EAS Build)
4. **Publicar nas lojas** (App Store / Google Play)

---

## Contato e Suporte

Para dúvidas ou problemas durante o processo de homologação:

- Relate bugs encontrados com screenshots e passos para reproduzir
- Documente comportamentos inesperados
- Anote sugestões de melhoria

---

*Documento gerado em 24 de Janeiro de 2026*
*Versão do Aplicativo: 1.0.0*
*Expo SDK: 54*
