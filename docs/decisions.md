# Decisions

Short records of choices that shape the codebase. Add new ones at the bottom.

## 1. Money is integer minor units

Floating point cannot represent 0.1 exactly, and a budget that is off by a penny loses trust. Every amount is an integer number of pence or cents. Floats appear only when parsing input and multiplying by a rate, and both round straight back.

## 2. Conservative currency conversion

Income converts at whichever of the fixed planning rate and the live rate gives less; spending at whichever gives more. The budget can be pleasantly surprised by exchange movements but never caught short. The rate used is stored with the transaction, so history does not change when rates do.

## 3. One stage, derived from server state

The prototype is a line, not a map. Rather than scattering "has onboarded" flags through local state, `stageFor()` derives the person's place from their budget and month. Route guards read it. Refreshes and deep links cannot desynchronise the UI from the data.

## 4. Adapters behind contracts, with a real mock

The mock adapter mirrors the database: rows, transactions, constraint checks, latency. That makes the prototype behave like the product (pending states, failures, atomic writes) and turns the mock into the specification the Supabase adapter must meet.

## 5. Native elements over ARIA widgets

`<dialog>` for sheets, radio inputs for the segmented control, `<select>` for pickers, a checkbox for the switch. Native elements bring keyboard support, focus management and screen reader semantics that custom widgets have to recreate and usually get subtly wrong.

## 6. CSS Modules and tokens, no utility framework

The brand guide is a small, strict system. Tokens as custom properties plus scoped modules keep that system legible in the code, avoid a styling runtime, and make forced-colours and reduced-motion overrides straightforward.

## 7. Locked paths are visible

Accounts and Settings stay in navigation so the product feels whole. They lead to a page that says what they would do and returns you to the story, rather than being hidden or disabled (disabled controls cannot be focused, so keyboard users never learn why).

## 8. One Button, configured by props

Button, link-styled button and icon button were separate components, which meant choosing between them each time. There is now one `Button`. Variant sets emphasis, size sets scale, and content is a label, an icon and a label, or an icon alone. `href` makes it a real link; `onClick` makes it an action. It holds no behaviour of its own, so a screen decides what every press does.

## 9. Spends lead with the statement figure

A $60 card payment shown as £46.86 looks like an error when checked against the bank. Activity leads with what left the account, in its currency, then what the jar was charged and the rate used. The booked figure is never converted again for display, because converting a conversion would agree with neither the statement nor the jar.

## 10. Toasts: transient by default, persistent by choice

A toast either closes itself after 3 seconds or stays until closed (`persistent`). Both can always be dismissed, and a transient toast pauses while it is hovered or focused. Errors are persistent and assertive. New confirmations never push a persistent notice off screen.

## 11. Design notes beside the story

Reviewers see the running app far more often than the repository. `/system` shows the design system from the real components and the reasoning behind the prototype. It is open at every stage. Once the month is running it is a panel in the navigation; before that it opens on its own and leads back to wherever you were, so it sits beside the happy path without breaking it.
