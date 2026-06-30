import { defineConfig } from '@adonisjs/transmit'

/**
 * Transmit powers the live board over server-sent events. A single-node
 * in-memory transport is enough for an MVP; swap in the Redis transport to run
 * the dashboard across multiple instances.
 */
export default defineConfig({
  // null transport keeps everything in-process (single node). Swap in the
  // Redis transport to fan SSE out across multiple dashboard instances.
  transport: null,
})
