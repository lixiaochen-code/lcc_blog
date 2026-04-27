CREATE TABLE kb_roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE kb_permissions (
  code VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE kb_role_permissions (
  role_id VARCHAR(64) NOT NULL,
  permission_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (role_id, permission_code),
  CONSTRAINT fk_kb_role_permissions_role FOREIGN KEY (role_id) REFERENCES kb_roles (id),
  CONSTRAINT fk_kb_role_permissions_permission FOREIGN KEY (permission_code) REFERENCES kb_permissions (code)
);

CREATE TABLE kb_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  disabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE kb_user_roles (
  user_id VARCHAR(64) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_kb_user_roles_user FOREIGN KEY (user_id) REFERENCES kb_users (id),
  CONSTRAINT fk_kb_user_roles_role FOREIGN KEY (role_id) REFERENCES kb_roles (id)
);

CREATE TABLE kb_articles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  path VARCHAR(512) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  checksum VARCHAR(64) NOT NULL DEFAULT '',
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kb_articles_path (path)
);

CREATE TABLE kb_conversations (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kb_conversations_user FOREIGN KEY (user_id) REFERENCES kb_users (id)
);

CREATE TABLE kb_conversation_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(64) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content MEDIUMTEXT NOT NULL,
  draft_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kb_messages_conversation FOREIGN KEY (conversation_id) REFERENCES kb_conversations (id)
);

CREATE TABLE kb_mcp_servers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('http', 'local') NOT NULL DEFAULT 'http',
  endpoint VARCHAR(512) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  config_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE kb_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  detail_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kb_audit_actor_time (actor_id, created_at)
);

INSERT INTO kb_permissions (code, name, description) VALUES
('kb:view', '知识库查看', '查看知识库目录和文章'),
('kb:create', '新增文章', '新增 Markdown 文章'),
('kb:update', '编辑文章', '编辑 Markdown 文章'),
('kb:delete', '删除文章', '删除 Markdown 文章'),
('ai:use', '使用 AI', '打开 AI 面板并对话'),
('ai:write_kb', 'AI 写入知识库', '确认 AI 草稿并写入 Markdown'),
('mcp:configure', '配置 MCP', '配置网络检索和扩展 MCP'),
('user:create', '创建账号', '创建知识库账号'),
('user:update', '更新账号', '编辑账号、重置密码、禁用账号'),
('user:disable', '禁用账号', '禁用账号登录'),
('user:delete', '删除账号', '删除知识库账号'),
('role:assign', '分配角色', '管理角色与授权');

INSERT INTO kb_roles (id, name, description, is_system) VALUES
('r_super', '超管', '拥有知识库、AI、MCP、账号与角色管理全部权限', 1),
('r_editor', '编辑', '可查看、维护知识库并使用 AI 草稿', 0),
('r_reader', '只读', '只允许查看知识库', 0);

INSERT INTO kb_role_permissions (role_id, permission_code)
SELECT 'r_super', code FROM kb_permissions;

INSERT INTO kb_role_permissions (role_id, permission_code) VALUES
('r_editor', 'kb:view'),
('r_editor', 'kb:create'),
('r_editor', 'kb:update'),
('r_editor', 'kb:delete'),
('r_editor', 'ai:use'),
('r_editor', 'ai:write_kb'),
('r_reader', 'kb:view');
