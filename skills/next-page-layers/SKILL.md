---
name: next-page-layers
description: "The container/presentational split for Next.js App Router pages: a data layer, a thin async page, a synchronous view, and few Playwright tests. Use when adding or changing a page, a server action, or their tests."
---

# Next.js page layers

Each route is the container/presentational split applied to the server/client boundary: three layers, each tested its own way, plus a few browser tests. The Next.js testing guide recommends end-to-end tests for async server components, since Vitest and React Testing Library don't render them. Keeping the view synchronous leaves only the thin page needing a real server, so browser tests stay few.

## 1. Data layer

Fetching, database queries and auth checks live in modules as plain async functions, never inline in a page. Most logic tests live here: filtering, error handling, permission checks.

Test them with Vitest in Node, with the database and network Nulled (the `nullables` skill).

## 2. Thin page

`page.tsx` only wires: it awaits `params` and `searchParams`, calls the data layer (independent calls together in `Promise.all`), may call `notFound()` or `redirect()`, and renders the view with plain props. Anything more, such as parsing an id or choosing between views, is a plain function with input → output tests.

Server actions are thin the same way: a plain function reads the `FormData`, the data layer writes, and the action revalidates or redirects.

The page and its actions are covered only by browser tests, so every branch left in them is a branch only a browser test sees.

## 3. View

The view is named for its route (`SavingsView` beside `savings/page.tsx`), isn't `async`, and takes all its data as props. It may be a server or a client component; `"use client"` goes on the view or on the interactive part it renders, never on the page.

- Props are the data layer's results in their domain shape. The view calls pure helpers on them while it renders.
- Server actions arrive as props, so a test can pass its own.
- Router hooks (`useRouter`, `useSearchParams`, `usePathname`) need the App Router, which jsdom lacks. Read them in a small client wrapper and pass the values and callbacks into the view as props.
- Anything that imports `server-only` stays out of the view's imports; a view imports the data layer's types only.

Test it with Vitest and React Testing Library in jsdom, passing fixture props. Most UI tests live here.

- Find elements as a user would: `getByRole` first, then label and text.
- Drive it with `@testing-library/user-event`: type, choose, click, submit.
- A `vi.fn()` passed as a callback prop is the view's tracked output: assert on what it received, and give it a resolved value to stand in for the action's answer, a refusal included.
- jsdom lays nothing out, so a chart sized from its container draws nothing. Test the series where it's computed, and the text around the chart in the view.

```tsx
test("adding a bucket sends its name and target", async () => {
  const addBucket = vi.fn().mockResolvedValue({ ok: true });
  render(<SavingsView savings={savings({ buckets: [] })} addBucket={addBucket} />);

  await userEvent.type(screen.getByLabelText("Name"), "Emergency fund");
  await userEvent.type(screen.getByLabelText("Target"), "10000");
  await userEvent.click(screen.getByRole("button", { name: "Add bucket" }));

  expect(addBucket).toHaveBeenCalledWith({ name: "Emergency fund", target: "10000" });
});
```

### Setup

- View and client-component tests run in jsdom, everything else in Node: two Vitest projects split by file, or `// @vitest-environment jsdom` atop each view test.
- React Testing Library cleans up after each test only when Vitest's globals are on. With them off, call `cleanup()` in an `afterEach` in the jsdom setup file.

## 4. Browser tests

Playwright against a real Next.js server covers what only that server shows: routing, a page actually fetching and rendering, loading states and Suspense streaming, error and not-found pages, redirects, and cookie or header behaviour. Keep them few and on the critical paths; each UI state belongs to a view test.

- Run against a dev server on a port Playwright picks, so parallel checkouts don't collide, pointed at a database reserved for tests.
- Seed that database through the real data layer before each test, and give the server no keys to third-party services.
- Keep them in their own folder (`e2e/`), so Vitest and Playwright each find only their own files.
- Timeouts live in the Playwright config.

## Where a test goes

| The regression | Its owner |
| --- | --- |
| A rule, filter or permission | Data layer test, in Node |
| Parsing a route param or a form | Plain function test |
| What a state shows, what a form does | View test, in jsdom |
| A route, redirect, not-found page, stream, cookie or header | Browser test |
