// Reads every ticket under .scratch/<feature>/issues/ from each file's H1,
// **Status:** and **Blocked by:** lines. Ticket numbers restart in each
// feature, so a blocker written as a bare number is a ticket in the blocked
// ticket's own feature, and one in another feature is written <feature>-NN.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// One blocker, NN (title) or <feature>-NN (title). A title can hold brackets of its own.
const BLOCKER = /(?<![\w.-])(?:([\w.-]+)-)?(\d+[a-z]?) \((?:[^()]|\([^()]*\))*\)/g;
// A whole line of blockers, each parted from the next by a comma and a space.
const BLOCKERS = new RegExp(`^${BLOCKER.source}(?:, ${BLOCKER.source})*$`);

const NONE = "None (can start immediately)";

// Ticket numbers restart in each feature, so a ticket is known by both.
const keyOf = (feature, number) => `${feature}/${number}`;

// The blockers a Blocked by line names, in order, each as it is written, and
// what the line holds besides them when it is neither a list of blockers nor
// NONE. A blocker on a line that holds more is still a blocker. A ticket with
// no line has no blockers and nothing unread.
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
  const tickets = [];
  for (const feature of readdirSync(join(root, ".scratch")).sort()) {
    const dir = join(".scratch", feature, "issues");
    if (!existsSync(join(root, dir))) continue;
    for (const file of readdirSync(join(root, dir))
      .filter((f) => f.endsWith(".md"))
      .sort()) {
      const path = join(dir, file);
      const text = readFileSync(join(root, path), "utf8");
      const [, number, name] = text.match(/^# (\S+?):\s*(.+)$/m) ?? [undefined, file, file];
      const status = text.match(/^\*\*Status:\*\*\s*(.+)$/m)?.[1].trim() ?? "?";
      const blockedBy = text.match(/^\*\*Blocked by:\*\*[ \t]*(.*)$/m)?.[1].trim();
      const { blockers, unread } = readBlockedBy(blockedBy, feature);
      // What a test holds every ticket in the repo to having none of: each says
      // which ticket and what is wrong with its Blocked by line.
      const blockedByFaults = unread === undefined ? [] : [`${path}: Blocked by cannot be read: "${unread}"`];
      tickets.push({ feature, number, name, status, blockers, blockedByFaults, path });
    }
  }
  const done = new Set(tickets.filter((t) => t.status === "done").map((t) => keyOf(t.feature, t.number)));
  const known = new Set(tickets.map((t) => keyOf(t.feature, t.number)));
  for (const t of tickets) {
    t.openBlockers = t.blockers.filter((b) => !done.has(b.key)).map((b) => b.written);
    t.blockedByFaults.unshift(...t.blockers.filter((b) => !known.has(b.key)).map((b) => `${t.path}: Blocked by names no ticket: ${b.written}`));
  }
  return tickets;
}

// The next ticket is the lowest-numbered ready-for-agent ticket whose every
// blocker is done. Features go in name order.
export function nextTicket(tickets, feature) {
  return tickets.find((t) => t.status === "ready-for-agent" && t.openBlockers.length === 0 && (!feature || t.feature === feature));
}
