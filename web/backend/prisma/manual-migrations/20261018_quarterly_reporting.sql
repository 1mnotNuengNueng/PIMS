CREATE TABLE IF NOT EXISTS `fiscal_year` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `year` INTEGER NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_year_year_key` (`year`),
  CONSTRAINT `fiscal_year_valid_dates` CHECK (`end_date` >= `start_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fiscal_period` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` INTEGER NOT NULL,
  `quarter` INTEGER NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `report_due_date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_period_fiscal_year_id_quarter_key` (`fiscal_year_id`, `quarter`),
  CONSTRAINT `fiscal_period_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fiscal_period_valid_quarter` CHECK (`quarter` BETWEEN 1 AND 4),
  CONSTRAINT `fiscal_period_valid_dates` CHECK (`end_date` >= `start_date`),
  CONSTRAINT `fiscal_period_valid_deadline` CHECK (`report_due_date` >= `end_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_quarterly_report` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `project_id` INTEGER NOT NULL,
  `fiscal_period_id` INTEGER NOT NULL,
  `results` TEXT NOT NULL,
  `kpi_results` TEXT NOT NULL,
  `budget_spent` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `progress_percent` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `problems` TEXT NULL,
  `next_steps` TEXT NULL,
  `status` ENUM('draft', 'submitted', 'approved', 'resubmit') NOT NULL DEFAULT 'draft',
  `reported_by` INTEGER NOT NULL,
  `submitted_at` DATETIME(0) NULL,
  `reviewed_by` INTEGER NULL,
  `reviewed_at` DATETIME(0) NULL,
  `review_comment` TEXT NULL,
  `is_demo` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_quarterly_report_project_id_fiscal_period_id_key` (`project_id`, `fiscal_period_id`),
  KEY `project_quarterly_report_fiscal_period_id_status_idx` (`fiscal_period_id`, `status`),
  KEY `project_quarterly_report_reported_by_idx` (`reported_by`),
  KEY `project_quarterly_report_reviewed_by_idx` (`reviewed_by`),
  CONSTRAINT `project_quarterly_report_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project_form` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `project_quarterly_report_fiscal_period_id_fkey` FOREIGN KEY (`fiscal_period_id`) REFERENCES `fiscal_period` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `project_quarterly_report_reported_by_fkey` FOREIGN KEY (`reported_by`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `project_quarterly_report_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `project_quarterly_report_valid_budget` CHECK (`budget_spent` >= 0),
  CONSTRAINT `project_quarterly_report_valid_progress` CHECK (`progress_percent` BETWEEN 0 AND 100)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
