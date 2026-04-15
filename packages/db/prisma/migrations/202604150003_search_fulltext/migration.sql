CREATE FULLTEXT INDEX `documents_title_summary_content_idx`
ON `documents`(`title`, `summary`, `content`);
