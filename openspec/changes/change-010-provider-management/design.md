# design

## Scope
实现 provider 管理后台与数据模型，不在此 change 中实现复杂计费、限流和高级路由策略。

## Data Model
- provider_configs

核心字段：
- provider_name
- protocol_type
- base_url
- api_key_encrypted
- model_json
- capability_json
- is_enabled
- is_default

## API
- GET `/api/providers`
- POST `/api/providers`
- GET `/api/providers/:id`
- PATCH `/api/providers/:id`
- POST `/api/providers/:id/enable`
- POST `/api/providers/:id/disable`
- POST `/api/providers/:id/set-default`

## UI
- `/admin/providers`
- provider 列表
- provider 新建/编辑表单
- 默认 provider 设置

## Security
- 仅 `super_admin` 可访问
- API key 与敏感凭据加密保存
- 返回列表时敏感字段做脱敏

## Decisions
- protocol_type 首版支持 `openai-compatible`、`anthropic`、`custom`
- model_json 可包含多个模型及能力描述
- 默认 provider 仅允许一个

## Risks
- 若 provider schema 设计过死，后续扩展成本高
- 需为不同协议预留适配层
