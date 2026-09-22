# Working in this repo

nestjar-prototype is a front-end-only, portfolio-grade prototype of nestjar: zero-based, multi-currency budgeting for couples. Read `README.md` for the story and `docs/architecture.md` before making structural changes.

## Commands

- `npm run dev`: dev server.
- `npm run check`: typecheck, lint, unit tests, build. Run before calling any change done.
- `npm run test:e2e`: keyboard-only Playwright walkthrough with axe. Run after any UI change. If Chromium is preinstalled, set `PLAYWRIGHT_CHROMIUM_PATH` instead of downloading one.

## Architecture rules

- Dependencies point one way: `features → data → services/contracts`, and anything may use `domain`. `domain/` imports nothing from React or services.
- Components never call services. Add or extend a hook in `src/data/`, and put its cache key in `queryKeys.ts`.
- Only `src/services/index.ts` chooses an adapter. ESLint blocks imports of `services/mock` or `services/supabase` elsewhere.
- A new service method needs: the contract in `contracts.ts`, the mock implementation, a scenario in `services/mock/services.test.ts`, and a named stub in `services/supabase/index.ts`.
- Rows (`rows.ts`) are snake_case and mirror Postgres. Domain types are camelCase. Convert only in `mappers.ts`.
- Money is always integer minor units (`Minor`). Never store or pass floats. Use `parseAmount`, `formatMoney` and `convertConservatively`.
- Business rules belong in `domain/` as pure functions with unit tests, then get enforced again inside the adapter (as a database would).
- Demo data lives only in `services/mock/fixtures/demoHousehold.ts`. UI prefills come from `services.demo.getScript()`, which a production adapter returns as null.

## The happy path is locked on purpose

- Every route is wrapped in `StageGate` (`app/journey.tsx`). A new screen must declare which stages it belongs to.
- Do not add controls that lead off the story. If a feature is outside the demo, surface it as a `LockedPage` that explains itself.
- When a write moves the person to the next stage, do the follow-up (toast, navigate) in the hook's `onCompleted` option, not a per-call `onSuccess`. See `useCompleteBlueprint`.

## UI rules

- Use primitives from `@/ui` before writing new markup. Extend a primitive rather than restyling it locally.
- `ui/` is generic (no domain, data or features). `components/` is nestjar-specific but presentational (no data hooks). ESLint enforces both.
- Components emit events; screens decide. Buttons take `onClick` for actions and `href` for navigation.
- When a primitive gains a variant, show it on the Design notes page (`features/system`).
- Native elements only for interaction: `<button>`, `<a>`, `<input>`, `<select>`, `<dialog>`. No clickable `<div>`.
- Every page renders exactly one `PageHeading`; it sets `document.title` and receives focus on navigation.
- When an action removes the control that triggered it, move focus somewhere stable before or after (see `data-focus-fallback`).
- Colours come from the semantic tokens (`styles/tokens/semantic.css`), never primitives or raw hex. Use the `*-text` variants for text; brand values are for fills.
- Mobile first: write base styles for phones, then add `min-width` queries (40rem, 48rem, 64rem).
- Every animation uses the duration tokens, so reduced motion is respected automatically.
- State is never conveyed by colour alone.

## Writing style

- UI copy is plain, warm and short. British English. Address the couple as "you".
- No em dashes in copy, comments or docs.
- Comments explain why, not what.
