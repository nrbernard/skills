// Prints the table of every open ticket under .scratch/<feature>/issues/, or
// with the argument next the one ticket to pick up, in the feature named after
// it if one is.
import { nextLine, openTable, readTickets } from "./tickets.mjs";

const [command, feature] = process.argv.slice(2);
if (command === undefined) console.log(openTable(readTickets()));
else if (command === "next") console.log(nextLine(readTickets(), feature));
else {
  console.error("usage: status.mjs [next [feature]]");
  process.exitCode = 1;
}
