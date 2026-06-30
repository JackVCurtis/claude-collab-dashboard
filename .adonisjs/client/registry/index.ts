/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'labels.index': {
    methods: ["GET","HEAD"],
    pattern: '/labels',
    tokens: [{"old":"/labels","type":0,"val":"labels","end":""}],
    types: placeholder as Registry['labels.index']['types'],
  },
  'labels.store': {
    methods: ["POST"],
    pattern: '/labels',
    tokens: [{"old":"/labels","type":0,"val":"labels","end":""}],
    types: placeholder as Registry['labels.store']['types'],
  },
  'connect.index': {
    methods: ["GET","HEAD"],
    pattern: '/connect',
    tokens: [{"old":"/connect","type":0,"val":"connect","end":""}],
    types: placeholder as Registry['connect.index']['types'],
  },
  'oauth.protected_resource_metadata': {
    methods: ["GET","HEAD"],
    pattern: '/.well-known/oauth-protected-resource',
    tokens: [{"old":"/.well-known/oauth-protected-resource","type":0,"val":".well-known","end":""},{"old":"/.well-known/oauth-protected-resource","type":0,"val":"oauth-protected-resource","end":""}],
    types: placeholder as Registry['oauth.protected_resource_metadata']['types'],
  },
  'oauth.authorization_server_metadata': {
    methods: ["GET","HEAD"],
    pattern: '/.well-known/oauth-authorization-server',
    tokens: [{"old":"/.well-known/oauth-authorization-server","type":0,"val":".well-known","end":""},{"old":"/.well-known/oauth-authorization-server","type":0,"val":"oauth-authorization-server","end":""}],
    types: placeholder as Registry['oauth.authorization_server_metadata']['types'],
  },
  'oauth.register': {
    methods: ["POST"],
    pattern: '/oauth/register',
    tokens: [{"old":"/oauth/register","type":0,"val":"oauth","end":""},{"old":"/oauth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['oauth.register']['types'],
  },
  'oauth.authorize': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/authorize',
    tokens: [{"old":"/oauth/authorize","type":0,"val":"oauth","end":""},{"old":"/oauth/authorize","type":0,"val":"authorize","end":""}],
    types: placeholder as Registry['oauth.authorize']['types'],
  },
  'oauth.approve': {
    methods: ["POST"],
    pattern: '/oauth/authorize',
    tokens: [{"old":"/oauth/authorize","type":0,"val":"oauth","end":""},{"old":"/oauth/authorize","type":0,"val":"authorize","end":""}],
    types: placeholder as Registry['oauth.approve']['types'],
  },
  'oauth.token': {
    methods: ["POST"],
    pattern: '/oauth/token',
    tokens: [{"old":"/oauth/token","type":0,"val":"oauth","end":""},{"old":"/oauth/token","type":0,"val":"token","end":""}],
    types: placeholder as Registry['oauth.token']['types'],
  },
  'mcp': {
    methods: ["GET","POST","DELETE"],
    pattern: '/mcp',
    tokens: [{"old":"/mcp","type":0,"val":"mcp","end":""}],
    types: placeholder as Registry['mcp']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'event_stream': {
    methods: ["GET","HEAD"],
    pattern: '/__transmit/events',
    tokens: [{"old":"/__transmit/events","type":0,"val":"__transmit","end":""},{"old":"/__transmit/events","type":0,"val":"events","end":""}],
    types: placeholder as Registry['event_stream']['types'],
  },
  'subscribe': {
    methods: ["POST"],
    pattern: '/__transmit/subscribe',
    tokens: [{"old":"/__transmit/subscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/subscribe","type":0,"val":"subscribe","end":""}],
    types: placeholder as Registry['subscribe']['types'],
  },
  'unsubscribe': {
    methods: ["POST"],
    pattern: '/__transmit/unsubscribe',
    tokens: [{"old":"/__transmit/unsubscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/unsubscribe","type":0,"val":"unsubscribe","end":""}],
    types: placeholder as Registry['unsubscribe']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
