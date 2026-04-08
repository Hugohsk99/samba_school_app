CREATE TABLE `ativos_fixos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`escola_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`categoria_ativo` enum('carnavalescos','instrumentos','fantasias','alegorias','aderecos','equipamentos','moveis','outros') NOT NULL DEFAULT 'outros',
	`valor` decimal(12,2) NOT NULL DEFAULT '0.00',
	`valor_depreciado` decimal(12,2),
	`taxa_depreciacao_anual` decimal(5,2) DEFAULT '10.00',
	`data_aquisicao` timestamp,
	`data_ultima_manutencao` timestamp,
	`status_ativo` enum('bom','regular','ruim','manutencao','baixado') NOT NULL DEFAULT 'bom',
	`localizacao` varchar(255),
	`responsavel_id` int,
	`foto_url` text,
	`observacoes` text,
	`cadastrado_por` int,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`ativo` boolean NOT NULL DEFAULT true,
	CONSTRAINT `ativos_fixos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escola_usuario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`escola_id` int NOT NULL,
	`usuario_id` int NOT NULL,
	`role` enum('master','diretor_escola','diretor_carnaval','diretor_ala','diretor_segmento','integrante','pendente') NOT NULL DEFAULT 'integrante',
	`ativo` boolean NOT NULL DEFAULT true,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escola_usuario_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_escola_usuario` UNIQUE(`escola_id`,`usuario_id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `medidas_json` text;--> statement-breakpoint
ALTER TABLE `users` ADD `tamanho_roupa_json` text;