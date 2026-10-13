---
name: tickets
description: Print a table of every open ticket (neither done nor wontfix) with its number, name, status and open blockers.
disable-model-invocation: true
allowed-tools: Bash(node */tickets/status.mjs)
metadata:
  version: "0.1.0"
---

!`node ${CLAUDE_SKILL_DIR}/status.mjs`

Reply with the table above, verbatim, and nothing else. It is every ticket under `.scratch/<feature>/issues/` of the current directory, as `tickets.mjs` reads them.
