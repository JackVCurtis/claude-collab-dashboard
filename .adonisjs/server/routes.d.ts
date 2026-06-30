import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'labels.index': { paramsTuple?: []; params?: {} }
    'labels.store': { paramsTuple?: []; params?: {} }
    'connect.index': { paramsTuple?: []; params?: {} }
    'oauth.protected_resource_metadata': { paramsTuple?: []; params?: {} }
    'oauth.authorization_server_metadata': { paramsTuple?: []; params?: {} }
    'oauth.register': { paramsTuple?: []; params?: {} }
    'oauth.authorize': { paramsTuple?: []; params?: {} }
    'oauth.approve': { paramsTuple?: []; params?: {} }
    'oauth.token': { paramsTuple?: []; params?: {} }
    'mcp': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'labels.index': { paramsTuple?: []; params?: {} }
    'connect.index': { paramsTuple?: []; params?: {} }
    'oauth.protected_resource_metadata': { paramsTuple?: []; params?: {} }
    'oauth.authorization_server_metadata': { paramsTuple?: []; params?: {} }
    'oauth.authorize': { paramsTuple?: []; params?: {} }
    'mcp': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'labels.index': { paramsTuple?: []; params?: {} }
    'connect.index': { paramsTuple?: []; params?: {} }
    'oauth.protected_resource_metadata': { paramsTuple?: []; params?: {} }
    'oauth.authorization_server_metadata': { paramsTuple?: []; params?: {} }
    'oauth.authorize': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'labels.store': { paramsTuple?: []; params?: {} }
    'oauth.register': { paramsTuple?: []; params?: {} }
    'oauth.approve': { paramsTuple?: []; params?: {} }
    'oauth.token': { paramsTuple?: []; params?: {} }
    'mcp': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'mcp': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}