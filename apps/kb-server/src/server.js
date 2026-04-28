import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import { createToken, randomPassword, verifyPassword, verifyToken, hashPassword } from './auth.js'
import { JsonStore, permissions } from './store.js'
import {
  deleteArticle,
  listTree,
  readArticle,
  relativeKnowledgeRoot,
  writeArticle,
} from './markdown.js'
import { createAiReply, streamAiReply } from './ai.js'
import { webSearch } from './mcp.js'

const store = new JsonStore()

const json = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  })
  res.end(JSON.stringify(data))
}

const sse = (res, event, data) => {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

const readBody = req =>
  new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 2 * 1024 * 1024) reject(new Error('请求体过大'))
    })
    req.on('end', () => resolve(body ? JSON.parse(body) : {}))
    req.on('error', reject)
  })

const getUserContext = req => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const payload = verifyToken(token)
  if (!payload) return null
  const data = store.read()
  const user = data.users.find(item => item.id === payload.sub)
  if (!user || user.disabled) return null
  const roles = data.roles.filter(role => user.roleIds.includes(role.id))
  const permissionSet = new Set(roles.flatMap(role => role.permissions))
  return {
    user: { id: user.id, username: user.username, disabled: user.disabled, roleIds: user.roleIds },
    roles,
    permissions: [...permissionSet],
  }
}

const requireAuth = req => {
  const ctx = getUserContext(req)
  if (!ctx) {
    const err = new Error('请先登录')
    err.status = 401
    throw err
  }
  return ctx
}

const requirePermission = (req, permission) => {
  const ctx = requireAuth(req)
  if (!ctx.permissions.includes(permission)) {
    const err = new Error(`缺少权限：${permission}`)
    err.status = 403
    throw err
  }
  return ctx
}

const audit = (actorId, action, detail) => {
  store.mutate(data => {
    data.auditLogs.unshift({
      id: randomUUID(),
      actorId,
      action,
      detail,
      createdAt: new Date().toISOString(),
    })
    data.auditLogs = data.auditLogs.slice(0, 500)
  })
}

async function route(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname

  if (req.method === 'GET' && path === '/api/health') {
    return json(res, 200, { ok: true, knowledgeRoot: relativeKnowledgeRoot() })
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    const body = await readBody(req)
    const data = store.read()
    const user = data.users.find(item => item.username === body.username)
    if (!user || user.disabled || !verifyPassword(body.password, user.passwordHash)) {
      return json(res, 401, { message: '账号或密码错误' })
    }
    const token = createToken({ sub: user.id, username: user.username })
    return json(res, 200, {
      token,
      user: getUserContext({ headers: { authorization: `Bearer ${token}` } }),
    })
  }

  if (req.method === 'GET' && path === '/api/auth/me') {
    return json(res, 200, getUserContext(req))
  }

  if (req.method === 'GET' && path === '/api/permissions') {
    requireAuth(req)
    return json(res, 200, { permissions })
  }

  if (req.method === 'GET' && path === '/api/kb/tree') {
    requirePermission(req, 'kb:view')
    return json(res, 200, { items: listTree() })
  }

  if (req.method === 'GET' && path === '/api/kb/article') {
    requirePermission(req, 'kb:view')
    return json(res, 200, readArticle(url.searchParams.get('path')))
  }

  if (req.method === 'POST' && path === '/api/kb/article') {
    const ctx = requirePermission(req, 'kb:create')
    const body = await readBody(req)
    const article = writeArticle(body.path, body.content)
    audit(ctx.user.id, 'kb:create', { path: article.path })
    return json(res, 200, article)
  }

  if (req.method === 'PUT' && path === '/api/kb/article') {
    const ctx = requirePermission(req, 'kb:update')
    const body = await readBody(req)
    const article = writeArticle(body.path, body.content)
    audit(ctx.user.id, 'kb:update', { path: article.path })
    return json(res, 200, article)
  }

  if (req.method === 'DELETE' && path === '/api/kb/article') {
    const ctx = requirePermission(req, 'kb:delete')
    const result = deleteArticle(url.searchParams.get('path'))
    audit(ctx.user.id, 'kb:delete', result)
    return json(res, 200, result)
  }

  if (req.method === 'POST' && path === '/api/ai/chat') {
    const ctx = requirePermission(req, 'ai:use')
    const body = await readBody(req)
    const reply = await createAiReply(body)
    const conversationId = body.conversationId || randomUUID()
    store.mutate(data => {
      let conversation = data.conversations.find(item => item.id === conversationId)
      if (!conversation) {
        conversation = {
          id: conversationId,
          userId: ctx.user.id,
          title: body.message.slice(0, 30),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        data.conversations.unshift(conversation)
      }
      conversation.messages.push({
        role: 'user',
        content: body.message,
        createdAt: new Date().toISOString(),
      })
      conversation.messages.push({
        role: 'assistant',
        content: reply.content,
        draft: reply.draft,
        createdAt: new Date().toISOString(),
      })
      conversation.updatedAt = new Date().toISOString()
    })
    return json(res, 200, { conversationId, ...reply })
  }

  if (req.method === 'POST' && path === '/api/ai/chat/stream') {
    const ctx = requirePermission(req, 'ai:use')
    const body = await readBody(req)
    const conversationId = body.conversationId || randomUUID()
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    })
    sse(res, 'meta', { conversationId })

    try {
      await streamAiReply(body, {
        onTool: tool => sse(res, 'tool', tool),
        onReasoning: reasoning => sse(res, 'reasoning', { reasoning }),
        onDelta: delta => sse(res, 'delta', { delta }),
        onDone: reply => {
          store.mutate(data => {
            let conversation = data.conversations.find(item => item.id === conversationId)
            if (!conversation) {
              conversation = {
                id: conversationId,
                userId: ctx.user.id,
                title: body.message.slice(0, 30),
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              data.conversations.unshift(conversation)
            }
            conversation.messages.push({
              role: 'user',
              content: body.message,
              createdAt: new Date().toISOString(),
            })
            conversation.messages.push({
              role: 'assistant',
              content: reply.content,
              reasoning: reply.reasoning,
              draft: reply.draft,
              sources: reply.sources,
              createdAt: new Date().toISOString(),
            })
            conversation.updatedAt = new Date().toISOString()
          })
          sse(res, 'done', { conversationId, ...reply })
        },
      })
    } catch (error) {
      sse(res, 'error', { message: error.message || 'AI 流式响应失败' })
    } finally {
      res.end()
    }
    return
  }

  if (req.method === 'GET' && path === '/api/ai/conversations') {
    const ctx = requirePermission(req, 'ai:use')
    const data = store.read()
    return json(res, 200, { items: data.conversations.filter(item => item.userId === ctx.user.id) })
  }

  if (req.method === 'POST' && path === '/api/mcp/search') {
    requirePermission(req, 'ai:use')
    const body = await readBody(req)
    return json(res, 200, await webSearch(body.query || ''))
  }

  if (req.method === 'POST' && path === '/api/ai/apply') {
    const ctx = requirePermission(req, 'ai:write_kb')
    const body = await readBody(req)
    const draft = body.draft || {}
    if (draft.operation === 'delete') {
      requirePermission(req, 'kb:delete')
      const result = deleteArticle(draft.path)
      audit(ctx.user.id, 'ai:delete', result)
      return json(res, 200, result)
    }
    requirePermission(req, draft.operation === 'create' ? 'kb:create' : 'kb:update')
    const article = writeArticle(draft.path, draft.content)
    audit(ctx.user.id, `ai:${draft.operation || 'write'}`, { path: article.path })
    return json(res, 200, article)
  }

  if (req.method === 'GET' && path === '/api/admin/roles') {
    requirePermission(req, 'role:assign')
    return json(res, 200, { items: store.read().roles })
  }

  if (req.method === 'PUT' && path === '/api/admin/roles') {
    const ctx = requirePermission(req, 'role:assign')
    const body = await readBody(req)
    const role = store.mutate(data => {
      let item = data.roles.find(role => role.id === body.id)
      if (!item) {
        item = { id: randomUUID(), createdAt: new Date().toISOString(), system: false }
        data.roles.push(item)
      }
      Object.assign(item, {
        name: body.name,
        description: body.description || '',
        permissions: body.permissions || [],
        updatedAt: new Date().toISOString(),
      })
      return item
    })
    audit(ctx.user.id, 'role:save', { roleId: role.id })
    return json(res, 200, role)
  }

  if (req.method === 'GET' && path === '/api/admin/users') {
    requirePermission(req, 'user:update')
    const data = store.read()
    return json(res, 200, {
      items: data.users.map(({ passwordHash: _passwordHash, ...user }) => user),
    })
  }

  if (req.method === 'POST' && path === '/api/admin/users') {
    const ctx = requirePermission(req, 'user:create')
    const body = await readBody(req)
    const password = body.password || randomPassword()
    const user = store.mutate(data => {
      if (data.users.some(item => item.username === body.username)) {
        const err = new Error('账号已存在')
        err.status = 409
        throw err
      }
      const item = {
        id: randomUUID(),
        username: body.username,
        passwordHash: hashPassword(password),
        roleIds: body.roleIds || ['r_reader'],
        disabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      data.users.push(item)
      return item
    })
    audit(ctx.user.id, 'user:create', { userId: user.id })
    const { passwordHash: _passwordHash, ...safeUser } = user
    return json(res, 200, { user: safeUser, password })
  }

  if (req.method === 'PUT' && path === '/api/admin/users') {
    const ctx = requirePermission(req, 'user:update')
    const body = await readBody(req)
    const result = store.mutate(data => {
      const user = data.users.find(item => item.id === body.id)
      if (!user) {
        const err = new Error('账号不存在')
        err.status = 404
        throw err
      }
      if (body.resetPassword) {
        const password = randomPassword()
        user.passwordHash = hashPassword(password)
        user.updatedAt = new Date().toISOString()
        return { user, password }
      }
      user.roleIds = body.roleIds || user.roleIds
      user.disabled = Boolean(body.disabled)
      user.updatedAt = new Date().toISOString()
      return { user }
    })
    audit(ctx.user.id, 'user:update', { userId: result.user.id })
    const { passwordHash: _passwordHash, ...safeUser } = result.user
    return json(res, 200, { user: safeUser, password: result.password })
  }

  if (req.method === 'DELETE' && path === '/api/admin/users') {
    const ctx = requirePermission(req, 'user:delete')
    const id = url.searchParams.get('id')
    store.mutate(data => {
      data.users = data.users.filter(item => item.id !== id || item.id === ctx.user.id)
    })
    audit(ctx.user.id, 'user:delete', { userId: id })
    return json(res, 200, { id })
  }

  if (req.method === 'GET' && path === '/api/admin/mcp') {
    requirePermission(req, 'mcp:configure')
    return json(res, 200, { items: store.read().mcpServers })
  }

  if (req.method === 'PUT' && path === '/api/admin/mcp') {
    const ctx = requirePermission(req, 'mcp:configure')
    const body = await readBody(req)
    const server = store.mutate(data => {
      let item = data.mcpServers.find(item => item.id === body.id)
      if (!item) {
        item = { id: randomUUID(), createdAt: new Date().toISOString() }
        data.mcpServers.push(item)
      }
      Object.assign(item, body, { updatedAt: new Date().toISOString() })
      return item
    })
    audit(ctx.user.id, 'mcp:save', { mcpId: server.id })
    return json(res, 200, server)
  }

  return json(res, 404, { message: '接口不存在' })
}

http
  .createServer(async (req, res) => {
    try {
      await route(req, res)
    } catch (error) {
      json(res, error.status || 500, { message: error.message || '服务异常' })
    }
  })
  .listen(config.port, () => {
    console.log(`KB server listening on http://localhost:${config.port}`)
    console.log('Default superadmin: superadmin / Admin@123456')
  })
