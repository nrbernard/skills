---
name: bake-spec
description: "Build a whole spec, one /bake per subagent, until nothing is left to build."
disable-model-invocation: true
argument-hint: "[spec path, issue or feature]"
---

You have been provided a spec: $ARGUMENTS. It has no task graph to work through. `cupcake` writes each ticket right before it is built, from what the last one taught, so the build is a sequence of **bakes**, one ticket each, and a ticket that doesn't exist yet can't be worked on in parallel.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec built on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

Each bake runs in a fresh **baker subagent**, so each ticket is written and built in a clean context window. Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

## Steps

1. Read the spec.

2. (optional) Use an **exploration subagent** to conduct any exploration the spec requires - relevant codebase files or external documentation. Give it an agent type with the Write tool, such as `general-purpose` (`Explore` is read-only) - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **baker subagents** focus on building rather than exploration.

3. Create the integration branch and check it out. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first bake in step 4 (a branch with no commits ahead of main can't open one), marked as closing the spec and its tickets.

4. Run one **baker subagent** on the integration branch, and wait for it. The baker subagent:
   - calls the Skill tool with `bake` against the spec;
   - takes `cupcake`'s first pick where it offers the choice, and builds the spec as written, leaving its text unchanged. Any spec change, whether `cupcake` finds it or the build does, it names in its report for the user to decide;
   - signs off its own seams and test list where `lettuce` asks the user, holding each test to `lettuce`'s owner rules;
   - reports the ticket it built, with the suite green, or that every promise of the spec is met.

5. When the baker names a spec change, put it to the user, and make the edits they choose before the next bake.

6. Repeat steps 4 and 5 until a baker reports every promise of the spec met. A baker that reports its ticket unbuilt, an open ticket it found, or the suite red, stops the loop: report it to the user.

7. Once the spec is built, call the Skill tool with `code-review` on the integration branch. Fix all issues raised by the code review in a single **baker subagent**, building with `lettuce` in place of `bake`.

8. If a draft PR exists, mark it ready for review. Otherwise, resolve each ticket the way the issue tracker closes work, and report the integration branch.
