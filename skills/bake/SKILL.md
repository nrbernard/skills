---
name: bake
description: "Build a spec's next ticket: write it with /cupcake, then build it. Use when building a spec one ticket at a time."
argument-hint: "[spec path, issue or feature]"
---

Call the Skill tool with `cupcake` against the spec the user named: $ARGUMENTS. If it writes no ticket, report the spec built and stop.

Implement the ticket it wrote.

Use /lettuce where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Set the ticket's status to `done`, unless the issue tracker closes work through PRs.

Commit your work to the current branch.
