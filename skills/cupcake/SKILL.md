---
name: cupcake
description: Write the next ticket of a feature, the smallest step that makes it more useful than it is today. Use when a spec needs its next ticket.
argument-hint: "[spec path, issue or feature]"
metadata:
  version: "0.3.0"
---

Write the next ticket of the feature: $ARGUMENTS

A **cupcake** is the whole cake at its smallest useful size, filling and icing both, so the first taste is of the real thing. The feature grows cupcake to cake to wedding cake, one ticket per step. Each step is useful on its own, and complexity is added only where a landed step has shown the need. A tracer bullet is thin through every layer; a cupcake is whole at a smaller size.

One ticket is written at a time, right before it is built, so what the last one taught shapes this one and the spec can change between. Where tickets were written ahead, the next one is brought up to date the same way, right before it is built.

The feature's **promises file**, `promises.md` in the feature directory, carries step 2's marks from one run to the next, so a run re-checks only what can have changed.

## Steps

1. **Find the spec and the feature.** The argument names a spec file, an issue, or a feature under `.scratch/`; with none, the spec is the one in the conversation. The feature is the spec's `.scratch/<feature>/` directory, made from the spec's name when there is none yet. Done when the whole spec, its comments included, is in context and the feature directory is known.

2. **Establish what stands.** Mark every promise in the spec as met, promised by an open ticket, the user's, or unmet, each mark from the code; a promise only the user can meet, such as a review or a step on a system the agent is kept out of, is the user's, and no ticket can meet it; a ticket says what was meant and the code says what is. Where the caller names notes on the code, read them in place of the code they cover.
   - With a promises file, start from its marks. Re-check from the code each promise marked unmet, and each marked with a ticket that is now done. Read those done tickets whole, for what building them taught. Read an open ticket whole only when the cupcake will build on it.
   - Without one, read every ticket of the feature and mark every promise.

   Note what building the done tickets taught that the spec now gets wrong or no longer needs. Done when every promise carries one of the four marks.
   - When every promise is met, report the spec **built**, update the promises file (step 6), and write no ticket.
   - When every unmet promise is promised by an open ticket, report the spec **covered**. The next ticket is the lowest-numbered open one whose blockers are all done: bring it up to date with what this step found, update the promises file, and name it as the ticket to build.

3. **Pick the cupcake.** Of the unmet promises, the most important need, at the smallest size that is useful on its own, as one sentence of behaviour a user could check.
   - **Useful on its own** means someone gets something from it the day it lands: a user, or the author of the next ticket, who now has a real thing to react to. A layer nobody can use yet is a part, and a part is not a step.
   - **Smallest** means the simpler form first: one case before the general one, a fixed value before a setting, the happy path before its edges, plain output before polished.
   - **Targeted complexity**: generality, configuration, speed and polish go where a landed ticket has shown the need, as a road is paved where the path is already worn.
   - It builds on an open ticket only by being blocked by it.

   Done when nothing can be cut from the sentence and leave it useful, and it fits one fresh context window: the code and tests it changes can be read in one sitting. Where a module's surface is too big for one sitting, the cupcake takes as much of it as fits, in areas that share tables, saves or tests.

4. **Offer the choice.** The cupcake first, then the one or two runners-up with why each lost, as options. Where step 2 found the spec wrong, whether to change it is a question of its own. Done when the user has chosen.

5. **Publish the ticket** where the repo's issue tracker config says, or as `.scratch/<feature>/issues/<NN>-<slug>.md`, numbered after the feature's highest, in the shape below. Make the spec edits the user chose, and add each spec problem they left open to the spec's comments, so the next run reads it there. Done when the ticket file matches the decision, and every line of it agrees with the spec as it now stands.

```markdown
# <NN>: <Title>

**What to build:** the behaviour, from the user's side.

**Why this next:** the need it meets, and the complexity it leaves for a later ticket.

**Blocked by:** <NN> (<title>) for each open ticket it builds on, or None (can start immediately)

Status: ready-for-agent

- [ ] An acceptance criterion: false today, true when the ticket lands
```

   The body names behaviour, which outlives file paths and snippets. Where the spec already says how, the ticket points at that section of the spec.

6. **Update the promises file.** One line per promise, in the spec's order, each with its mark: `met`, the number of the open ticket that promises it, `user`, or `unmet`. A promise that open tickets meet only in part is `unmet`, followed by the numbers of those tickets.

```markdown
# Promises: <spec title>

- Story 1, <a few words of it>: 03
- <Decision heading>, <a few words of it>: met
```

   Done when every promise in the spec has a line, and each line agrees with step 2's marks and the ticket just published.
