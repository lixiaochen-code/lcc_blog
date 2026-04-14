CREATE TABLE `documents` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `summary` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `format` ENUM('md', 'mdx') NOT NULL DEFAULT 'mdx',
  `status` ENUM('draft', 'review', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `visibility` ENUM('public', 'internal', 'private') NOT NULL DEFAULT 'public',
  `source_type` ENUM('human', 'ai', 'import', 'sync') NOT NULL DEFAULT 'human',
  `created_by` VARCHAR(191) NOT NULL,
  `updated_by` VARCHAR(191) NOT NULL,
  `published_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `documents_slug_key`(`slug`)
);

CREATE TABLE `document_versions` (
  `id` VARCHAR(191) NOT NULL,
  `document_id` VARCHAR(191) NOT NULL,
  `version_no` INTEGER NOT NULL,
  `title_snapshot` VARCHAR(191) NOT NULL,
  `summary_snapshot` TEXT NOT NULL,
  `content_snapshot` LONGTEXT NOT NULL,
  `created_by` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `document_versions_document_id_version_no_key`(`document_id`, `version_no`),
  CONSTRAINT `document_versions_document_id_fkey`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
