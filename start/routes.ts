/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import BoardController from '#controllers/board_controller'
import LabelsController from '#controllers/labels_controller'
import ConnectController from '#controllers/connect_controller'
import OauthController from '#controllers/oauth_controller'
import McpController from '#controllers/mcp_controller'

router.get('/', [BoardController, 'index']).as('home').use(middleware.auth())

router
  .group(() => {
    router.get('/labels', [LabelsController, 'index'])
    router.post('/labels', [LabelsController, 'store'])
    router.get('/connect', [ConnectController, 'index'])
  })
  .use(middleware.auth())

/**
 * OAuth 2.1 authorization server endpoints. No session middleware gate: the
 * authorize/approve handlers resolve ctx.currentUser themselves and bounce to
 * /login when absent; the rest are public discovery/registration/token routes.
 */
router.get('/.well-known/oauth-protected-resource', [OauthController, 'protectedResourceMetadata'])
router.get('/.well-known/oauth-authorization-server', [OauthController, 'authorizationServerMetadata'])
router.post('/oauth/register', [OauthController, 'register'])
router.get('/oauth/authorize', [OauthController, 'authorize'])
router.post('/oauth/authorize', [OauthController, 'approve'])
router.post('/oauth/token', [OauthController, 'token'])

/**
 * MCP Streamable-HTTP endpoint, guarded by OAuth bearer tokens (mcpAuth), not
 * sessions. All three verbs share one handler; non-POST returns JSON-RPC 405.
 */
router.route('/mcp', ['GET', 'POST', 'DELETE'], [McpController, 'handle']).use(middleware.mcpAuth())

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

/**
 * Server-sent events for the live board. Only authenticated dashboard users
 * may subscribe to channels.
 */
transmit.registerRoutes((route) => {
  route.use(middleware.auth())
})
