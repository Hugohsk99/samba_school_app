# Sprint 20 - Requisitos do Documento

## Painel do Presidente (Refatorado)
- Dashboard com cards: Total integrantes, segmentos ativos, presenças hoje, patrimônio total, pagamentos pendentes
- CRUD completo: Integrantes (incl. medidas/roupas), segmentos, materiais, ativos fixos, eventos
- Gestão usuários: Convites ligados a eventos, aprovação fluxos
- Visível para TODA diretoria (não só presidente)

## Nova Tela: Ativos Fixos (Patrimônio)
- Lista bens (carnavalescos, instrumentos, fantasias)
- CRUD completo com foto, valor, depreciação
- Filtro por status/escola
- Campos: id, escola_id, nome, descricao, valor, data_aquisicao, status (bom/ruim)

## Tabelas expandidas
- Integrantes: medidas_json (altura, peito, cintura, quadril), tamanho_roupa_json (camisa, calça, sapato)
- AtivosFixos: id, escola_id, nome, descricao, valor, data_aquisicao, status
- Escolas: ativos_fixo_json

## Dados de Exemplo
- Escola: Estácio (ID=1, editável/apagável)
- 5-10 integrantes exemplo com medidas corporais e tamanhos de roupa
- Usuários de teste:
  - Márcio Aurélio Pereira Dias / 123456Difininho
  - Teste master adm / 123456Master

## Funções por Role
- Presidente/Diretores: Painel completo + edição global
- Diretor Carnaval/Ala: Cadastro/editar materiais + presenças manuais
- Mestre: Presenças manuais + relatórios ala

## Fluxos a Revisar
- Presença: Manual (sem QR Code) - lista integrantes por segmento, toggle presente/data
- Convites: Tela ligada a eventos - gerar/enviar email/WhatsApp
