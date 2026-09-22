# Accessibility

The target is WCAG 2.2 AA on every screen of the happy path, on phones and desktops, with a mouse, a keyboard, touch or a screen reader.

## How it is verified

- `e2e/happy-path.spec.ts` completes the whole story with the keyboard alone, asserts where focus lands after every navigation, and runs axe (WCAG 2.0, 2.1 and 2.2 A and AA rules) at each stage. It runs at a Pixel 7 size and at 1280 × 800.
- `src/ui/ui.test.tsx` checks the keyboard model and ARIA wiring of the primitives, with axe on each.
- `eslint-plugin-jsx-a11y` runs in strict mode. Its two suppressions are each explained inline.

Automated checks catch perhaps a third of real issues. Before a release, also walk the story with VoiceOver on iOS and NVDA with Firefox.

## Keyboard

| Situation                 | Behaviour                                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any page                  | "Skip to content" is the first Tab stop.                                                                                                                                      |
| Route change              | Focus moves to the new page's `<h1>`, which screen readers announce. Scroll resets.                                                                                           |
| Step change within a page | The same, through `useFocusHeadingOnChange`.                                                                                                                                  |
| Opening a sheet           | Focus goes to its first field. Content behind is inert.                                                                                                                       |
| Inside a sheet            | Tab stays within it. Escape closes it.                                                                                                                                        |
| Closing a sheet           | Focus returns to the control that opened it. If that control no longer exists (its job is done), focus goes to the element marked `data-focus-fallback`, or the page heading. |
| Seed all to plan          | Focus moves to the central jar heading before the button is replaced.                                                                                                         |
| Invalid form              | Errors appear on submit, and focus moves to the first invalid field once its message is wired up.                                                                             |
| Currency toggle           | Native radio group: arrow keys move and select.                                                                                                                               |

Every interactive element is a native `<button>`, `<a>`, `<input>` or `<select>`. There are no clickable `<div>`s.

## Screen readers

- Each jar row is one button with a sentence for a name, starting with the visible jar name so voice control still matches: "Groceries, Spending. £455.80 left. Planned £520.00, seeded £520.00, spent £64.20."
- The central jar is `role="img"` with a label that states the numbers, not the picture.
- Toasts confirm changes that are also visible on the page. News renders into a persistent `role="status"` region; an error's message carries `role="alert"`. Transient toasts close after 3 seconds (`--toast-duration`), pause while hovered or focused, and can always be dismissed. Persistent toasts stay until closed. Dismissing a focused toast moves focus to the page heading.
- Icon-only buttons take a required `label`, which becomes their accessible name and a tooltip that Escape dismisses (1.4.13).
- Field hints and errors are linked with `aria-describedby`; invalid fields set `aria-invalid`.
- Locked navigation items announce "(not in this demo)".

## Colour and contrast

Brand colours are kept for fills and decoration. Where one failed AA for text or a control boundary, an accessible variant sits beside it in `tokens.css`.

| Token                                  | Use                       | On          | Ratio  | Brand value it replaces       |
| -------------------------------------- | ------------------------- | ----------- | ------ | ----------------------------- |
| `--color-text` `#24301F`               | Body text                 | Sage canvas | 11.7:1 | (brand)                       |
| `--color-text-muted` `#5E6857`         | Secondary text            | Sage canvas | 4.9:1  | Muted Olive `#6E7863` (3.9:1) |
| `--color-moss-text` `#4F6A46`          | Positive text             | Ivory       | 5.7:1  | Moss Green `#5C7A52` (4.5:1)  |
| `--color-honey-text` `#8A5F12`         | Accent text               | Ivory       | 5.3:1  | Honey Amber `#DCA23C` (2.1:1) |
| `--color-honey-text-on-tint` `#7C5A14` | Text on honey tint        | Honey tint  | 4.8:1  | Honey text (4.3:1 on tint)    |
| `--color-border-strong` `#8A8468`      | Input and control borders | Ivory       | 3.6:1  | Muted Clay `#D9D3BC` (1.4:1)  |
| `--color-on-honey` `#2A2004`           | Primary button label      | Honey       | 7.1:1  | (brand)                       |

State is never shown by colour alone: jar states have a word and an icon as well as a colour, the "not seeded" track is hatched, and errors carry an icon and words. The hatch replaced a dashed border, which broke into uneven dashes on rounded ends and under zoom.

## Layout and motion

- Mobile first. Everything reflows at 320 CSS pixels and at 400% zoom without horizontal scrolling.
- Sizes are in `rem`, so text scales with browser settings.
- Touch targets are at least 44 × 44 CSS pixels, except the compact currency toggle (40px), which still exceeds the 24px AA minimum. Small buttons keep a 44px hit area around a 36px face.
- The Design notes page shows each semantic colour with its contrast ratio, measured live from the tokens.
- `scroll-padding` keeps focused fields clear of the sticky top bar and fixed bottom bars (2.4.11 Focus Not Obscured).
- `prefers-reduced-motion` sets every duration token to zero, so the jar still changes level without animating.
- `forced-colors` rules keep borders, indicators and the selected state visible in Windows High Contrast.
- Form inputs use a 16px font size, which stops iOS zooming on focus.
