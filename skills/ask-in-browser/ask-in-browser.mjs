// Serves a set of questions as a form, prints the answers on submit, then
// exits. Usage: node ask-in-browser.mjs [port] < questions.json
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const [port = "4517"] = process.argv.slice(2);
/**
 * @typedef {object} Question
 * @property {string} q
 * @property {string[]} options
 * @property {string | string[]} [rec]
 * @property {string} [group]
 * @property {string} [body]
 * @property {string} [why]
 */
/** @type {{ title: string, facts?: string[], questions: Question[] }} */
const input = JSON.parse(readFileSync(0, "utf8"));

// Questions arrive as plain text with backticks and **bold**. Ids, option
// letters and the subtitle are filled in here so the caller never writes them.
/** @param {string} s */
const md = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const count = input.questions.length;
const round = {
  title: md(input.title),
  subtitle: `${count} question${count === 1 ? "" : "s"}. Change only the ones you disagree with, then send.`,
  facts: input.facts?.map(md),
  questions: input.questions.map((q, i) => ({
    id: `Q${i + 1}`,
    group: q.group && md(q.group),
    title: md(q.q),
    body: q.body && md(q.body),
    multi: Array.isArray(q.rec),
    recommended: /** @type {string[]} */ ([]).concat(q.rec ?? []),
    options: q.options.map((o, j) => {
      const key = String.fromCharCode(65 + j);
      return { key, label: `<b>${key}.</b> ${md(o)}` };
    }),
    why: q.why && md(q.why),
  })),
};

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${round.title.replace(/<[^>]+>/g, "")}</title>
<style>
  :root { color-scheme: light dark; --bg: #fafaf9; --card: #fff; --ink: #1c1917; --mute: #78716c; --line: #e7e5e4; --acc: #047857; --accbg: #ecfdf5; }
  @media (prefers-color-scheme: dark) { :root { --bg: #1c1917; --card: #292524; --ink: #f5f5f4; --mute: #a8a29e; --line: #44403c; --acc: #34d399; --accbg: #064e3b; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 46rem; margin: 0 auto; padding: 2.5rem 1.25rem 8rem; }
  h1 { font: 600 1.75rem/1.2 Georgia, serif; margin: 0 0 0.25rem; }
  .sub { color: var(--mute); margin: 0 0 1rem; }
  .facts { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 0.75rem 1rem 0.75rem 2rem; margin: 0 0 1rem; font-size: 0.9rem; }
  .facts li { margin: 0.25rem 0; }
  h2 { font: 600 0.8rem/1 system-ui; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mute); margin: 2.5rem 0 0.75rem; }
  fieldset { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 1.25rem; margin: 0 0 1rem; }
  legend { float: left; width: 100%; padding: 0; font-weight: 600; font-size: 1.05rem; margin-bottom: 0.4rem; }
  legend span { color: var(--mute); font-weight: 500; margin-right: 0.4rem; }
  .body { clear: both; color: var(--mute); margin: 0 0 0.9rem; font-size: 0.95rem; }
  label.opt { display: flex; gap: 0.7rem; padding: 0.65rem 0.8rem; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; }
  label.opt:has(input:checked) { border-color: var(--acc); background: var(--accbg); }
  label.opt input { margin-top: 0.3rem; accent-color: var(--acc); }
  .rec { display: inline-block; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--acc); border: 1px solid var(--acc); border-radius: 4px; padding: 0 0.35rem; margin-left: 0.4rem; vertical-align: 1px; }
  .why { font-size: 0.9rem; margin: 0.6rem 0; padding-left: 0.75rem; border-left: 3px solid var(--acc); }
  textarea { width: 100%; min-height: 2.4rem; border: 1px solid var(--line); border-radius: 8px; padding: 0.5rem 0.7rem; font: inherit; font-size: 0.9rem; background: transparent; color: inherit; resize: vertical; }
  .bar { position: fixed; left: 0; right: 0; bottom: 0; background: var(--card); border-top: 1px solid var(--line); padding: 0.8rem 1.25rem; display: flex; gap: 0.75rem; justify-content: center; align-items: center; }
  button { font: inherit; font-weight: 600; padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid var(--acc); background: var(--acc); color: var(--bg); cursor: pointer; }
  button.ghost { background: transparent; color: var(--acc); }
  #status { color: var(--mute); font-size: 0.9rem; }
  code { font-size: 0.88em; background: color-mix(in srgb, var(--mute) 18%, transparent); padding: 0 0.25em; border-radius: 3px; }
</style>
</head>
<body>
<main>
  <h1>${round.title}</h1>
  <p class="sub">${round.subtitle}</p>
  <div id="form"></div>
</main>
<div class="bar">
  <button id="send">Send answers</button>
  <button id="copy" class="ghost">Copy as text</button>
  <span id="status">Recommended answers are preselected.</span>
</div>
<script type="module">
const round = ${JSON.stringify(round).replace(/</g, "\\u003c")};
const el = (tag, props = {}, html) => { const n = Object.assign(document.createElement(tag), props); if (html !== undefined) n.innerHTML = html; return n; };
const form = document.getElementById("form");
if (round.facts) form.append(el("ul", { className: "facts" }, round.facts.map((f) => "<li>" + f + "</li>").join("")));
let group;
for (const q of round.questions) {
  if (q.group && q.group !== group) { group = q.group; form.append(el("h2", {}, group)); }
  const fs = el("fieldset");
  fs.append(el("legend", {}, "<span>" + q.id + "</span>" + q.title));
  if (q.body) fs.append(el("p", { className: "body" }, q.body));
  const rec = q.recommended;
  for (const o of q.options) {
    const label = el("label", { className: "opt" });
    const input = el("input", { type: q.multi ? "checkbox" : "radio", name: q.id, value: o.key, checked: rec.includes(o.key) });
    label.append(input, el("div", {}, o.label + (rec.includes(o.key) ? '<span class="rec">Recommended</span>' : "")));
    fs.append(label);
  }
  if (q.why) fs.append(el("p", { className: "why" }, q.why));
  fs.append(el("textarea", { name: q.id + "-note", placeholder: "Notes, or a different answer (optional)" }));
  form.append(fs);
}
function answers() {
  return round.questions.map((q) => ({
    id: q.id,
    answer: [...document.querySelectorAll('input[name="' + q.id + '"]:checked')].map((i) => i.value),
    note: document.querySelector('textarea[name="' + q.id + '-note"]').value.trim(),
  }));
}
const asText = () => answers().map((a) => a.id + ": " + (a.answer.join(", ") || "(none)") + (a.note ? " — " + a.note : "")).join("\\n");
const status = document.getElementById("status");
document.getElementById("copy").onclick = async () => { await navigator.clipboard.writeText(asText()); status.textContent = "Copied. Paste it into the terminal."; };
document.getElementById("send").onclick = async () => {
  try {
    const res = await fetch("/submit", { method: "POST", body: asText() });
    if (!res.ok) throw new Error();
    status.textContent = "Sent. You can close this tab.";
    document.getElementById("send").disabled = true;
  } catch {
    await navigator.clipboard.writeText(asText()).catch(() => {});
    status.textContent = "Could not reach the session, so the answers were copied instead. Paste them into the terminal.";
  }
};
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/submit") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      res.end("ok");
      console.log(body);
      server.close();
      setTimeout(() => process.exit(0), 200);
    });
    return;
  }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(page);
});

// Listens on the port asked for, or the next free one when a server from an
// earlier session still holds it.
server.on("error", (/** @type {NodeJS.ErrnoException} */ err) => {
  if (err.code !== "EADDRINUSE") throw err;
  console.log(`Port ${tried} in use, trying ${tried + 1}`);
  tried += 1;
  server.listen(tried, "127.0.0.1");
});
let tried = Number(port);
server.listen(tried, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${tried}/`;
  console.log(`Form at ${url}`);
  execFile("open", [url]);
});
