/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  labels: {
    index: typeof routes['labels.index']
    store: typeof routes['labels.store']
  }
  connect: {
    index: typeof routes['connect.index']
  }
  oauth: {
    protectedResourceMetadata: typeof routes['oauth.protected_resource_metadata']
    authorizationServerMetadata: typeof routes['oauth.authorization_server_metadata']
    register: typeof routes['oauth.register']
    authorize: typeof routes['oauth.authorize']
    approve: typeof routes['oauth.approve']
    token: typeof routes['oauth.token']
  }
  mcp: typeof routes['mcp']
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
}
