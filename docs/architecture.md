# Architecture

## Layers

```
features/*  ──uses──▶  data/* (hooks)  ──calls──▶  services/contracts.ts
    │                      │                              ▲
    ▼                      ▼                              │ implements
  ui/*, components/*    domain/*                 services/mock | services/supabase
                        (pure logic)                      │
                                                          ▼
                                            rows.ts ◀──▶ mappers.ts ◀──▶ domain/types.ts
```

Each arrow points one way. Nothing below a layer imports from above it.

| Layer         | Knows about                     | Never knows about             |
| ------------- | ------------------------------- | ----------------------------- |
| `domain/`     | Nothing but itself              | React, storage, the network   |
| `services/`   | `domain/`                       | React, the UI                 |
| `data/`       | `services/contracts`, `domain/` | Which adapter is running      |
| `ui/`         | Tokens only                     | nestjar, money, data, screens |
| `components/` | `domain/`, `ui/`, the brand     | Data hooks, services, screens |
| `features/`   | Everything above                | Adapters, rows                |

ESLint enforces three of these rules: nothing outside `src/services/` may import an adapter directly, `ui/` may not import `domain/`, `components/`, `data/` or `features/`, and `components/` may not import `data/` or `features/`.

### ui, components and features

- `ui/` holds generic primitives: Button, Card, Badge, ProgressTrack, NavItem, fields, Sheet, Toast. They know tokens and nothing about nestjar, and could move to another product unchanged.
- `components/` holds nestjar's own pieces: JarGauge, JarStateBadge and JarProgress, Money, MoneyField, Logo. They understand money, currencies and jar states, but take everything as props. They never fetch data or navigate.
- `features/` holds screens. A screen calls data hooks, passes values down and decides what each event does.

Components emit, screens decide. A Button reports a press through `onClick`, or renders a real link when given `href`; it never navigates in code or calls a service.

## Domain

`src/domain` holds the rules that make nestjar nestjar, as pure functions:

- `money.ts`: integer minor units, parsing what people type, formatting per currency.
- `exchange.ts`: the conservative rule. Inflows convert at whichever of fixed and live gives less base currency; outflows at whichever gives more. Display conversion uses the fixed rate so numbers do not wobble.
- `budget.ts`: month and jar summaries, the four jar states, "seed all to plan" and seed validation.
- `blueprint.ts`: the month draft and step validation.
- `month.ts`: `YYYY-MM` month keys and date helpers.

These have the densest tests, because they carry the most consequence.

## Services

`contracts.ts` defines six services: `session`, `budgets`, `rates`, `months`, `transactions` and `demo`. Inputs and outputs are domain types. Errors cross the boundary as `ServiceError` with a stable `code`, which the UI maps to copy in `lib/errorMessages.ts`.

### The mock adapter

`services/mock` is a small in-memory database, not a pile of fixtures:

- Tables hold rows shaped exactly like the Supabase schema (`rows.ts`).
- Writes run inside `db.transaction()`, which works on a copy and commits only if the callback succeeds. Multi-row writes like completing a blueprint or seeding many jars are atomic.
- Business rules a database would enforce are enforced here: a month must be active before seeding, seeding cannot exceed what is left, a transaction's date must fall in its month.
- Every call waits a configurable latency (`VITE_MOCK_LATENCY_MS`), so loading and pending states are real.
- Committed state is mirrored to `sessionStorage`, so a refresh keeps your place.

`services/mock/services.test.ts` is the executable specification. A new adapter is done when it passes the same scenarios.

### Swapping in Supabase

1. `npm install @supabase/supabase-js` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Implement each method in `services/supabase/index.ts`. Each stub names the tables or RPC it needs.
3. Query into the row types in `rows.ts` and convert with `mappers.ts`, which both adapters share.
4. Move multi-row writes (`completeBlueprint`, `seedMany`, `createBudget`, `invitePartner`) into Postgres functions called with `rpc`, so they keep their atomicity.
5. Set `VITE_DATA_SOURCE=supabase`.

No hook or component changes.

## Data hooks

`data/` wraps services in TanStack Query. All cache keys live in `queryKeys.ts`. `useBudgetMonth()` combines the budget, its structure, the month snapshot and rates into one `pending | error | ready` state, so each screen handles those cases once.

Two patterns worth knowing:

- **Optimistic seeding.** `useSeed` writes the new amounts into the cached snapshot before the service responds, and restores the previous snapshot on error.
- **Completion callbacks.** When a write moves the story forward (inviting a partner, starting the month), route guards react to the cache change by leaving the current screen. TanStack Query skips per-call `mutate(…, { onSuccess })` callbacks on unmounted components, so those hooks accept an `onCompleted` option that runs in the same tick as the cache write.

## Routing and the locked-down happy path

`app/journey.tsx` derives a single **stage** from server state: `create`, `invite`, `plan` or `budget`. Every route is wrapped in a `StageGate` that lists the stages it belongs to; anything else redirects to the current stage's home. Refreshing, deep-linking or pressing Back always lands somewhere that makes sense.

The blueprint wizard is one route (`/plan/:step`) so its draft survives between steps, and it refuses to render a step while an earlier one is invalid.

## Styling

Design tokens are CSS custom properties in three tiers, imported through `styles/tokens.css`:

| File                    | Holds                          | Example              |
| ----------------------- | ------------------------------ | -------------------- |
| `tokens/primitives.css` | Raw brand values               | `--honey-amber`      |
| `tokens/semantic.css`   | What a value is for            | `--color-honey-text` |
| `tokens/components.css` | A single component's decisions | `--button-height-sm` |

Modules read semantic and component tokens, never primitives, and never hard-code a colour. Components use CSS Modules. There is no CSS-in-JS runtime and no utility framework, so the stylesheet reads like the design system it is.

The Design notes page (`/system`) renders every token and primitive from the real code. When a primitive gains a variant, add it there.

## Testing

| Suite      | Tool                              | Covers                                              |
| ---------- | --------------------------------- | --------------------------------------------------- |
| Domain     | Vitest                            | Money, exchange rules, budget maths                 |
| Services   | Vitest                            | The contract scenarios, against the mock adapter    |
| UI         | Vitest, Testing Library, axe-core | Keyboard behaviour and ARIA wiring of primitives    |
| End to end | Playwright, axe-core              | The full story, keyboard only, on phone and desktop |
