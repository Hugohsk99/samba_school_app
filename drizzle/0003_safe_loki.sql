ALTER TABLE `convites` MODIFY COLUMN `role` enum('master','diretor_escola','diretor_carnaval','diretor_ala','diretor_segmento','integrante','pendente') NOT NULL DEFAULT 'integrante';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('master','diretor_escola','diretor_carnaval','diretor_ala','diretor_segmento','integrante','pendente') NOT NULL DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `solicitacoes_acesso` ADD `comprovante_pix` text;--> statement-breakpoint
ALTER TABLE `solicitacoes_acesso` ADD `ala_pretendida` varchar(100);--> statement-breakpoint
ALTER TABLE `solicitacoes_acesso` ADD `segmento_pretendido` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `senha_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `ala_id` varchar(36);--> statement-breakpoint
ALTER TABLE `users` ADD `segmento_id` varchar(36);--> statement-breakpoint
ALTER TABLE `users` ADD `comprovante_pix` text;