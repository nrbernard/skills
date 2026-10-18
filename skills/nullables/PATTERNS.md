# Nullable code shapes

TypeScript shapes for the patterns in [SKILL.md](SKILL.md). Names are illustrative; the shapes are the point.

## Embedded Stub

The wrapper takes the third-party API through its constructor. `create()` passes the real one; `createNull()` passes a stub living in the same file, implementing only what the wrapper calls.

```ts
interface DateApi {
  now(): number;
}

export class Clock {
  static create() {
    return new Clock(globalThis.Date);
  }

  static createNull({ now = "2000-01-01T00:00:00Z" }: { now?: string | Date } = {}) {
    return new Clock(new StubbedDate(new Date(now).getTime()));
  }

  private constructor(private readonly date: DateApi) {}

  now(): Date {
    return new Date(this.date.now());
  }
}

class StubbedDate implements DateApi {
  constructor(private readonly time: number) {}
  now() {
    return this.time;
  }
}
```

For Postgres, the low-level wrapper owns the driver, and its Embedded Stub implements the driver's `query` returning configured rows. Higher-level stores (`ImportStore`, `AccountStore`) Fake It on top, taking domain-shaped responses and turning them into rows.

## Configurable Responses

```ts
export class ConfigurableResponses<T> {
  private readonly responses: T | T[];

  static create<T>(responses: T | T[], name?: string) {
    return new ConfigurableResponses(responses, name);
  }

  private constructor(responses: T | T[], private readonly name?: string) {
    this.responses = Array.isArray(responses) ? [...responses] : responses;
  }

  next(): T {
    const response = Array.isArray(this.responses) ? this.responses.shift() : this.responses;
    if (response === undefined) {
      throw new Error(`No more responses configured${this.name ? ` in ${this.name}` : ""}`);
    }
    return response;
  }
}
```

The stub calls `next()` each time the wrapper reaches the outside world. `createNull()` supplies a sensible default when the option is omitted, so `createNull()` with no arguments always works. When a response is itself an array, wrap it: `[[a, b]]` is one response.

## Output Tracking

```ts
import { EventEmitter } from "node:events";

export class OutputTracker<T> {
  private readonly _data: T[] = [];
  private readonly listener = (data: T) => {
    this._data.push(data);
  };

  static create<T>(emitter: EventEmitter, event: string) {
    return new OutputTracker<T>(emitter, event);
  }

  private constructor(private readonly emitter: EventEmitter, private readonly event: string) {
    emitter.on(event, this.listener);
  }

  get data(): T[] {
    return this._data;
  }

  clear(): T[] {
    const result = [...this._data];
    this._data.length = 0;
    return result;
  }

  stop() {
    this.emitter.off(this.event, this.listener);
  }
}
```

The wrapper emits after each write, in domain terms rather than raw SQL or bytes:

```ts
const SAVE_EVENT = "save";

export class ImportStore {
  private readonly emitter = new EventEmitter();

  trackSaves() {
    return OutputTracker.create<{ fileName: string; contentHash: string }>(this.emitter, SAVE_EVENT);
  }

  async save(fileName: string, bytes: Uint8Array) {
    const contentHash = hash(bytes);
    await this.db.insertImport({ fileName, bytes, contentHash });
    this.emitter.emit(SAVE_EVENT, { fileName, contentHash });
  }
}
```

## Behavior Simulation

The real listener and `simulateXxx()` share one private handler, so a simulated event runs exactly the production path.

```ts
export class ExportWatcher {
  start() {
    this.watcher.on("add", (path) => this.handleNewFile(path));
  }

  simulateNewFile(path: string) {
    this.handleNewFile(path);
  }

  private handleNewFile(path: string) {
    // real behavior
  }
}
```

## Fake It Once You Make It

A higher-level class's `createNull()` composes Nulled dependencies and translates its options into theirs. Its `create()` takes each dependency as an optional override defaulting to the real one, so a test builds the subject under test through `create()`, passing in Nulled dependencies it holds a tracker on.

```ts
export class Ledger {
  static create({ store = ImportStore.create(), clock = Clock.create() }: { store?: ImportStore; clock?: Clock } = {}) {
    return new Ledger(store, clock);
  }

  static createNull({ storedImports = [], now }: { storedImports?: StoredImport[]; now?: string } = {}) {
    return Ledger.create({ store: ImportStore.createNull({ imports: storedImports }), clock: Clock.createNull({ now }) });
  }

  private constructor(private readonly store: ImportStore, private readonly clock: Clock) {}
}
```

## Test instances of Values

Value objects with many fields get `createTestInstance(overrides = {})` with defaults for every field. It exists for tests only; production code builds Values from real data.

## Collaborator-Based Isolation

When a dependency's output is irrelevant to the behavior under test, build the expectation by calling the dependency (`address.render()`) instead of hard-coding its output. Reach for this sparingly: it couples the test to the collaborator.
