---
name: bake
description: "Build one ticket test-first with /lettuce. Use when a ticket is ready to build."
argument-hint: "[ticket path or issue]"
---

Build the ticket the user named: $ARGUMENTS.

Read the ticket whole, and the spec it points at. Tickets can be written before their blockers are built: bring the ticket up to date with what its done blockers built. When a blocker is still open, report it and stop.

Use /lettuce to build the ticket. A seam the ticket names (a test layer, such as "tested in the application module") is agreed already; confirm with the user only the seams it doesn't name.

Run typechecking and single test files regularly. The full suite runs once, at the end: the commit is that run when the repo's commit hooks run the whole suite; otherwise run it before committing.

Build the spec as written, leaving its text unchanged. Name any spec change the ticket or the build turns up in your report, for the user to decide.

Once done, call the Skill tool with `test-audit` on the ticket's diff and fix what it finds, then call the Skill tool with `code-review` to review the work, passing in its arguments that each reviewer runs on Sonnet (`model: "sonnet"`), since they check work that is already written, and that the ticket is resolved after the review, so its open status is expected.

Resolve the ticket the way the issue tracker closes work, unless it closes work through PRs.

Commit once, when the ticket is done: one commit to the current branch holding the work, its tests, and its resolution when you resolve it here, made with the repo's commit hooks running. A hook can run the whole suite, so each extra commit costs a full run.
