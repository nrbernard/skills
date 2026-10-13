---
name: tickets
description: Print a table of every open ticket (neither done nor wontfix) with its number, name, status and open blockers.
disable-model-invocation: true
# status.mjs imports tickets.mjs, which the agent has no need to read.
allowed-tools: Bash(node */tickets/status.mjs)
metadata:
  version: "0.1.1"
---

!`node ${CLAUDE_SKILL_DIR}/status.mjs`

Reply with the output above, verbatim, and nothing else.
