/**
 * The condensed principles shown on the Design Principles page. The full
 * reasoning behind each lives in docs/principles.md.
 */

export type PrincipleId =
  'data' | 'accessibility' | 'architecture' | 'question' | 'details' | 'less';

export interface Principle {
  readonly id: PrincipleId;
  /** Short enough to read inline, as in "Principles Applied: …". */
  readonly title: string;
  readonly summary: string;
  readonly why: string;
  readonly inPrototype: readonly string[];
}

export const PRINCIPLES: readonly Principle[] = [
  {
    id: 'data',
    title: 'Let the data shape the design',
    summary: 'Understand the real data, messy cases included, before designing the screen.',
    why: 'Money is messy. Pay arrives late, currencies move and amounts never divide neatly. A screen built on tidy numbers breaks on real ones.',
    inPrototype: [
      'Plans and what really happened sit side by side, never blended.',
      'The jar is a live measure of money still waiting for a job.',
      'Every currency conversion shows how it was counted.',
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility is a first-class citizen',
    summary: 'Built in from the first line, with the same weight as how it looks.',
    why: 'Added at the end, it is slow, costly and never complete. Built in, it makes the design clearer for everyone.',
    inPrototype: [
      'Every journey works with a keyboard alone, and a test proves it.',
      'Brand colours gain stronger partners wherever words need contrast.',
      'Meaning is never carried by colour alone.',
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture is not an afterthought',
    summary: 'A prototype is the first version of the product, so structure it to grow.',
    why: 'Prototypes that work for now tend to become the product. Untangling them later costs far more than structuring them early.',
    inPrototype: [
      'Stand-in data behaves like the real backend, so switching is a small change.',
      'The budgeting rules live apart from the screens and are tested on their own.',
      'More people or currencies should need new data, not a new design.',
    ],
  },
  {
    id: 'question',
    title: 'Question the first answer',
    summary: 'A first idea is a starting point, not a decision.',
    why: 'The costliest mistakes are assumptions made early. Challenging them while change is cheap is how a product ends up feeling natural.',
    inPrototype: [
      'How people and money are modelled is tested against real lives.',
      'If people have to piece things together across screens, the layout changes.',
      'Decisions are written down with why, so they can be challenged later.',
    ],
  },
  {
    id: 'details',
    title: 'Get the details right',
    summary: 'Close enough is not good enough.',
    why: 'Trust in a money app is built on precision. People notice when something is slightly off, even when they cannot say why.',
    inPrototype: [
      'Figures are exact, never rounded for convenience.',
      'The real brand artwork, colours and type, not approximations.',
      'Full care for small moments: what a button says, how an error reads, where focus lands.',
    ],
  },
  {
    id: 'less',
    title: 'Do less, fully',
    summary: 'Finish the journey that matters, and clearly name what is parked.',
    why: 'A half-finished feature looks like a bug. A clearly parked one looks like a plan.',
    inPrototype: [
      'The core journey is complete, with nothing faked.',
      'Unfinished areas stay visible and explain themselves.',
      'Hard problems are written down with a clear "for now".',
    ],
  },
];
