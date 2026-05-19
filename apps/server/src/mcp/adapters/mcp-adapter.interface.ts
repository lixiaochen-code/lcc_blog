/**
 * Vendor-neutral MCP-style adapter contract. Today only `HttpMcpAdapter`
 * implements it; tomorrow we can add WebSocket / stdio / official
 * `@modelcontextprotocol/sdk` clients without touching consumers.
 */

export interface McpToolDescriptor {
  name: string
  description?: string
  schema?: unknown
}

export interface McpAdapter {
  readonly name: string
  readonly type: 'http'

  /** No-op for stateless HTTP; meaningful for stateful transports. */
  connect(): Promise<void>

  /** Best-effort tool discovery (HTTP MCP usually returns a stub list). */
  listTools(): Promise<McpToolDescriptor[]>

  /**
   * Invoke a remote tool by name. Implementations should throw on
   * non-2xx and parse the JSON response themselves.
   */
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>
}
