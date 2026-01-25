CREATE TABLE `notificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`escola_id` int,
	`tipo_notificacao` enum('solicitacao_acesso','usuario_aprovado','usuario_rejeitado','convite_enviado','convite_aceito','convite_expirando','material_pendente','evento_proximo','evento_criado','alerta_sistema','limite_usuarios','plano_expirando') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`mensagem` text NOT NULL,
	`dados` text,
	`acao_url` varchar(255),
	`acao_texto` varchar(100),
	`lida` boolean NOT NULL DEFAULT false,
	`lida_em` timestamp,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`expira_em` timestamp,
	CONSTRAINT `notificacoes_id` PRIMARY KEY(`id`)
);
