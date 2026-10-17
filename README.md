# skills

Agent skills, one folder each under `skills/`.

| Skill | What it does |
| --- | --- |
| [`ask-in-browser`](skills/ask-in-browser/SKILL.md) | Asks every grilling round, and any other question that is a choice between options, as a browser form in place of chat, with the recommended answers preselected. Needs Node and macOS (`open`). |
| [`cupcake`](skills/cupcake/SKILL.md) | `/cupcake [spec]` writes the next ticket of a feature: the smallest step that makes it more useful than it is today, judged from what is already built. One ticket per run, right before it is built, so the spec can change between. Writes the ticket format `tickets` reads. |
| [`nullables`](skills/nullables/SKILL.md) | James Shore's Nullables pattern for testing without mocks: classify code as Logic, Infrastructure Wrapper, or Application, give Wrappers and Applications `create()`/`createNull()` with Configurable Responses and Output Tracking, and test sociably against Nulled dependencies. |
| [`tickets`](skills/tickets/SKILL.md) | `/tickets` prints a table of every open ticket under `.scratch/<feature>/issues/`, with its number, name, status and open blockers. `/tickets next [feature]` prints the one to pick up: the lowest-numbered ready-for-agent ticket whose blockers are all done. Needs Node and Claude Code. |

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
