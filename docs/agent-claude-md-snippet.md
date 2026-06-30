# Recommended CLAUDE.md snippet for reporting agents

Add the block below to your project's `CLAUDE.md` (or your global
`~/.claude/CLAUDE.md`) once the `claude-dashboard` MCP server is connected. It tells
the agent to keep the team board current by calling the dashboard's MCP tools.

```md
## Team agent dashboard (claude-dashboard MCP server)

You are connected to the team's agents dashboard via the `claude-dashboard` MCP
server. Keep your status on the shared board current so teammates can see what you
are working on.

- Use a STABLE `sessionId` for the whole session — reuse the same value on every
  call (e.g. the project directory name plus a short random suffix). Never invent a
  new one mid-session.
- Call `report_status` when you START working, whenever you switch to a meaningfully
  different task, and whenever you become BLOCKED:
  - `status: "working"` while actively making changes (set `task` to a short, present
    -tense description of what you are doing).
  - `status: "waiting_input"` when you are blocked waiting on the human.
  - `status: "error"` when you are stuck on a failure you cannot resolve.
  - `status: "done"` when the requested work is complete.
- On the first `report_status` of a session, also pass `name`, `hostname`, and
  `project` so the card is identifiable.
- Use `list_labels` to discover your team's label keys, then `set_labels` (or the
  `labels` argument of `report_status`) to tag what kind of work this is. Unknown
  label keys are ignored — do not invent new ones.
- Use `list_team_agents` before starting overlapping work to avoid two agents
  stepping on the same area.
- Call `end_session` when the session is finished or you are shutting down, so your
  agent shows as `offline` instead of lingering as `working`.

Keep reports concise and truthful; the board is for human coordination, not logging.
```
