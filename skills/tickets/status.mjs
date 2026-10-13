// Prints the table of every open ticket under .scratch/<feature>/issues/.
import { openTable, readTickets } from "./tickets.mjs";

console.log(openTable(readTickets()));
