---
name: sheet-cake
description: "Write every ticket of a spec at once, as one set of cupcakes planned together."
disable-model-invocation: true
argument-hint: "[spec path, issue or feature]"
---

You have been provided a spec: $ARGUMENTS. Write every ticket it needs in one sitting, as one **set** of cupcakes planned together, so the tickets divide the spec with no gaps or overlaps, and each blocking edge is one that gates.

When the spec's feature already has an open ticket, report its number and stop: a set is written whole, so tickets written before it, or left unbuilt, are the user's to settle.

Call the Skill tool with `cupcake` for its definitions: a cupcake, the ticket's shape and the promises file. Follow this skill's steps in place of its own; this skill writes the whole set where `cupcake` writes one.

Nothing is built while the set is written, so each ticket learns only from the code and the spec. `/bake` brings each one up to date with what its blockers built, right before building it.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Steps

1. **Read the spec and the code it changes.** Check against the repo every fact the spec states about it: settings and permission rules (`~/.claude/settings.json`, the repo's `.claude/settings.json`), ADRs and their status, scripts, counts and file lists. Done when you can say, for each area the spec changes, what is there today and how big it is, and you have listed each fact the repo contradicts.

2. **Mark the promises.** Write the promises file, each promise marked from the code as `cupcake` marks it. Done when every promise in the spec has a line.

3. **Draft the set.** Order the unmet promises into cupcakes, each picked as `cupcake`'s step 3 picks one: the first is the most important need at its smallest useful size, and each later ticket is the next step from the set before it, cupcake to cake to wedding cake. Give each ticket its blocking edges: the tickets it builds on, and only those.

   A **wide refactor**, one change whose blast radius no fresh context window holds, runs **expand–contract**: a ticket adds the new form beside the old, batch tickets move callers over a part at a time, each keeping the suite green, and a last ticket deletes the old form. Each batch is a step, since the next ticket's author builds on a green, tested part. Done when every unmet promise belongs to a ticket in the set.

4. **Check the set whole.**
   - **Gaps:** every unmet promise names a ticket.
   - **Overlaps:** each promise belongs to one ticket; a promise split across tickets says which part each takes.
   - **Edges:** each blocker gates the work, so tickets on separate areas run side by side.
   - **Size:** each ticket fits one fresh context window, as `cupcake`'s step 3 measures it.
   - **Useful on its own:** each ticket gives someone something the day it lands; a layer only a later ticket uses joins that ticket, unless it is the expand or a batch of a wide refactor.

   Done when every ticket passes all five, redrafting the set wherever one failed.

5. **Offer the set.** A numbered list of title, blocked by, and one sentence of behaviour a user could check. Then each contradicted fact, and each spec problem the drafting found, as a question of its own. Ask whether the granularity and the edges are right. Done when the user has approved the set and chosen the spec edits.

6. **Publish.** Make the spec edits the user chose, and add the problems they left open to the spec's comments. Write each ticket in `cupcake`'s shape, numbered in dependency order, then mark each promise in the promises file with its ticket's number. Done when every ticket file matches the approved set, and the promises file agrees with it.

7. Name the next step: `/bake-spec`, which builds the set.
