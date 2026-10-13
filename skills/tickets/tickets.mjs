// Reads every ticket under .scratch/<feature>/issues/ from each file's H1,
// **Status:** and **Blocked by:** lines. Ticket numbers restart in each
// feature, so a blocker written as a bare number is a ticket in the blocked
// ticket's own feature, and one in another feature is written <feature>-NN.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * @typedef {object} Ticket
 * @property {string} feature
 * @property {string} number
 * @property {string} name
 * @property {string} status
 * @property {{ written: string, key: string }[]} blockers
 * @property {string[]} openBlockers
 * @property {string[]} blockedByFaults
 * @property {string} path
 */

// One blocker, NN (title) or <feature>-NN (title). A title can hold brackets of its own.
const BLOCKER =
  /(?<![\w.-])(?:([\w.-]+)-)?(\d+[a-z]?) \((?:[^()]|\([^()]*\))*\)/g;
// A whole line of blockers, each parted from the next by a comma and a space.
const BLOCKERS = new RegExp(`^${BLOCKER.source}(?:, ${BLOCKER.source})*$`);

const NONE = "None (can start immediately)";

// Ticket numbers restart in each feature, so a ticket is known by both.
/** @type {(feature: string, number: string) => string} */
const keyOf = (feature, number) => `${feature}/${number}`;

// The blockers a Blocked by line names, in order, each as it is written, and
// what the line holds besides them when it is neither a list of blockers nor
// NONE. A blocker on a line that holds more is still a blocker. A ticket with
// no line has no blockers and nothing unread.
/** @type {(line: string | undefined, ownFeature: string) => { blockers: Ticket["blockers"], unread?: string }} */
function readBlockedBy(line, ownFeature) {
  if (line === undefined || line === NONE) return { blockers: [] };
  const blockers = [...line.matchAll(BLOCKER)].map(([, feature, number]) => ({
    written: feature ? `${feature}-${number}` : number,
    key: keyOf(feature ?? ownFeature, number),
  }));
  if (BLOCKERS.test(line)) return { blockers };
  const rest = line.replace(BLOCKER, "").trim();
  return { blockers, unread: rest.replace(/^[\s,]+|[\s,]+$/g, "") || rest };
}

export function readTickets(root = ".") {
  /** @type {Ticket[]} */
  const tickets = [];
  if (!existsSync(join(root, ".scratch"))) return tickets;
  for (const feature of readdirSync(join(root, ".scratch")).sort()) {
    const dir = join(".scratch", feature, "issues");
    if (!existsSync(join(root, dir))) continue;
    for (const file of readdirSync(join(root, dir))
      .filter((f) => f.endsWith(".md"))
      .sort()) {
      const path = join(dir, file);
      const text = readFileSync(join(root, path), "utf8");
      const [, number, name] = text.match(/^# (\S+?):\s*(.+)$/m) ?? [
        undefined,
        file,
        file,
      ];
      const status = text.match(/^\*\*Status:\*\*\s*(.+)$/m)?.[1].trim() ?? "?";
      const blockedBy = text
        .match(/^\*\*Blocked by:\*\*[ \t]*(.*)$/m)?.[1]
        .trim();
      const { blockers, unread } = readBlockedBy(blockedBy, feature);
      // What a test holds every ticket in the repo to having none of: each says
      // which ticket and what is wrong with its Blocked by line.
      const blockedByFaults =
        unread === undefined
          ? []
          : [`${path}: Blocked by cannot be read: "${unread}"`];
      tickets.push({
        feature,
        number,
        name,
        status,
        blockers,
        openBlockers: [],
        blockedByFaults,
        path,
      });
    }
  }
  const done = new Set(
    tickets
      .filter((t) => t.status === "done")
      .map((t) => keyOf(t.feature, t.number)),
  );
  const known = new Set(tickets.map((t) => keyOf(t.feature, t.number)));
  for (const t of tickets) {
    t.openBlockers = t.blockers
      .filter((b) => !done.has(b.key))
      .map((b) => b.written);
    t.blockedByFaults.unshift(
      ...t.blockers
        .filter((b) => !known.has(b.key))
        .map((b) => `${t.path}: Blocked by names no ticket: ${b.written}`),
    );
  }
  return tickets;
}

// The next ticket is the lowest-numbered ready-for-agent ticket whose every
// blocker is done. Features go in name order.
/** @type {(tickets: Ticket[], feature?: string) => Ticket | undefined} */
export function nextTicket(tickets, feature) {
  return tickets.find(
    (t) =>
      t.status === "ready-for-agent" &&
      t.openBlockers.length === 0 &&
      (!feature || t.feature === feature),
  );
}

// A markdown table of every open ticket, or one line saying there are none.
// Done tickets are left out, both as rows and as blockers. Wontfix tickets are
// left out as rows, and still show as a blocker of a ticket that lists one.
// A blocker shows as it is written on the ticket's Blocked by line. The table
// is as short as it can be, since an agent reads and repeats it: a feature is
// named on its first row only, the Blocked by column is there only when a row
// fills it, and no cell is padded.
/** @type {(tickets: Ticket[]) => string} */
export function openTable(tickets) {
  const open = tickets.filter(
    (t) => t.status !== "done" && t.status !== "wontfix",
  );
  if (open.length === 0) return "No open tickets.";
  const blocked = open.some((t) => t.openBlockers.length > 0);
  const rows = [
    ["Feature", "#", "Name", "Status", "Blocked by"],
    ["---", "---", "---", "---", "---"],
    ...open.map((t, i) => [
      t.feature === open[i - 1]?.feature ? "" : t.feature,
      t.number,
      t.name,
      t.status,
      t.openBlockers.join(", "),
    ]),
  ];
  return rows
    .map((row) => `|${(blocked ? row : row.slice(0, -1)).join("|")}|`)
    .join("\n");
}
