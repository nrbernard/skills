// Checks every skill under skills/: the SKILL.md frontmatter, the relative
// links in its markdown, and that each file shipped beside it is named in that
// markdown. Usage: node scripts/check-skills.mjs
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(repo, "skills");

const errors = [];
const fail = (path, message) =>
  errors.push(`${relative(repo, path)}: ${message}`);

const filesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

// The limits are the ones the `skills` CLI and the agents that load skills
// apply: a kebab-case name of up to 64 characters that matches the folder, and
// a description of up to 1024.
function checkFrontmatter(path, folder) {
  const block = readFileSync(path, "utf8").match(
    /^---\r?\n([\s\S]*?)\r?\n---/,
  )?.[1];
  if (!block) return fail(path, "missing frontmatter");

  let meta;
  try {
    meta = parse(block);
  } catch (err) {
    return fail(path, `frontmatter is not valid YAML: ${err.message}`);
  }
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    return fail(path, "frontmatter is not a set of keys");
  }

  const { name, description } = meta;
  if (typeof name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    fail(path, "name must be kebab-case");
  } else if (name.length > 64) {
    fail(path, `name is ${name.length} characters, the limit is 64`);
  } else if (name !== folder) {
    fail(path, `name is ${name}, the folder is ${folder}`);
  }
  if (typeof description !== "string" || description.trim() === "") {
    fail(path, "description is missing");
  } else if (description.length > 1024) {
    fail(
      path,
      `description is ${description.length} characters, the limit is 1024`,
    );
  }
}

// Fenced code is skipped, so a link written as an example is not followed.
function checkLinks(path) {
  const prose = readFileSync(path, "utf8").replace(
    /^\s*```[\s\S]*?^\s*```/gm,
    "",
  );
  for (const [, target] of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) {
    if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    const file = resolve(
      dirname(path),
      decodeURIComponent(target.split("#")[0]),
    );
    if (!existsSync(file)) fail(path, `link to ${target} points at nothing`);
  }
}

const folders = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

checkLinks(join(repo, "README.md"));

for (const folder of folders) {
  const dir = join(skillsDir, folder);
  const skillPath = join(dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    fail(dir, "no SKILL.md");
    continue;
  }
  checkFrontmatter(skillPath, folder);

  const files = filesIn(dir);
  const markdown = files.filter((file) => file.endsWith(".md"));
  markdown.forEach(checkLinks);

  // A file nothing mentions is one the agent never finds, which is what a
  // rename on one side only leaves behind.
  const text = markdown.map((file) => readFileSync(file, "utf8")).join("\n");
  for (const file of files) {
    if (file === skillPath || text.includes(basename(file))) continue;
    fail(file, "not mentioned in the skill's markdown");
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `${folders.length} skill${folders.length === 1 ? "" : "s"} checked`,
);
