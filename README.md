# nestjar

**Every pound, dollar and euro, in its own jar.**

nestjar is zero-based budgeting for couples who earn, save and spend across currencies. This repository is a fully working, front-end-only prototype of the product's core story: a couple sets up a shared budget, plans a month, and pours every bit of income into jars until nothing is left without a job.

It is built to be walked through in an interview, and to be built on.

## The story

| Stage       | Route             | What happens                                                        |
| ----------- | ----------------- | ------------------------------------------------------------------- |
| Welcome     | `/welcome`        | The pitch, and a single way forward.                                |
| Setup       | `/setup`          | Name the budget, pick a base currency, invite a partner.            |
| Blueprint   | `/plan/:step`     | Expected income, starting balances, a target for every jar, review. |
| Budget      | `/budget`         | The central jar drains as money is seeded into category jars.       |
| Spend       | `/budget` (sheet) | Log a purchase and watch its jar change state.                      |
| At a glance | `/budget/review`  | The whole shelf, every jar and what is left in it.                  |

The demo household is Leila (paid in US dollars) and Zaid (paid in pounds). Their plan leaves £58 unassigned on purpose: after "Seed all to plan", the app asks where that money should go. That final decision is the point of zero-based budgeting, so the prototype makes you take it.

Accounts and Settings appear in navigation and explain what they would do. Every other path is closed by a route guard that sends you back to your place in the story, so the demo cannot be broken by a stray click or a deep link.

## Run it

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:5173
```

| Command            | Does                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `npm run check`    | Typecheck, lint, unit tests and a production build.                                         |
| `npm run test:e2e` | Keyboard-only walkthrough of the happy path with axe scans, on phone and desktop viewports. |
| `npm run build`    | Static build into `dist/`.                                                                  |

Open the **Demo** menu at any time to restart the story, hide the presenter tips or open the **Design notes** (`/system`): the design system and the decisions behind the prototype. They are also a panel in the app's navigation.

### Vite, Vercel and Cloudflare

Vite is the build tool: it runs the dev server and bundles the app into static files. Vercel and Cloudflare Pages are hosts that serve those files. Both are configured:

- **Vercel**: import the repo. `vercel.json` sets the framework and the single-page-app rewrite.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`. `public/_redirects` handles the rewrite.

## What to look at

**UX**

- The central jar is the product's signature. It is a real gauge of unassigned money, not decoration, and it drains with a transform animation that turns off under reduced motion.
- Four jar states (not seeded, seeded, spending, overspent) are carried by words as well as colour and pattern.
- Multi-currency is honest: income counts at whichever of the fixed and live rates gives less, spending at whichever costs more. A spend leads with the figure on the bank statement, then what the jar was charged and the rate used.
- Seeding is optimistic, so the jar reacts the moment you confirm, and rolls back if the write fails.
- Mobile first: bottom tab bar, a thumb-reachable "Log spend" button and bottom sheets. From 64rem the same app becomes a side-navigation layout.

**Accessibility** (details in [docs/accessibility.md](docs/accessibility.md))

- The entire happy path is covered by an automated keyboard-only test. It never touches a mouse.
- Focus moves to the new page's heading on every route change, and to a stable landmark whenever the control you pressed disappears.
- Sheets are native `<dialog>` elements: focus is contained, Escape closes them, and focus returns to what opened them.
- Brand colours that failed WCAG AA were given accessible variants for text and control borders, and the ratios are documented.
- Forced-colours (Windows High Contrast) mode is styled explicitly.

**Design system** (live at `/system`)

- Tokens in three tiers: primitives, semantic and component. Screens never hard-code a colour.
- One configurable Button, and primitives that emit events rather than deciding behaviour.
- ESLint enforces the layers: `ui/` cannot import nestjar code, and `components/` cannot fetch data.

**Engineering** (details in [docs/architecture.md](docs/architecture.md))

- Components never touch data directly. They call hooks, hooks call service interfaces, and an adapter implements those interfaces.
- The mock adapter is an in-memory database of Postgres-shaped rows with transactions, validation that mirrors database constraints, and simulated latency. Swapping in Supabase is one environment variable and one adapter; no component changes.
- Money is integer minor units everywhere. Domain logic is pure, framework-free and unit tested.
- TypeScript in its strictest practical settings, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

## Project layout

```
src/
  domain/      Pure business logic: money, exchange rules, budgeting maths. No React.
  services/    Contracts, row types, mappers, and the adapters that implement them.
    mock/      In-browser database and demo fixtures (the executable spec).
    supabase/  The real backend's adapter, stubbed method by method.
  data/        TanStack Query hooks. The only layer that calls services.
  ui/          Generic primitives that know nothing about nestjar: Button, Card, Badge, ProgressTrack, NavItem, fields, Sheet, Toast.
  components/  nestjar's own presentational pieces: JarGauge, JarState, Money, MoneyField, Logo.
  features/    Screens, grouped by the part of the story they tell.
  app/         Routing, route guards, the shell and focus management.
e2e/           Playwright: keyboard walkthrough and axe scans.
docs/          Architecture, accessibility and decision records.
```

## Stack

React 19, TypeScript, Vite, React Router, TanStack Query, CSS Modules with design tokens, Vitest and Testing Library, Playwright with axe-core. Fonts (Fraunces, Inter, IBM Plex Mono) are self-hosted through Fontsource, so the app makes no third-party requests.

---

Designed and engineered by Sadiyo Hassan at Aalam Studio.
