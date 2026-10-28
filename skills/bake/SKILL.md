---
name: bake
description: "Build one ticket test-first with /lettuce. Use when a ticket is ready to build."
argument-hint: "[ticket path or issue]"
---

Build the ticket the user named: $ARGUMENTS.

Read the ticket whole, and the spec it points at. Tickets can be written before their blockers are built: bring the ticket up to date with what its done blockers built. When a blocker is still open, report it and stop.

Use /lettuce to build the ticket, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Build the spec as written, leaving its text unchanged. Name any spec change the ticket or the build turns up in your report, for the user to decide.

Once done, call the Skill tool with `test-audit` on the ticket's diff and fix what it finds, then use /code-review to review the work.

Resolve the ticket the way the issue tracker closes work, unless it closes work through PRs.

Commit your work to the current branch.
