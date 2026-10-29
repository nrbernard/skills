import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  nextLine,
  nextTicket,
  openTable,
  readTickets,
} from "../skills/tickets/tickets.mjs";

/** @import { Ticket } from "../skills/tickets/tickets.mjs" */

/** @type {string[]} */
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

// Writes a .scratch of tickets to a temporary directory. Each ticket is
// [feature, number, status, its Blocked by line's text or null for no line].
/** @typedef {[feature: string, number: string, status: string, blockedBy: string | null]} Written */
/** @param {...Written} written */
function rootOf(...written) {
  const root = mkdtempSync(join(tmpdir(), "tickets-"));
  roots.push(root);
  for (const [feature, number, status, blockedBy] of written) {
    const dir = join(root, ".scratch", feature, "issues");
    mkdirSync(dir, { recursive: true });
    const line = blockedBy === null ? "" : `**Blocked by:** ${blockedBy}\n\n`;
    writeFileSync(
      join(dir, `${number}-a-ticket.md`),
      `# ${number}: Ticket ${number} of ${feature}\n\n${line}Status: ${status}\n`,
    );
  }
  return root;
}

/** @param {...Written} written */
const ticketsOf = (...written) => readTickets(rootOf(...written));

/** @type {(tickets: Ticket[], feature: string, number: string) => Ticket} */
const ticket = (tickets, feature, number) => {
  const found = tickets.find(
    (t) => t.feature === feature && t.number === number,
  );
  assert.ok(found, `no ticket ${feature}/${number}`);
  return found;
};
const NONE = "None (can start immediately)";

describe("a blocker in another feature", () => {
  it("is open while that ticket is open, though the ticket's own feature has a done ticket of the same number", () => {
    const tickets = ticketsOf(
      ["a", "01", "ready-for-agent", "b-02 (Ticket 02 of b)"],
      ["a", "02", "done", NONE],
      ["b", "02", "needs-triage", NONE],
    );

    assert.deepStrictEqual(ticket(tickets, "a", "01").openBlockers, ["b-02"]);
    assert.strictEqual(nextTicket(tickets), undefined);
  });

  it("is no longer open once that ticket is done, and the ticket is the next one", () => {
    const tickets = ticketsOf(
      ["a", "01", "ready-for-agent", "b-02 (Ticket 02 of b)"],
      ["a", "02", "needs-triage", NONE],
      ["b", "02", "done", NONE],
    );

    assert.deepStrictEqual(ticket(tickets, "a", "01").openBlockers, []);
    assert.strictEqual(nextTicket(tickets), ticket(tickets, "a", "01"));
  });

  it("is read beside one in the ticket's own feature, each shown as it is written on the line", () => {
    const tickets = ticketsOf(
      [
        "a",
        "01",
        "ready-for-agent",
        "03b (Ticket 03b of a, and its comma), v1-b-02 (Ticket 02 of v1-b)",
      ],
      ["a", "03b", "needs-triage", NONE],
      ["v1-b", "02", "ready-for-human", NONE],
    );

    assert.deepStrictEqual(ticket(tickets, "a", "01").openBlockers, [
      "03b",
      "v1-b-02",
    ]);
  });

  it("written for the ticket's own feature is read as the bare number is", () => {
    const open = ticketsOf(
      ["a", "01", "ready-for-agent", "a-02 (Ticket 02 of a)"],
      ["a", "02", "needs-triage", NONE],
    );
    const done = ticketsOf(
      ["a", "01", "ready-for-agent", "a-02 (Ticket 02 of a)"],
      ["a", "02", "done", NONE],
    );

    assert.deepStrictEqual(ticket(open, "a", "01").openBlockers, ["a-02"]);
    assert.deepStrictEqual(ticket(done, "a", "01").openBlockers, []);
  });
});

describe("a Blocked by line that names no ticket, or cannot be read", () => {
  /** @param {Ticket[]} tickets */
  const faultsOf = (tickets) => tickets.flatMap((t) => t.blockedByFaults);

  it("is a fault naming the ticket and the blocker, for a number that is no ticket in the feature and for a feature that is no directory", () => {
    const tickets = ticketsOf(
      [
        "a",
        "01",
        "needs-triage",
        "09 (Nothing), b-01 (Nothing there), c-02 (No such feature)",
      ],
      ["b", "02", "done", NONE],
    );

    assert.deepStrictEqual(faultsOf(tickets), [
      ".scratch/a/issues/01-a-ticket.md: Blocked by names no ticket: 09",
      ".scratch/a/issues/01-a-ticket.md: Blocked by names no ticket: b-01",
      ".scratch/a/issues/01-a-ticket.md: Blocked by names no ticket: c-02",
    ]);
    assert.deepStrictEqual(ticket(tickets, "a", "01").openBlockers, [
      "09",
      "b-01",
      "c-02",
    ]);
  });

  for (const [line, unread] of [
    ["v1 ticket 23", "v1 ticket 23"],
    ["23", "23"],
    ["02 (Ticket 02 of a), and ticket 23 of v1", "and ticket 23 of v1"],
    ["None", "None"],
    [
      "None (can start immediately), 02 (Ticket 02 of a)",
      "None (can start immediately)",
    ],
    ["02 (Ticket 02 of a),", ","],
    ["02 (Ticket 02 of a),02 (Ticket 02 of a)", ","],
    ["x02 (Ticket 02 of a)", "x02 (Ticket 02 of a)"],
    ["", ""],
  ]) {
    it(`is a fault naming the ticket and what could not be read, for the line ${JSON.stringify(line)}`, () => {
      const tickets = ticketsOf(
        ["a", "01", "needs-triage", line],
        ["a", "02", "needs-triage", NONE],
      );

      assert.deepStrictEqual(faultsOf(tickets), [
        `.scratch/a/issues/01-a-ticket.md: Blocked by cannot be read: "${unread}"`,
      ]);
    });
  }

  it("still holds the blockers on a line that cannot be read, so the ticket is not the next one", () => {
    const tickets = ticketsOf(
      [
        "a",
        "01",
        "ready-for-agent",
        "see v1, 02 (Ticket 02 of a), and more, b-01 (Ticket 01 of b)",
      ],
      ["a", "02", "needs-triage", NONE],
      ["b", "01", "needs-triage", NONE],
    );

    assert.deepStrictEqual(ticket(tickets, "a", "01").openBlockers, [
      "02",
      "b-01",
    ]);
    assert.strictEqual(nextTicket(tickets), undefined);
    assert.deepStrictEqual(faultsOf(tickets), [
      '.scratch/a/issues/01-a-ticket.md: Blocked by cannot be read: "see v1, , and more"',
    ]);
  });

  it("reads a title holding brackets, and a feature whose name holds a capital, a dot or an underscore", () => {
    const tickets = ticketsOf(
      [
        "a",
        "01",
        "ready-for-agent",
        "02 (Ticket 02 (of a), bracketed), B_c.d-01 (Ticket 01 of B_c.d)",
      ],
      ["a", "02", "needs-triage", NONE],
      ["B_c.d", "01", "needs-triage", NONE],
    );

    assert.deepStrictEqual(ticket(tickets, "a", "01").openBlockers, [
      "02",
      "B_c.d-01",
    ]);
    assert.deepStrictEqual(faultsOf(tickets), []);
  });

  it("is not a fault on a line of blockers that are tickets, on one that says None, or on a ticket with no line", () => {
    const tickets = ticketsOf(
      [
        "a",
        "01",
        "needs-triage",
        "02 (Ticket 02 of a), b-01 (Ticket 01 of b), a-03 (Ticket 03 of a)",
      ],
      ["a", "02", "wontfix", NONE],
      ["a", "03", "done", null],
      ["b", "01", "done", NONE],
    );

    assert.deepStrictEqual(faultsOf(tickets), []);
  });
});

describe("the table of open tickets", () => {
  it("names a feature on its first row only, and leaves out done and wontfix tickets as rows and done ones as blockers", () => {
    const tickets = ticketsOf(
      [
        "a",
        "01",
        "ready-for-agent",
        "02 (Ticket 02 of a), 03 (Ticket 03 of a)",
      ],
      ["a", "02", "done", NONE],
      ["a", "03", "wontfix", NONE],
      ["a", "04", "needs-triage", NONE],
      ["b", "01", "needs-triage", "a-04 (Ticket 04 of a)"],
    );

    assert.strictEqual(
      openTable(tickets),
      [
        "|Feature|#|Name|Status|Blocked by|",
        "|---|---|---|---|---|",
        "|a|01|Ticket 01 of a|ready-for-agent|03|",
        "||04|Ticket 04 of a|needs-triage||",
        "|b|01|Ticket 01 of b|needs-triage|a-04|",
      ].join("\n"),
    );
  });

  it("has no Blocked by column when no open ticket has an open blocker", () => {
    const tickets = ticketsOf(
      ["a", "01", "ready-for-agent", "02 (Ticket 02 of a)"],
      ["a", "02", "done", NONE],
    );

    assert.strictEqual(
      openTable(tickets),
      [
        "|Feature|#|Name|Status|",
        "|---|---|---|---|",
        "|a|01|Ticket 01 of a|ready-for-agent|",
      ].join("\n"),
    );
  });

  it("is one line when every ticket is done, and when there is no .scratch", () => {
    const root = mkdtempSync(join(tmpdir(), "tickets-"));
    roots.push(root);

    assert.strictEqual(
      openTable(ticketsOf(["a", "01", "done", NONE])),
      "No open tickets.",
    );
    assert.strictEqual(openTable(readTickets(root)), "No open tickets.");
  });
});

describe("the line for the next ticket", () => {
  it("names the ticket and its file, in the feature asked for when one is", () => {
    const tickets = ticketsOf(
      ["a", "01", "ready-for-agent", "02 (Ticket 02 of a)"],
      ["a", "02", "needs-triage", NONE],
      ["a", "03", "ready-for-agent", NONE],
      ["b", "01", "ready-for-agent", NONE],
    );

    assert.strictEqual(
      nextLine(tickets),
      "a 03: Ticket 03 of a (.scratch/a/issues/03-a-ticket.md)",
    );
    assert.strictEqual(
      nextLine(tickets, "b"),
      "b 01: Ticket 01 of b (.scratch/b/issues/01-a-ticket.md)",
    );
  });

  it("says no ticket is ready when none is, and when there is no such feature", () => {
    const tickets = ticketsOf(["a", "01", "needs-triage", NONE]);

    assert.strictEqual(nextLine(tickets), "No ticket is ready.");
    assert.strictEqual(nextLine(tickets, "c"), "No ticket is ready.");
  });
});
