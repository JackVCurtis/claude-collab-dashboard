import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class ConnectController {
  async index(ctx: HttpContext) {
    const base = env.get('APP_URL')
    const mcpUrl = `${base}/mcp`
    const addCommand = `claude mcp add --transport http claude-dashboard ${mcpUrl}`

    return ctx.inertia.render('connect', { mcpUrl, addCommand })
  }
}
