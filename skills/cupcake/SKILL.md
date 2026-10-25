---
name: cupcake
description: Write the next ticket of a feature, the smallest step that makes it more useful than it is today. Use when a spec needs its next ticket.
argument-hint: "[spec path, issue or feature]"
metadata:
  version: "0.2.0"
---

Write the next ticket of the feature: $ARGUMENTS

A **cupcake** is the whole cake at its smallest useful size, filling and icing both, so the first taste is of the real thing. The feature grows cupcake to cake to wedding cake, one ticket per step. Each step is useful on its own, and complexity is added only where a landed step has shown the need. A tracer bullet is thin through every layer; a cupcake is whole at a smaller size.

One ticket is written at a time, right before it is built, so what the last one taught shapes this one and the spec can change between. A set of tickets planned ahead of the build cannot adapt; write one.

## Steps

1. **Find the spec and the feature.** The argument names a spec file, an issue, or a feature under `.scratch/`; with none, the spec is the one in the conversation. The feature is the spec's `.scratch/<feature>/` directory, made from the spec's name when there is none yet. Done when the whole spec is in context and the feature directory is known.

2. **Establish what stands.** Read every ticket of the feature, then the code, since a ticket says what was meant and the code says what is. Mark every promise in the spec as met, promised by an open ticket, or unmet. Note what building the done tickets taught that the spec now gets wrong or no longer needs. Done when every promise carries one of the three marks, each from the code. When every promise is met, report the spec built and write no ticket.

3. **Pick the cupcake.** Of the unmet promises, the most important need, at the smallest size that is useful on its own, as one sentence of behaviour a user could check.
   - **Useful on its own** means someone gets something from it the day it lands: a user, or the author of the next ticket, who now has a real thing to react to. A layer nobody can use yet is a part, and a part is not a step.
   - **Smallest** means the simpler form first: one case before the general one, a fixed value before a setting, the happy path before its edges, plain output before polished.
   - **Targeted complexity**: generality, configuration, speed and polish go where a landed ticket has shown the need, as a road is paved where the path is already worn.
   - It builds on an open ticket only by being blocked by it.

   Done when nothing can be cut from the sentence and leave it useful, and it fits one fresh context window.

4. **Offer the choice.** The cupcake first, then the one or two runners-up with why each lost, as options. Where step 2 found the spec wrong, whether to change it is a question of its own. Done when the user has chosen.

5. **Publish the ticket** where the repo's issue tracker config says, or as `.scratch/<feature>/issues/<NN>-<slug>.md`, numbered after the feature's highest, in the shape below. Make the spec edits the user chose. Done when the ticket file matches the decision, and every line of it agrees with the spec as it now stands.

```markdown
# <NN>: <Title>

**What to build:** the behaviour, from the user's side.

**Why this next:** the need it meets, and the complexity it leaves for a later ticket.

**Blocked by:** <NN> (<title>) for each open ticket it builds on, or None (can start immediately)

**Status:** ready-for-agent

- [ ] An acceptance criterion: false today, true when the ticket lands
```

The body names behaviour, which outlives file paths and snippets.
