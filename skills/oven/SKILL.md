---
name: oven
description: Print the work not yet merged into the main branch, across every branch and worktree, so nothing started is restarted by mistake. Lists each open spec with the branches working on it, each folder of tickets with no spec, and every other unmerged branch or worktree with uncommitted changes.
disable-model-invocation: true
# print.mjs imports oven.mjs, which the agent has no need to read.
allowed-tools: Bash(node */oven/print.mjs)
metadata:
  version: "0.1.0"
---

!`node ${CLAUDE_SKILL_DIR}/print.mjs`

Reply with the output above, verbatim, and nothing else.
