// Reports the work in a repo that is not yet merged into its main branch: each
// open spec with the branches working on it, each folder of tickets with no
// spec, and every other branch or worktree holding work.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const FINISHED = new Set(["resolved", "wontfix", "done"]);

/** @type {(repo: string, ...args: string[]) => string} */
const git = (repo, ...args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trimEnd();

/** @type {(text: string) => string} */
const statusOf = (text) => text.match(/^Status:\s*(.+)$/m)?.[1].trim() ?? "?";

// The files under .scratch/ at a commit, by path, each held as its Status line
// alone, or nothing for a file with none. Two git commands a branch, however
// many files it holds.
/** @type {(repo: string, ref: string) => Map<string, string>} */
function filesAt(repo, ref) {
  /** @type {Map<string, string>} */
  const files = new Map();
  const paths = git(
    repo,
    "ls-tree",
    "-r",
    "--name-only",
    ref,
    "--",
    ".scratch",
  );
  for (const path of paths.split("\n"))
    if (path.endsWith(".md")) files.set(path, "");
  let found = "";
  try {
    found = git(
      repo,
      "grep",
      "-z",
      "-m1",
      "-e",
      "^Status:",
      ref,
      "--",
      ".scratch",
    );
  } catch {
    // git grep fails when nothing matches.
  }
  for (const line of found.split("\n")) {
    const [where, text] = line.split("\0");
    const path = where.slice(ref.length + 1);
    if (files.has(path)) files.set(path, text);
  }
  return files;
}

// The specs and tickets under .scratch/ in a worktree's folder, by path.
/** @type {(dir: string) => Map<string, string>} */
function filesIn(dir) {
  /** @type {Map<string, string>} */
  const files = new Map();
  const scratch = join(dir, ".scratch");
  if (!existsSync(scratch)) return files;
  for (const path of readdirSync(scratch, {
    recursive: true,
    encoding: "utf8",
  }))
    if (path.endsWith(".md"))
      files.set(`.scratch/${path}`, readFileSync(join(scratch, path), "utf8"));
  return files;
}

// Each folder under .scratch/ that holds a spec or tickets: the spec's status,
// or undefined with no spec, and how many of its tickets are open.
/** @typedef {{ status: string | undefined, open: number }} Folder */
/** @type {(files: Map<string, string>) => Map<string, Folder>} */
function foldersOf(files) {
  /** @type {Map<string, Folder>} */
  const folders = new Map();
  const folder = (/** @type {string} */ name) => {
    const f = folders.get(name) ?? { status: undefined, open: 0 };
    folders.set(name, f);
    return f;
  };
  for (const [path, text] of files) {
    const [, name, ...rest] = path.split("/");
    if (rest.length === 1 && rest[0] === "spec.md")
      folder(name).status = statusOf(text);
    else if (rest.length === 2 && rest[0] === "issues") {
      const f = folder(name);
      if (!FINISHED.has(statusOf(text))) f.open++;
    }
  }
  return folders;
}

// A markdown table, leaving out each column no row fills, as short as it can
// be, since an agent reads and repeats it: no cell is padded.
/** @type {(header: string[], rows: string[][]) => string} */
function table(header, rows) {
  const kept = header.map((_, i) => rows.some((row) => row[i] !== ""));
  return [header, header.map(() => "---"), ...rows]
    .map((row) => `|${row.filter((_, i) => kept[i]).join("|")}|`)
    .join("\n");
}

// The branch work merges into: the one origin/HEAD names, or else main, or
// else master.
/** @type {(repo: string) => string} */
function trunkOf(repo) {
  const has = (/** @type {string} */ ref) => {
    try {
      git(repo, "rev-parse", "--verify", "--quiet", ref);
      return true;
    } catch {
      return false;
    }
  };
  if (has("refs/remotes/origin/HEAD"))
    return git(repo, "rev-parse", "--abbrev-ref", "origin/HEAD").replace(
      /^origin\//,
      "",
    );
  return has("refs/heads/main") ? "main" : "master";
}

/** @type {(seconds: number) => string} */
function ago(seconds) {
  /** @type {(n: number, unit: string) => string} */
  const of = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return of(Math.floor(seconds / 60), "minute");
  if (seconds < 86_400) return of(Math.floor(seconds / 3600), "hour");
  return of(Math.floor(seconds / 86_400), "day");
}

// The paths a worktree has changed and not committed.
/** @type {(dir: string) => string[]} */
const uncommittedIn = (dir) =>
  git(dir, "status", "--porcelain", "-uall")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3));

// Each worktree's path, by the branch checked out in it.
/** @type {(repo: string) => Map<string, string>} */
function worktreesOf(repo) {
  /** @type {Map<string, string>} */
  const byBranch = new Map();
  for (const block of git(repo, "worktree", "list", "--porcelain").split(
    "\n\n",
  )) {
    const path = block.match(/^worktree (.+)$/m)?.[1];
    const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1];
    if (path && branch) byBranch.set(branch, path);
  }
  return byBranch;
}

/**
 * A branch not merged into the trunk, with what it holds under .scratch/.
 * @typedef {object} Place
 * @property {string} branch
 * @property {boolean} dirty
 * @property {string} worktree
 * @property {string} ahead
 * @property {string} lastCommit
 * @property {Map<string, Folder>} folders
 * @property {Set<string>} changed the folders it changed since it left the trunk
 */

/** @type {(repo: string, now: number) => string} */
export function oven(repo, now) {
  const trunk = trunkOf(repo);
  const worktrees = worktreesOf(repo);
  // A worktree's path from the repo this runs in, marked when it holds
  // uncommitted changes.
  /** @type {(path: string, dirty: boolean) => string} */
  const cell = (path, dirty) =>
    `${relative(repo, path) || "."}${dirty ? " (uncommitted changes)" : ""}`;
  /** @type {Place[]} */
  const places = git(
    repo,
    "for-each-ref",
    "--format=%(refname:short)",
    "refs/heads",
  )
    .split("\n")
    .filter((b) => b && b !== trunk)
    .sort()
    .map((branch) => {
      const worktree = worktrees.get(branch);
      const uncommitted = worktree ? uncommittedIn(worktree) : [];
      return {
        branch,
        dirty: uncommitted.length > 0,
        worktree: worktree ? cell(worktree, uncommitted.length > 0) : "",
        ahead: git(repo, "rev-list", "--count", `${trunk}..${branch}`),
        lastCommit: ago(
          now - Number(git(repo, "log", "-1", "--format=%ct", branch)),
        ),
        folders: foldersOf(
          worktree ? filesIn(worktree) : filesAt(repo, branch),
        ),
        changed: new Set(
          [
            ...git(repo, "diff", "--name-only", `${trunk}...${branch}`).split(
              "\n",
            ),
            ...uncommitted,
          ]
            .filter((p) => p.startsWith(".scratch/"))
            .map((p) => p.split("/")[1]),
        ),
      };
    })
    // A branch with no commits ahead is merged, and done unless its worktree
    // holds uncommitted changes.
    .filter((p) => p.ahead !== "0" || p.dirty);

  const onTrunk = foldersOf(filesAt(repo, trunk));
  const names = new Set([
    ...onTrunk.keys(),
    ...places.flatMap((p) => [...p.folders.keys()]),
  ]);
  /** @type {string[][]} */
  const specRows = [];
  /** @type {string[][]} */
  const ticketRows = [];
  /** @type {Set<Place>} */
  const listed = new Set();
  for (const name of [...names].sort()) {
    const working = places.filter(
      (p) =>
        p.changed.has(name) ||
        p.branch === name ||
        p.branch.startsWith(`${name}-`),
    );
    const main = onTrunk.get(name);
    const isSpec =
      main?.status !== undefined ||
      working.some((p) => p.folders.get(name)?.status !== undefined);
    const open =
      working.length > 0 ||
      (isSpec
        ? main?.status !== undefined && !FINISHED.has(main.status)
        : (main?.open ?? 0) > 0);
    if (!open) continue;
    for (const p of working) listed.add(p);
    /** @type {string[][]} */
    const rows = [];
    if (main)
      rows.push([trunk, main.status ?? "", String(main.open), "", "", ""]);
    for (const p of working) {
      const f = p.folders.get(name);
      rows.push([
        p.branch,
        f?.status ?? "",
        String(f?.open ?? ""),
        p.ahead,
        p.lastCommit,
        p.worktree,
      ]);
    }
    for (const [i, row] of rows.entries()) {
      const first = i === 0 ? name : "";
      if (isSpec) specRows.push([first, ...row]);
      else ticketRows.push([first, row[0], ...row.slice(2)]);
    }
  }

  /** @type {string[][]} */
  const otherRows = [];
  const trunkWorktree = worktrees.get(trunk);
  if (trunkWorktree && uncommittedIn(trunkWorktree).length > 0)
    otherRows.push([trunk, "", "", cell(trunkWorktree, true)]);
  for (const p of places)
    if (!listed.has(p))
      otherRows.push([p.branch, p.ahead, p.lastCommit, p.worktree]);

  const sections = [
    {
      heading: "Specs",
      header: [
        "Spec",
        "Branch",
        "Status",
        "Open tickets",
        "Ahead",
        "Last commit",
        "Worktree",
      ],
      rows: specRows,
    },
    {
      heading: "Tickets with no spec",
      header: [
        "Folder",
        "Branch",
        "Open tickets",
        "Ahead",
        "Last commit",
        "Worktree",
      ],
      rows: ticketRows,
    },
    {
      heading: "Other work",
      header: ["Branch", "Ahead", "Last commit", "Worktree"],
      rows: otherRows,
    },
  ].filter((section) => section.rows.length > 0);
  if (sections.length === 0) return "Nothing in the oven.";
  return sections
    .map(
      ({ heading, header, rows }) => `## ${heading}\n\n${table(header, rows)}`,
    )
    .join("\n\n");
}
