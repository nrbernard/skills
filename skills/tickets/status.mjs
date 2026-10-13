// Prints a markdown table of every open ticket under .scratch/<feature>/issues/.
// Done tickets are left out, both as rows and as blockers. Wontfix tickets are
// left out as rows, and still show as a blocker of a ticket that lists one.
// A blocker shows as it is written on the ticket's Blocked by line: a bare
// number, or <feature>-NN for a ticket in another feature.
import { readTickets } from "./tickets.mjs";

console.log("| Feature | # | Name | Status | Blocked by |");
console.log("| --- | --- | --- | --- | --- |");
for (const t of readTickets()) {
  if (t.status === "done" || t.status === "wontfix") continue;
  console.log(
    `| ${t.feature} | ${t.number} | ${t.name} | ${t.status} | ${t.openBlockers.join(", ")} |`,
  );
}
