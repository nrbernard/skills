---
name: bake
description: "Build a spec's tickets on one integration branch, a baker subagent per ticket, working the frontier of the task graph."
disable-model-invocation: true
argument-hint: "[spec path, issue or feature]"
---

You have been provided a spec: $ARGUMENTS. Its tickets, written together by `/sheet-cake`, are a **task graph**: each names the tickets that block it, so there is always a **frontier** of open tickets whose blockers are all done. When the spec's feature has no open ticket, tell the user to run `/sheet-cake`, and stop.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec built on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets were written before anything was built, so each **baker subagent** brings its ticket up to date with what has landed, right before building it. Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Baker subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec, its promises file and its tickets, to know the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration the tickets require - relevant codebase files or external documentation. Give it an agent type with the Write tool, such as `general-purpose` (`Explore` is read-only) - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **baker subagents** focus on building rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and its tickets.

4. Run a **baker subagent** for each frontier ticket, each in its own worktree on its own branch, claimed the way the issue tracker claims a ticket. Each baker subagent:
   - confirms its worktree is based on the integration branch tip before starting, and resets onto it if not;
   - reads its ticket against what has landed, and updates the ticket where a landed ticket changed what it needs;
   - calls the Skill tool with `lettuce` to build the ticket, signing off its own seams and test list where `lettuce` asks the user, and holding each test to `lettuce`'s owner rules;
   - runs typechecking and single test files as it goes, and the full test suite once at the end;
   - calls the Skill tool with `test-audit` on its diff, and fixes what it finds;
   - builds the spec as written, leaving its text unchanged, and names any spec change, from the ticket or the build, in its report for the user to decide;
   - merges the integration branch tip into its own branch, then reports done with the suite green.

5. Once a **baker subagent** completes, merge its work to the integration branch with a **merger subagent**, and resolve its ticket the way the issue tracker closes work, unless it closes work through PRs.

6. When a baker names a spec change, put it to the user. Make the edits they choose, and revise any open ticket the edit contradicts, before a baker starts on a ticket the edit touches. A baker that reports its ticket unbuilt, or the suite red, stops new bakers from starting: report it to the user.

7. If the merge changes the **frontier**, kick off more **baker subagents** on the new frontier tickets. This allows for maximum concurrency.

8. Once every ticket is done, call the Skill tool with `code-review` on the integration branch. Fix all issues raised by the code review in a single **baker subagent**.

9. If a draft PR exists, mark it ready for review. Otherwise, report the integration branch.

10. Clean up every **baker subagent**'s worktree.
