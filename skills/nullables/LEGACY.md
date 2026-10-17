# Converting existing code to Nullables

Nullables and existing test doubles coexist, even in one test, so every step keeps the suite green. Convert where tests are painful to maintain or block refactoring; leave easy code alone.

## Pick a direction

Draw the dependency tree of the code to convert, ignoring third-party code.

- **Small tree: Climb the Ladder.** Convert bottom-up (post-order), so each node's dependencies are already Nullable when you reach it. For each node, the first match:
  1. Logic: make its behavior visible through return values or getters; add tests.
  2. Already Nullable: convert its tests.
  3. Wrapper over third-party code: add an Embedded Stub; write Narrow Integration Tests.
  4. Non-wrapper using third-party code: extract a Wrapper, handle it as 3, then handle the rest.
  5. Otherwise: Fake It Once You Make It; convert its tests.
- **Large tree: Descend the Ladder.** Convert one class plus its direct dependencies, nothing deeper, and move down over later sessions. Make each direct dependency Nullable with the first match: already Nullable or infrastructure-free → no change; Fake It Once You Make It; Embedded Stub for a low-level wrapper; extract a Wrapper around third-party code; otherwise a Throwaway Stub. Then Fake It in the class itself and replace its mocks.

## Throwaway Stub

An Embedded Stub on a dependency whose own chain you aren't converting yet. It breaks the chain of overlapping sociable tests, so it can hide behavior changes: replace it with Fake It Once You Make It as soon as the dependency becomes Nullable.

## Replace Mocks with Nullables

Inline setup blocks and shared helpers first, so each test shows its doubles. Then, per double:

1. Construct the Nulled real class in its place.
2. Configured return values → Configurable Responses.
3. Emitted events → Behavior Simulation.
4. Call assertions (`toHaveBeenCalledWith`, `verify`) → Output Tracking, converted last, asserting on `tracker.data`.

Run the tests after each double. Finish by re-extracting setup into Signature Shielding helpers.
