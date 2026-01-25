CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`escola_id` int,
	`acao` varchar(100) NOT NULL,
	`entidade` varchar(100) NOT NULL,
	`entidade_id` varchar(100),
	`detalhes` text,
	`ip` varchar(45),
	`user_agent` text,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `convites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`escola_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('master','presidente','diretor','coordenador','integrante','contribuinte') NOT NULL DEFAULT 'integrante',
	`codigo` varchar(64) NOT NULL,
	`criado_por` int NOT NULL,
	`usado_por` int,
	`expira_em` timestamp NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `convites_id` PRIMARY KEY(`id`),
	CONSTRAINT `convites_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `escolas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`logo_url` text,
	`cor_primaria` varchar(7) DEFAULT '#FF6B35',
	`cor_secundaria` varchar(7) DEFAULT '#1A1A1A',
	`plano` enum('gratuito','basico','premium','enterprise') NOT NULL DEFAULT 'gratuito',
	`plano_expira_em` timestamp,
	`limite_usuarios` int NOT NULL DEFAULT 50,
	`email` varchar(320),
	`telefone` varchar(20),
	`endereco` text,
	`cidade` varchar(100),
	`estado` varchar(2),
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`ativo` boolean NOT NULL DEFAULT true,
	CONSTRAINT `escolas_id` PRIMARY KEY(`id`),
	CONSTRAINT `escolas_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `permissoes_customizadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`permissao` varchar(100) NOT NULL,
	`valor` boolean NOT NULL DEFAULT true,
	`concedido_por` int NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissoes_customizadas_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_usuario_permissao` UNIQUE(`usuario_id`,`permissao`)
);
--> statement-breakpoint
CREATE TABLE `solicitacoes_acesso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`escola_id` int NOT NULL,
	`mensagem` text,
	`status` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`analisado_por` int,
	`analisado_em` timestamp,
	`motivo_rejeicao` text,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `solicitacoes_acesso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuario_blocos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`bloco_id` varchar(36) NOT NULL,
	`cargo` varchar(100),
	`responsavel` boolean NOT NULL DEFAULT false,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usuario_blocos_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_usuario_bloco` UNIQUE(`usuario_id`,`bloco_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('master','presidente','diretor','coordenador','integrante','contribuinte') NOT NULL DEFAULT 'integrante';--> statement-breakpoint
ALTER TABLE `users` ADD `google_id` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `apple_id` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `foto_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `escola_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD `status_usuario` enum('pendente','aprovado','rejeitado','suspenso') DEFAULT 'pendente' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `aprovado_por` int;--> statement-breakpoint
ALTER TABLE `users` ADD `aprovado_em` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `integrante_id` varchar(36);