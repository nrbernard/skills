---
name: bake
description: "Write a spec's next ticket with /cupcake, then build it. Use when building a spec one ticket at a time."
argument-hint: "[spec path, issue or feature]"
---

When the feature of the spec the user named ($ARGUMENTS) already has an open ticket, report its number and stop: a bake builds only the ticket its own cupcake writes, so tickets planned ahead of the build, or one an earlier bake left unbuilt, are the user's to settle.

Call the Skill tool with `cupcake` against that spec. If it writes no ticket, report the spec built and stop.

Implement the ticket it wrote.

Use /lettuce where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with `test-audit` on the ticket's diff and fix what it finds, then use /code-review to review the work.

Resolve the ticket the way the issue tracker closes work, unless it closes work through PRs.

Commit your work to the current branch.
