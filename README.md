# Claude Agents Dashboard

A live team board for Claude Code agents. Every developer's running agent sessions
report their status, current task, and labels to a shared dashboard, so a team can
see — at a glance and in real time — who is doing what across machines and projects.

## The gap it fills

Claude Code sessions are isolated: each runs on one developer's machine with no
shared visibility. When several people (or one person across several worktrees) run
agents in parallel, there is no single place to answer "what is everyone's agent
working on, and which ones are stuck waiting for input?" This dashboard gives a team
that shared, live view without requiring agents to expose anything beyond a small,
opt-in status report.

## Architecture

- **AdonisJS 6 + Inertia + React 19** — server-rendered dashboard pages, session-cookie
  auth for browser users.
- **Prisma 6 / Postgres** — Team, User, Label, Agent, StatusEvent, plus OAuth tables.
- **@adonisjs/transmit (SSE)** — the board subscribes to `team/<teamId>/agents` and
  live-reloads whenever an agent reports.
- **Model Context Protocol (MCP) endpoint** at `/mcp` — a stateless Streamable-HTTP
  server. Agents connect to it as an MCP tool server and call the reporting tools.
- **OAuth 2.1 + PKCE authorization server** — the dashboard is its own auth server.
  A developer's Claude CLI dynamically registers as a public client, the developer
  approves it once through the browser consent screen, and the CLI receives a bearer
  token scoped to that developer. The MCP endpoint accepts only these tokens.

```
Claude CLI ──MCP (Bearer token)──▶ /mcp ──▶ Prisma ──▶ Postgres
                                              │
                                              └─ transmit.broadcast ──▶ SSE ──▶ Board (browser)
```

### Auth model

- **Dashboard (browser):** hand-rolled session auth (`app/services/auth.ts`). `auth`
  named middleware redirects to `/login`; `guest` bounces logged-in users away.
- **MCP endpoint:** OAuth 2.1 Bearer tokens only (`mcpAuth` middleware). No sessions.
  Tokens are stored as SHA-256 hashes; the raw token is shown to the CLI exactly once.
- The OAuth `authorize` flow reuses the dashboard session to identify the approving
  developer. If they are not logged in, the authorize request is stashed
  (`oauth_return`) and resumed after login.

## Setup

Requirements: Node 20+, Docker.

```bash
docker compose up -d            # Postgres on host port 5433
npx prisma migrate dev          # apply schema
node ace db:seed                # seed demo team + users
npm run dev                     # dev server on http://localhost:3333
```

### Login credentials (seeded)

| email            | password   |
| ---------------- | ---------- |
| alice@demo.test  | `password` |
| bob@demo.test    | `password` |

Both belong to team **demo**.

## Connecting an agent

1. Log into the dashboard and open **/connect**.
2. Register the MCP server with your Claude CLI:

   ```bash
   claude mcp add --transport http claude-dashboard http://localhost:3333/mcp
   ```

3. The first call triggers the OAuth flow: the CLI registers itself, opens the
   consent page in your browser, you click **Approve**, and the CLI stores the bearer
   token. From then on the agent reports automatically.
4. Add the snippet from [`docs/agent-claude-md-snippet.md`](docs/agent-claude-md-snippet.md)
   to your project (or global) `CLAUDE.md` so the agent reports status proactively.

## MCP tools

| Tool               | Purpose                                                              |
| ------------------ | ------------------------------------------------------------------- |
| `report_status`    | Create/update this session's agent with status, task, and labels.   |
| `set_labels`       | Replace the labels on this session's agent with team label keys.    |
| `end_session`      | Mark this session's agent as `offline`.                             |
| `list_labels`      | List the labels defined for your team.                              |
| `list_team_agents` | List every agent reporting in your team (who is doing what).        |

Statuses: `idle`, `working`, `waiting_input`, `error`, `done`, `offline`.

## Security notes

- **Read-only and opt-in.** The MCP server only lets an agent report its own status
  and read team labels/agents. It exposes no filesystem, shell, or code access.
- **Per-developer scoping.** Every write is scoped to the token's user/team. The only
  client-supplied identifier is `sessionId`, always combined with the authenticated
  `userId` via the `(userId, sessionId)` unique key — an agent can never write to
  another developer's or team's records.
- **PKCE-protected public clients.** Auth codes are single-use, short-lived, and bound
  to an S256 PKCE challenge and the client's registered redirect URI.
- **No raw tokens at rest.** Access tokens and (none here) secrets are stored only as
  hashes.
- The `/mcp`, `/oauth/register`, `/oauth/token`, and `/oauth/authorize` routes are
  CSRF-exempt by design (machine clients / the consent form post no CSRF token);
  every other state-changing route is CSRF-protected.
