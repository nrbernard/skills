// Prints the work in the repo this runs in that is not yet merged into its main
// branch.
import { oven } from "./oven.mjs";

console.log(oven(process.cwd(), Math.floor(Date.now() / 1000)));
