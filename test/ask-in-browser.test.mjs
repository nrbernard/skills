// Runs the form server the way SKILL.md says to: questions on stdin, answers on
// stdout. A stub stands in for macOS `open`, so no browser opens.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const skill = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "skills",
  "ask-in-browser",
);

// The stub records the URL it was asked to open.
const bin = mkdtempSync(join(tmpdir(), "ask-in-browser-"));
const opened = join(bin, "opened");
writeFileSync(join(bin, "open"), '#!/bin/sh\nprintf %s "$1" > "$OPENED"\n');
chmodSync(join(bin, "open"), 0o755);

const listen = (port) =>
  new Promise((done) => {
    const server = createServer().listen(port, "127.0.0.1", () => done(server));
  });

async function freePort() {
  const server = await listen(0);
  const { port } = server.address();
  await new Promise((done) => server.close(done));
  return port;
}

// Starts the server and resolves once it prints where the form is.
async function serve(t, questions, port) {
  const child = spawn(
    process.execPath,
    [join(skill, "ask-in-browser.mjs"), String(port)],
    { env: { PATH: bin, OPENED: opened } },
  );
  t.after(() => child.kill());

  let output = "";
  let errput = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => (output += chunk));
  child.stderr.setEncoding("utf8").on("data", (chunk) => (errput += chunk));
  child.stdin.end(
    typeof questions === "string" ? questions : JSON.stringify(questions),
  );

  const exited = new Promise((done) => child.on("close", done));
  const url = await new Promise((done, fail) => {
    child.stdout.on("data", () => {
      const match = output.match(/Form at (\S+)/);
      if (match) done(match[1]);
    });
    exited.then((code) =>
      fail(new Error(`exited with ${code} before listening\n${errput}`)),
    );
  });
  return { url, exited, output: () => output };
}

// The questions as the page receives them, after the server has filled in ids
// and option letters.
async function roundAt(url) {
  const res = await fetch(url);
  assert.equal(res.status, 200);
  const html = await res.text();
  return { html, round: JSON.parse(html.match(/^const round = (.*);$/m)[1]) };
}

test("serves the example in SKILL.md and prints the answers", async (t) => {
  const skillMd = readFileSync(join(skill, "SKILL.md"), "utf8");
  const example = skillMd.match(/<<'EOF'\n\s*(.*)\n\s*EOF/)[1];
  const { title, questions } = JSON.parse(example);
  for (const { options, rec } of questions) {
    for (const letter of [].concat(rec)) {
      assert.ok(letter.charCodeAt(0) - 65 < options.length, `rec ${letter}`);
    }
  }

  rmSync(opened, { force: true });
  const server = await serve(t, example, await freePort());
  const { round } = await roundAt(server.url);
  assert.equal(round.title, title);
  assert.equal(round.questions.length, questions.length);

  const res = await fetch(new URL("/submit", server.url), {
    method: "POST",
    body: "Q1: A — a note",
  });
  assert.equal(res.status, 200);
  assert.equal(await server.exited, 0);
  assert.equal(server.output().trimEnd().split("\n").at(-1), "Q1: A — a note");

  // The stub can outlive the server, so its record is waited for.
  for (let i = 0; i < 100 && !existsSync(opened); i++) await sleep(50);
  assert.equal(readFileSync(opened, "utf8"), server.url);
});

test("letters the options and preselects the recommendation", async (t) => {
  const server = await serve(
    t,
    {
      title: "Round",
      questions: [
        { q: "One?", options: ["x", "y", "z"], rec: "B" },
        { q: "Several?", options: ["x", "y", "z"], rec: ["A", "C"] },
      ],
    },
    await freePort(),
  );
  const { round } = await roundAt(server.url);
  const [one, several] = round.questions;

  assert.deepEqual(
    one.options.map((option) => option.key),
    ["A", "B", "C"],
  );
  assert.equal(one.id, "Q1");
  assert.equal(one.multi, false);
  assert.deepEqual(one.recommended, ["B"]);
  assert.equal(several.id, "Q2");
  assert.equal(several.multi, true);
  assert.deepEqual(several.recommended, ["A", "C"]);
});

test("renders backticks and bold, and escapes HTML", async (t) => {
  const server = await serve(
    t,
    {
      title: "<img> `code` **bold**",
      facts: ["a <b>fact</b>"],
      questions: [{ q: "Q?", options: ["<script>"], rec: "A" }],
    },
    await freePort(),
  );
  const { html, round } = await roundAt(server.url);

  assert.equal(round.title, "&lt;img&gt; <code>code</code> <b>bold</b>");
  assert.deepEqual(round.facts, ["a &lt;b&gt;fact&lt;/b&gt;"]);
  assert.equal(round.questions[0].options[0].label, "<b>A.</b> &lt;script&gt;");
  assert.match(html, /<title>&lt;img&gt; code bold<\/title>/);
});

test("moves to the next port when the one asked for is taken", async (t) => {
  const port = await freePort();
  const holder = await listen(port);
  t.after(() => holder.close());

  const server = await serve(
    t,
    { title: "Round", questions: [{ q: "Q?", options: ["x"], rec: "A" }] },
    port,
  );
  assert.match(server.output(), new RegExp(`Port ${port} in use`));
  assert.ok(Number(new URL(server.url).port) > port);
  await roundAt(server.url);
});
