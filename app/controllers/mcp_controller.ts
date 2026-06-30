import type { HttpContext } from '@adonisjs/core/http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { buildMcpServer } from '#services/mcp_server'

/**
 * The MCP endpoint. Each request gets a fresh, stateless Streamable-HTTP
 * transport bound to the authenticated developer (resolved by mcpAuth into
 * ctx.mcpUser). The transport writes directly to the raw Node response, so we
 * never touch ctx.response.* after handing it over.
 */
export default class McpController {
  async handle(ctx: HttpContext) {
    if (ctx.request.method() !== 'POST') {
      return ctx.response.status(405).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed' },
        id: null,
      })
    }

    try {
      const server = buildMcpServer(ctx.mcpUser)
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      })

      ctx.response.response.on('close', () => {
        transport.close()
        server.close()
      })

      await server.connect(transport)
      await transport.handleRequest(ctx.request.request, ctx.response.response, ctx.request.body())
    } catch {
      if (!ctx.response.response.headersSent) {
        return ctx.response.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        })
      }
    }
  }
}
