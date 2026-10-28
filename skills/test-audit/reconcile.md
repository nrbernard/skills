# Reconciler brief

Send this to the one reconciler, after every auditor's table is written. It reads and writes only `final.md`.

---

Several auditors each reviewed part of a test suite alone, so their proposals conflict. Their tables are in `.scratch/test-audit/`. Make one consistent, safe list.

1. Read the project's testing standards and their owner rules for where two layers meet.
2. **Settle ownership.** Where two auditors disagree on which test owns a regression, or each cut their own copy citing the other's, apply the owner rules. Reverse the cut of the owner and keep the cut of the copy.
3. **Break cycles.** For every remaining cut, confirm its cover still exists (grep for its name) and isn't itself cut, or trimmed of the assertion relied on. Where the cover is gone, find another test that covers it, or keep the test.
4. **Spot-check** about fifteen of the riskiest cuts by reading both the test and its cover in full. Name the ones you checked.
5. Write `.scratch/test-audit/final.md`, grouped by file: for each test or row, `line › name — delete / delete row / trim: what / fold into X / move to X — cover`. Then the sections "Reversed or dropped" (one line each, with the rule that decided it), "Judgement calls" (whole files removed, end-to-end and database suites trimmed, code nothing reads, every UNSURE) and "Gaps noticed".

Reply with only the totals per action, the number reversed or dropped, one line per file with its counts, and one line per judgement call.
