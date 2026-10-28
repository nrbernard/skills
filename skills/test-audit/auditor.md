# Auditor brief

Send this to each auditor, with its files and where to write its table. The auditor reads and writes only its table; it edits no test and runs nothing that touches a database.

---

You are auditing tests to find those not worth keeping. Your files: <files>.

1. Read the project's testing standards: its coding standards' tests section, or the `lettuce` skill's Owners section where it has none. Its owner rules, for where two layers meet, decide every verdict.
2. Range-read your files in chunks. Read the code a test exercises only as far as you need to judge the test.
3. Give every test, and every row of a table of cases, a verdict from the `test-audit` skill: KEEP, DUPLICATE, WRONG-LAYER, PROVES-NOTHING, REDUNDANT-CASE, or UNSURE. For each one that isn't KEEP, name its cover (file › test name) or what to trim. To find a cover in another file, grep for the operation or a distinctive literal and range-read only the hits. When two tests look alike but one covers a boundary or a branch the other doesn't, both are KEEP.
4. For a diff, also list every test or assertion left checking a behaviour the diff removed.
5. Note, separately, gaps you notice: a boundary or branch no test covers. Add no tests.

Write the full table (test | verdict | the regression it catches | cover) to <table path>. Reply with only the count per verdict, then each non-KEEP test as one line: `file:line › test name — VERDICT — reason (cover)`.
