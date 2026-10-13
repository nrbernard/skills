# skills

Agent skills, one folder each under `skills/`.

| Skill | What it does |
| --- | --- |
| [`ask-in-browser`](skills/ask-in-browser/SKILL.md) | Asks any question that is a choice between options as a browser form, with the recommended answers preselected. Needs Node and macOS (`open`). |
| [`tickets`](skills/tickets/SKILL.md) | `/tickets` prints a table of every open ticket under `.scratch/<feature>/issues/`, with its number, name, status and open blockers. Needs Node and Claude Code. |

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
