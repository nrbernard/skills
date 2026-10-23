---
name: bake-spec
description: "Implement the result of /to-spec and /to-tickets in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Agree the **test list**. Call the Skill tool with `lettuce`, and for every ticket write down its seams and planned tests the way `lettuce` asks, one line per test. Confirm the whole list with the user in one pass. **Implementer subagents** run in the background and can't ask the user, so this is the confirmation each one builds on.

4. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 6 (a branch with no commits ahead of main can't open one), marked as closing the spec and tickets.

5. Use **implementer subagents** to implement each ticket, each in its own worktree on its own branch, each given a pointer to its ticket's part of the agreed test list. Each implementer subagent:
   - confirms its worktree is based on the integration branch before starting, and resets onto it if not;
   - calls the Skill tool with `lettuce` to build the ticket, treating its part of the test list as the confirmed seams and tests;
   - writes the tests on that list, and names any further test it would add in its report, with its line, in place of writing it;
   - merges the integration branch tip into its own branch before reporting done

6. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent**.

7. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

8. Once all tickets are complete, call the Skill tool with `code-review` on the integration branch. When the implementers named further tests, put them to the user. Fix all issues raised by the code review, and add the tests the user approved, in a single **implementer subagent**.

9. If a draft PR exists, mark it ready for review. Otherwise, resolve each ticket the way the issue tracker closes work, and report the integration branch.

10. Clean up all **implementer subagent** worktrees.
