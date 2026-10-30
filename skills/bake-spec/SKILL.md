---
name: bake-spec
description: "Build a set of tickets on one integration branch, a /bake per ticket, working the frontier of the task graph."
disable-model-invocation: true
argument-hint: "[tickets, or a spec or feature]"
---

You have been provided tickets: $ARGUMENTS. A spec or feature named in their place stands for its open tickets. When there are none, tell the user to run `/sheet-cake`, and stop.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is every ticket built on a single **integration branch**, and resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed. A ticket blocked by an open ticket outside the set joins the frontier only once that ticket is done.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Baker subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the tickets and the spec they point at, to know the task graph.

2. Settle the frontier's **shared seams**: each function signature, type, URL value, module or migration number that two or more frontier tickets will change. Bakers running in parallel each give a shared seam their own shape, and the mergers are left to reconcile them. Run an **exploration subagent** to read the code those tickets touch and settle one shape per shared seam: its signature, its type, the module that owns it, its migration number. Give it an agent type with the Write tool, such as `general-purpose` (`Explore` is read-only). It saves its markdown notes in a directory outside the repo that every later subagent can read, along with any other exploration the tickets require, such as codebase files or external documentation. Done when every shared seam has one settled shape in the notes, and each baker's prompt in step 4 points to the shapes its ticket uses. With no shared seams, the exploration is optional; it lets **baker subagents** focus on building rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and its tickets.

4. Run a **baker subagent** for each frontier ticket, each in its own worktree on its own branch, claimed the way the issue tracker claims a ticket. Each baker subagent:
   - confirms its worktree is based on the integration branch tip before starting, and resets onto it if not;
   - calls the Skill tool with `bake` on its ticket, signing off its own seams and test list where `lettuce` asks the user. It skips `bake`'s `code-review` and its ticket's resolution, which this skill does for the whole branch;
   - merges the integration branch tip into its own branch, then reports done with the suite green, passing on any spec change `bake` named.

5. Once a **baker subagent** completes, merge its work to the integration branch with a **merger subagent**, and resolve its ticket the way the issue tracker closes work, unless it closes work through PRs.

6. When a baker names a spec change, put it to the user. Make the edits they choose, and revise any open ticket the edit contradicts, before a baker starts on a ticket the edit touches. A baker that reports its ticket unbuilt, or the suite red, stops new bakers from starting: report it to the user.

7. If the merge changes the **frontier**, settle the new frontier tickets' **shared seams** as in step 2, with each other and with bakers still running. Then kick off more **baker subagents** on them. This allows for maximum concurrency.

8. Once every ticket is done, call the Skill tool with `code-review` on the integration branch. Fix all issues raised by the code review in a single **baker subagent**, building with `lettuce`.

9. If a draft PR exists, mark it ready for review. Otherwise, report the integration branch.

10. Clean up every **baker subagent**'s worktree.
