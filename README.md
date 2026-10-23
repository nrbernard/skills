# skills

Agent skills, one folder each under `skills/`.

| Skill | What it does |
| --- | --- |
| [`ask-in-browser`](skills/ask-in-browser/SKILL.md) | Asks every grilling round, and any other question that is a choice between options, as a browser form in place of chat, with the recommended answers preselected. Needs Node and macOS (`open`). |
| [`bake`](skills/bake/SKILL.md) | A fork of Matt Pocock's [`implement`](https://github.com/mattpocock/skills) skill (MIT): `/bake` builds the work a spec or its tickets describe, test-first where it can, then reviews it with `/code-review` and commits. |
| [`bake-spec`](skills/bake-spec/SKILL.md) | A fork of Matt Pocock's [`implement-spec`](https://github.com/mattpocock/skills) skill (MIT): `/bake-spec` builds a spec's tickets on one integration branch, an implementer subagent per ticket in its own worktree as the task graph frees them, then reviews the branch with `/code-review`. |
| [`cupcake`](skills/cupcake/SKILL.md) | `/cupcake [spec]` writes the next ticket of a feature: the smallest step that makes it more useful than it is today, judged from what is already built. One ticket per run, right before it is built, so the spec can change between. Writes the ticket format `tickets` reads. |
| [`lettuce`](skills/lettuce/SKILL.md) | A fork of Matt Pocock's [`tdd`](https://github.com/mattpocock/skills) skill (MIT): test-driven development as the red → green → refactor loop, one vertical slice at a time, with tests only at seams agreed with the user, each test listed with the regression only it catches, and one owner test per behaviour. Tests are sociable, with the outside world Nulled through the `nullables` skill, which it needs installed. |
| [`nullables`](skills/nullables/SKILL.md) | James Shore's Nullables pattern for testing without mocks: classify code as Logic, Infrastructure Wrapper, or Application, give Wrappers and Applications `create()`/`createNull()` with Configurable Responses and Output Tracking, and test sociably against Nulled dependencies. |
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
