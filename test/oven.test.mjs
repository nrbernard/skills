import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { oven } from "../skills/oven/oven.mjs";

// A git hook running these tests sets variables such as GIT_INDEX_FILE that
// point at this repo, and every git command here and in oven would inherit
// them, so they are cleared before any runs.
for (const name of Object.keys(process.env))
  if (name.startsWith("GIT_")) delete process.env[name];

/** @type {string[]} */
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

// Every commit is made at T0, and oven reads the repo at NOW, three days later.
const T0 = 1_700_000_000;
const NOW = T0 + 3 * 86_400;

/** @type {(cwd: string, ...args: string[]) => string} */
function git(cwd, ...args) {
  const date = `@${T0} +0000`;
  return execFileSync(
    "git",
    ["-c", "user.name=T", "-c", "user.email=t@t", ...args],
    {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_AUTHOR_DATE: date,
        GIT_COMMITTER_DATE: date,
      },
    },
  );
}

// A temporary directory holding a repo on its trunk, main unless named, with one commit, in repo/, with
// room beside it for worktrees.
function newRepo(trunk = "main") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "oven-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", trunk);
  git(repo, "commit", "-q", "--allow-empty", "-m", "start");
  return { root, repo };
}

/** @type {(dir: string, files: Record<string, string>) => void} */
function write(dir, files) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
}

/** @type {(dir: string, files: Record<string, string>) => void} */
function commit(dir, files) {
  write(dir, files);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "work");
}

/** @type {(status: string) => string} */
const spec = (status) => `# A spec\n\nStatus: ${status}\n`;
/** @type {(status: string) => string} */
const ticket = (status) => `# 01: A ticket\n\nStatus: ${status}\n`;

describe("oven", () => {
  it("prints that nothing is in the oven for a repo with no work", () => {
    const { repo } = newRepo();

    assert.equal(oven(repo, NOW), "Nothing in the oven.");
  });

  it("lists an open spec on main with its open tickets, leaving out resolved, wontfix and done ones", () => {
    const { repo } = newRepo();
    commit(repo, {
      ".scratch/a/spec.md": spec("ready-for-agent"),
      ".scratch/a/issues/01-x.md": ticket("ready-for-agent"),
      ".scratch/a/issues/02-x.md": ticket("needs-triage"),
      ".scratch/a/issues/03-x.md": ticket("resolved"),
      ".scratch/a/issues/04-x.md": ticket("wontfix"),
      ".scratch/a/issues/05-x.md": ticket("done"),
    });

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|",
        "|---|---|---|---|",
        "|a|main|ready-for-agent|2|",
      ].join("\n"),
    );
  });

  it("leaves out a resolved spec that no branch is working on", () => {
    const { repo } = newRepo();
    commit(repo, {
      ".scratch/a/spec.md": spec("resolved"),
      ".scratch/a/issues/01-x.md": ticket("ready-for-agent"),
    });

    assert.equal(oven(repo, NOW), "Nothing in the oven.");
  });

  it("lists a branch that changed a spec's folder, with its commits ahead, last commit and worktree, for a spec only on that branch", () => {
    const { root, repo } = newRepo();
    const wt = join(root, "wt-a");
    git(repo, "worktree", "add", "-q", "-b", "a", wt);
    commit(wt, { ".scratch/a/spec.md": spec("ready-for-agent") });
    commit(wt, { ".scratch/a/issues/01-x.md": ticket("ready-for-agent") });

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|Ahead|Last commit|Worktree|",
        "|---|---|---|---|---|---|---|",
        "|a|a|ready-for-agent|1|2|3 days ago|../wt-a|",
      ].join("\n"),
    );
  });

  it("lists a branch named for a spec under it, though it never touched .scratch/", () => {
    const { repo } = newRepo();
    commit(repo, {
      ".scratch/a/spec.md": spec("ready-for-agent"),
      ".scratch/a/issues/01-x.md": ticket("ready-for-agent"),
    });
    git(repo, "switch", "-q", "-c", "a-01-x");
    commit(repo, { "src/x.js": "x" });
    git(repo, "switch", "-q", "main");

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|Ahead|Last commit|",
        "|---|---|---|---|---|---|",
        "|a|main|ready-for-agent|1|||",
        "||a-01-x|ready-for-agent|1|1|3 days ago|",
      ].join("\n"),
    );
  });

  it("lists a resolved spec while an unmerged branch is working on it", () => {
    const { repo } = newRepo();
    commit(repo, { ".scratch/a/spec.md": spec("resolved") });
    git(repo, "switch", "-q", "-c", "fix-a");
    commit(repo, { ".scratch/a/issues/01-x.md": ticket("ready-for-agent") });
    git(repo, "switch", "-q", "main");

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|Ahead|Last commit|",
        "|---|---|---|---|---|---|",
        "|a|main|resolved|0|||",
        "||fix-a|resolved|1|1|3 days ago|",
      ].join("\n"),
    );
  });

  it("reads a worktree's uncommitted edits and marks its row", () => {
    const { root, repo } = newRepo();
    const wt = join(root, "wt-a");
    git(repo, "worktree", "add", "-q", "-b", "a", wt);
    commit(wt, {
      ".scratch/a/spec.md": spec("ready-for-agent"),
      ".scratch/a/issues/01-x.md": ticket("ready-for-agent"),
    });
    write(wt, { ".scratch/a/issues/01-x.md": ticket("resolved") });

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|Ahead|Last commit|Worktree|",
        "|---|---|---|---|---|---|---|",
        "|a|a|ready-for-agent|0|1|3 days ago|../wt-a (uncommitted changes)|",
      ].join("\n"),
    );
  });

  it("leaves out a branch merged into main", () => {
    const { repo } = newRepo();
    commit(repo, { ".scratch/a/spec.md": spec("ready-for-agent") });
    git(repo, "switch", "-q", "-c", "a-01-x");
    commit(repo, { ".scratch/a/issues/01-x.md": ticket("resolved") });
    git(repo, "switch", "-q", "main");
    git(repo, "merge", "-q", "a-01-x");

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|",
        "|---|---|---|---|",
        "|a|main|ready-for-agent|0|",
      ].join("\n"),
    );
  });

  it("lists a folder of tickets with no spec, one row per branch, when it has open tickets or a branch working on it", () => {
    const { repo } = newRepo();
    commit(repo, {
      ".scratch/b/issues/01-x.md": ticket("ready-for-agent"),
      ".scratch/b/issues/02-x.md": ticket("resolved"),
      ".scratch/c/issues/01-x.md": ticket("resolved"),
    });
    git(repo, "switch", "-q", "-c", "b-03-y");
    commit(repo, { ".scratch/b/issues/03-y.md": ticket("needs-triage") });
    git(repo, "switch", "-q", "main");

    assert.equal(
      oven(repo, NOW),
      [
        "## Tickets with no spec",
        "",
        "|Folder|Branch|Open tickets|Ahead|Last commit|",
        "|---|---|---|---|---|",
        "|b|main|1|||",
        "||b-03-y|2|1|3 days ago|",
      ].join("\n"),
    );
  });

  it("lists under Other work an unmerged branch on no spec, a merged worktree with uncommitted changes, and the main checkout with uncommitted changes", () => {
    const { root, repo } = newRepo();
    git(repo, "switch", "-q", "-c", "proto");
    commit(repo, { "src/x.js": "x" });
    git(repo, "switch", "-q", "main");
    const wt = join(root, "wt-header");
    git(repo, "worktree", "add", "-q", "-b", "header", wt);
    write(wt, { "src/y.js": "y" });
    write(repo, { "notes.txt": "n" });

    assert.equal(
      oven(repo, NOW),
      [
        "## Other work",
        "",
        "|Branch|Ahead|Last commit|Worktree|",
        "|---|---|---|---|",
        "|main|||. (uncommitted changes)|",
        "|header|0|3 days ago|../wt-header (uncommitted changes)|",
        "|proto|1|3 days ago||",
      ].join("\n"),
    );
  });

  it("leaves out an empty section between two that hold work", () => {
    const { repo } = newRepo();
    commit(repo, { ".scratch/a/spec.md": spec("ready-for-agent") });
    git(repo, "switch", "-q", "-c", "proto");
    commit(repo, { "src/x.js": "x" });
    git(repo, "switch", "-q", "main");

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|",
        "|---|---|---|---|",
        "|a|main|ready-for-agent|0|",
        "",
        "## Other work",
        "",
        "|Branch|Ahead|Last commit|",
        "|---|---|---|",
        "|proto|1|3 days ago|",
      ].join("\n"),
    );
  });

  it("takes master as the main branch in a repo with no main", () => {
    const { repo } = newRepo("master");
    commit(repo, { ".scratch/a/spec.md": spec("ready-for-agent") });

    assert.equal(
      oven(repo, NOW),
      [
        "## Specs",
        "",
        "|Spec|Branch|Status|Open tickets|",
        "|---|---|---|---|",
        "|a|master|ready-for-agent|0|",
      ].join("\n"),
    );
  });
});
