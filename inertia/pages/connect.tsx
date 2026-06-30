import { type InertiaProps } from '~/types'

const CLAUDE_MD_SNIPPET = `## Agent status reporting (claude-dashboard MCP)

When the claude-dashboard MCP server is connected, keep the team dashboard in
sync. Reporting is opt-in and read-only on the dashboard's side: it only shows
what you choose to send.

- At the start of a session, call \`report_status\` with your current status and a
  short description of the task you are about to work on.
- Whenever your status or task changes (e.g. you start waiting on input, hit an
  error, or move to a new task), call \`report_status\` again.
- Use \`set_labels\` to tag the session with shared team labels.
- When the work is finished, call \`end_session\`.

Available tools: report_status, set_labels, end_session, list_labels,
list_team_agents.`

export default function Connect({
  mcpUrl,
  addCommand,
}: InertiaProps<{ mcpUrl: string; addCommand: string }>) {
  return (
    <div className="form-container">
      <div>
        <h1>Connect your CLI</h1>
        <p>
          Wire your Claude Code CLI to this dashboard so your team can see what your agents are
          working on. It is opt-in and read-only: the dashboard only observes the status your
          agents choose to report.
        </p>
      </div>

      <section>
        <h2>Step 1 — Add the MCP server</h2>
        <p>Run this in your terminal to register the dashboard as an MCP server:</p>
        <pre>
          <code>{addCommand}</code>
        </pre>
        <p>
          This points Claude Code at <code>{mcpUrl}</code> over streamable HTTP.
        </p>
      </section>

      <section>
        <h2>Step 2 — Authenticate</h2>
        <p>
          Inside Claude Code, run <code>/mcp</code> and authenticate the{' '}
          <strong>claude-dashboard</strong> server. This opens your browser to this dashboard,
          where you log in and approve access. Authorization uses OAuth, so your CLI receives a
          scoped token instead of your password.
        </p>
      </section>

      <section>
        <h2>Step 3 — Report status (opt-in)</h2>
        <p>
          Reporting is entirely opt-in and read-only. The dashboard never controls your agents or
          reads your code; it only displays the status an agent decides to send by calling the{' '}
          <code>report_status</code> tool. Nothing appears here until an agent reports.
        </p>
        <p>
          Add the snippet below to your project&apos;s <code>CLAUDE.md</code> so agents report at
          session start, whenever their status or task changes, and call <code>end_session</code>{' '}
          when they finish:
        </p>
        <pre>
          <code>{CLAUDE_MD_SNIPPET}</code>
        </pre>
        <p>
          Available MCP tools: <code>report_status</code>, <code>set_labels</code>,{' '}
          <code>end_session</code>, <code>list_labels</code>, <code>list_team_agents</code>.
        </p>
      </section>
    </div>
  )
}
