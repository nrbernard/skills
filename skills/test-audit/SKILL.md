---
name: test-audit
description: "Audit tests for duplicates, tests at the wrong layer, and tests that can't go red, keeping one owner test per regression. Use on the tests a diff adds, changes or leaves behind, before review, or to sweep a whole suite."
argument-hint: "[diff ref | sweep [paths]]"
---

An audit reads tests against the project's own testing rules and keeps, for each regression, the one **owner** test that goes red on it. Every other test of that regression is cut, and every cut names its **cover**: the owner that still catches it. Read the project's testing standards first (its coding standards' tests section, or the `lettuce` skill's Owners section where it has none). They decide which test owns a regression where two layers meet.

Read the tests rather than mutation-testing them: finding redundant tests needs every test that kills each mutant, which reruns most of the suite per mutant and takes hours.

## Verdicts

Each test, and each row of a table of cases, gets one:

- **KEEP**: the owner, or it catches a regression nothing else does.
- **DUPLICATE**: another test already goes red on the same regression. Name the cover, and whether to delete this one or fold what it adds into the cover.
- **WRONG-LAYER**: it re-asserts what another layer owns. Name what to trim, and the owner.
- **PROVES-NOTHING**: it can't go red: its expected value is recomputed the way the code computes it, it compares the code with itself, or it asserts about something removed.
- **REDUNDANT-CASE**: a row in the same equivalence class as another row, with no boundary of its own.
- **UNSURE**: say why. The user decides.

## Diff

`$ARGUMENTS` names a ref (or nothing: the branch's merge-base with the default branch).

1. Dispatch one subagent that didn't write the tests, with [auditor.md](auditor.md) as its brief and as its files: every test the diff adds or changes, plus every behaviour the diff removes (to find tests and assertions left checking it).
2. Hand each non-KEEP finding back to whoever is building, to fix before the work is reviewed and committed. Done when every finding is fixed or put to the user as UNSURE.

## Sweep

`$ARGUMENTS` is `sweep`, with paths to narrow it, such as the test files changed since the last sweep.

1. **Split by area.** Group the test files so each group is about 4,000 lines and a layer's files stay together: the core domain tests, its plain modules, its wrappers, its database suites, views, browser tests, tooling. List the groups with line counts.
2. **Audit in parallel.** Dispatch one subagent per group, in one message, each with [auditor.md](auditor.md) as its brief, writing its full table to `.scratch/test-audit/<group>.md` and replying with only the non-KEEP lines.
3. **Reconcile.** Auditors working alone produce **cycles**: each deletes its own copy of a regression citing the other's copy as cover, and applying both leaves it untested. Dispatch one subagent with [reconcile.md](reconcile.md) over every table. Done when it has written `.scratch/test-audit/final.md` with every cut's cover confirmed present and kept.
4. **Put the judgement calls to the user**, with background first: whole files removed, end-to-end and database suites trimmed, code the audit found unread, and every UNSURE. Use `ask-in-browser` where it's installed. Ask too whether to apply the rest of `final.md` as written, and whether to add tests for the gaps it lists.
5. **Apply** in the project's worktree for this work. Dispatch one subagent per group of files, in one message, each applying `final.md`'s entries for its files only. Only one of them runs the suites that share a database. Each keeps tables valid, removes a helper, import or empty `describe` its cuts leave unused, and moves or deletes large blocks by script. A test moved to a new home, or written for existing code, is shown red by breaking the code it guards, then the code restored.
6. **Check and commit.** Run the full suite, lint and typecheck, then commit the cuts as one commit. Gap tests, each in the test that owns its behaviour and each shown red, go in a second commit.
7. Ask the user whether to delete `.scratch/test-audit/` or keep it.
