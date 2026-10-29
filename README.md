# skills

Agent skills, one folder each under `skills/`.

| Skill | What it does |
| --- | --- |
| [`ask-in-browser`](skills/ask-in-browser/SKILL.md) | Asks every grilling round, and any other question that is a choice between options, as a browser form in place of chat, with the recommended answers preselected. Needs Node and macOS (`open`). |
| [`bake`](skills/bake/SKILL.md) | A fork of Matt Pocock's [`implement`](https://github.com/mattpocock/skills) skill (MIT): `/bake [ticket]` builds one ticket. It brings the ticket up to date with what its blockers built, builds it test-first with `/lettuce`, audits its tests with `/test-audit` and reviews the work with `/code-review`. Spec changes it turns up are put to you. Needs `lettuce`, `test-audit` and `code-review` installed. |
| [`bake-spec`](skills/bake-spec/SKILL.md) | A fork of Matt Pocock's [`implement-spec`](https://github.com/mattpocock/skills) skill (MIT): `/bake-spec [tickets]` builds a set of tickets, such as the ones `/sheet-cake` wrote, on one integration branch: a `/bake` per frontier ticket, each in its own worktree, in parallel where the blockers allow. The branch is reviewed with `/code-review` once at the end. Spec changes a bake turns up are put to you. Needs `bake` installed. |
| [`cupcake`](skills/cupcake/SKILL.md) | `/cupcake [spec]` writes the next ticket of a feature: the smallest step that makes it more useful than it is today, judged from what is already built. Keeps a promises file beside the spec marking each promise met, the user's, unmet, or the ticket that promises it, so the next run re-checks only what can have changed. Writes the ticket format `tickets` reads. |
| [`sheet-cake`](skills/sheet-cake/SKILL.md) | `/sheet-cake [spec]` writes every ticket of a spec at once, as one set of cupcakes planned together: it checks the spec's facts against the repo, drafts the set, checks it whole for gaps, overlaps, blockers that don't gate and tickets too big for one context window, runs a wide refactor as expand–contract, and puts the set and the spec's problems to you before publishing. Refuses when the feature already has an open ticket. Needs `cupcake` installed. |
| [`lettuce`](skills/lettuce/SKILL.md) | A fork of Matt Pocock's [`tdd`](https://github.com/mattpocock/skills) skill (MIT): test-driven development as the red → green → refactor loop, one vertical slice at a time, with tests only at seams agreed with the user, each test listed with the regression only it catches and where its owner was searched for, one owner test per behaviour, and a test green on its first run treated as a finding. Tests are sociable, with the outside world Nulled through the `nullables` skill, which it needs installed. |
| [`next-page-layers`](skills/next-page-layers/SKILL.md) | The container/presentational split for Next.js App Router pages: data fetching in plain async functions tested in Node, a thin async `page.tsx` that only wires, a synchronous view tested with React Testing Library in jsdom, where most UI tests live, and a few Playwright tests for what only a real server shows. A `vi.fn()` for a callback prop is the view's tracked output. A component calling a router hook stays in the view, tested under a stand-in App Router that records each navigation. Works with `lettuce` and `nullables`. |
| [`nullables`](skills/nullables/SKILL.md) | James Shore's Nullables pattern for testing without mocks: classify code as Logic, Infrastructure Wrapper, or Application, give Wrappers and Applications `create()`/`createNull()` with Configurable Responses and Output Tracking, and test sociably against Nulled dependencies. |
| [`test-audit`](skills/test-audit/SKILL.md) | Audits tests for duplicates, tests at the wrong layer and tests that can't go red, keeping one owner test per regression and naming the cover of every cut. On a diff, one fresh subagent checks the tests it adds, changes or leaves behind. As a sweep, auditors work through the suite by area in parallel, a reconciler breaks the cycles where each cut the other's copy, and you decide the big calls before anything is removed. |
| [`tickets`](skills/tickets/SKILL.md) | `/tickets` prints a table of every open ticket under `.scratch/<feature>/issues/`, with its number, name, status and open blockers. `/tickets next [feature]` prints the one to pick up: the lowest-numbered ready-for-agent ticket whose blockers are all done. Needs Node and Claude Code. |
| [`with-react-skills`](skills/with-react-skills/SKILL.md) | `/with-react-skills`, then `/bake`, loads each React and UI skill the first time the work needs it: `frontend-design` for how a screen looks, `vercel-composition-patterns` for component APIs, `vercel-react-best-practices` for data fetching and re-renders, and `web-design-guidelines` over the changed UI files before review. Needs those four installed (`anthropics/skills`, `vercel-labs/agent-skills`). |

## Install

Install with the [`skills`](https://github.com/vercel-labs/skills) CLI, run from the project that should get the skill:

```sh
npx skills add nrbernard/skills --skill ask-in-browser
```

It asks which agents to install for. Add `--global` to install for every project on the machine instead of this one, and `--agent claude-code` to skip the agent question.

To see what the repo offers before installing:

```sh
npx skills add nrbernard/skills --list
```

To install from a local clone, pass its path in place of `nrbernard/skills`.

## Update and remove

```sh
npx skills update ask-in-browser
npx skills remove ask-in-browser
```
