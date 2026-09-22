import { Card } from '@/ui';
import { Specimen, SystemHeader } from './SystemLayout';
import styles from './System.module.css';

interface Note {
  readonly title: string;
  readonly problem: string;
  readonly decision: string;
  readonly where: string;
}

const UX_NOTES: readonly Note[] = [
  {
    title: 'The statement figure comes first',
    problem:
      'A couple checks spending against their bank app. A $60 card payment that shows as £46.86 looks like a mistake.',
    decision:
      'Every spend reads the same way: what left the account in its own currency, the rate, and the equivalent in the other currency. When the equivalent is pounds, it is exactly what the jar was charged, at the rate stored with the spend.',
    where: 'Activity, and the Money component.',
  },
  {
    title: 'Conversions are conservative',
    problem: 'Exchange rates move. A budget that looks healthy on Monday can be short by Friday.',
    decision:
      'Income converts at whichever of the planning and live rates gives less; spending at whichever costs more. The budget can be pleasantly surprised, never caught short. The rate is stored with each spend, so history never shifts.',
    where: 'Blueprint income, Log spend, Activity.',
  },
  {
    title: 'The central jar is a real gauge',
    problem: 'Zero-based budgeting is abstract. "Ready to seed: £58" is easy to ignore.',
    decision:
      'The brand mark becomes the gauge. Honey drains as money gets a job, and the last few pounds ask for a decision instead of being quietly left over.',
    where: 'Budget.',
  },
  {
    title: 'State is never colour alone',
    problem:
      'Moss, honey and berry are close in lightness, and some people cannot tell them apart.',
    decision:
      'Every jar state is a word, an icon and a colour. The empty track is hatched, a shape, rather than a dashed border that breaks apart under zoom.',
    where: 'Jar rows, and the JarState components.',
  },
  {
    title: 'The happy path is locked on purpose',
    problem: 'A demo that can be broken by one stray click or deep link loses the room.',
    decision:
      'Each screen belongs to a stage derived from the data, and a route guard sends anything else back to your place. Accounts and Settings stay visible and explain themselves, rather than hiding.',
    where: 'Every route.',
  },
  {
    title: 'Toasts respect reading time',
    problem:
      'A message that vanishes mid-sentence fails people who read slowly or use a magnifier.',
    decision:
      'Confirmations close after 3 seconds, pause while hovered or focused, and can always be dismissed. Errors stay until closed and are announced straight away. Nothing lives only in a toast.',
    where: 'Every write.',
  },
];

const ENGINEERING_NOTES: readonly Note[] = [
  {
    title: 'Keyboard first, and tested that way',
    problem: 'Accessibility checked by hand drifts the moment a screen changes.',
    decision:
      'An end-to-end test walks the whole story with the keyboard alone and runs axe at every stage, on a phone and a desktop. Focus moves to each new heading and to a stable place when a control disappears.',
    where: 'e2e/happy-path.spec.ts',
  },
  {
    title: 'A mock that behaves like a database',
    problem: 'Instant fake data hides every loading, pending and failure state.',
    decision:
      'The mock adapter stores Postgres-shaped rows, runs writes in transactions, enforces the same rules a database would and waits a realistic moment. The prototype shows real pending states and rolls back on failure.',
    where: 'src/services/mock',
  },
  {
    title: 'Money is whole numbers',
    problem: 'Floating point cannot hold 0.1 exactly, and a budget off by a penny loses trust.',
    decision:
      'Every amount is an integer of pence or cents. Floats appear only when parsing input or applying a rate, and both round straight back.',
    where: 'src/domain/money.ts',
  },
];

const LAYERS = [
  {
    name: 'ui/',
    knows: 'Tokens, and nothing about nestjar.',
    examples: 'Button, Card, Badge, ProgressTrack, NavItem, Toast, fields',
    test: 'Could drop into another product unchanged.',
  },
  {
    name: 'components/',
    knows: 'nestjar ideas: money, currencies, jar states, the brand marks. Takes data as props.',
    examples: 'JarGauge, JarStateBadge, JarProgress, Money, MoneyField, Logo',
    test: 'Only makes sense in nestjar, but never fetches or navigates.',
  },
  {
    name: 'features/',
    knows: 'Screens. Calls data hooks, handles events, decides what a press does.',
    examples: 'BudgetPage, ActivityPage, LogSpendSheet',
    test: 'The only layer that knows where data comes from.',
  },
] as const;

function NoteCard({ note }: { readonly note: Note }) {
  return (
    <Card as="article" className={styles.noteCard}>
      <h3 className={styles.noteTitle}>{note.title}</h3>
      <dl className={styles.noteBody}>
        <div>
          <dt>The problem</dt>
          <dd>{note.problem}</dd>
        </div>
        <div>
          <dt>The decision</dt>
          <dd>{note.decision}</dd>
        </div>
        <div>
          <dt>Where to see it</dt>
          <dd>{note.where}</dd>
        </div>
      </dl>
    </Card>
  );
}

export function NotesPage() {
  return (
    <div className={styles.page}>
      <SystemHeader
        title="Prototype notes"
        description="The problems this prototype had to solve, and the decisions behind what you see."
      />

      <Specimen id="notes-ux" title="Experience" intro="Choices about what people see and feel.">
        <div className={styles.notes}>
          {UX_NOTES.map((note) => (
            <NoteCard key={note.title} note={note} />
          ))}
        </div>
      </Specimen>

      <Specimen
        id="notes-layers"
        title="How the code is layered"
        intro="Each layer only reaches down, never up, and the linter enforces it. That is what lets a component be reused without a second thought."
      >
        <ol className={styles.layers}>
          {LAYERS.map((layer) => (
            <li key={layer.name}>
              <Card as="div" padding="dense" className={styles.layer}>
                <code className={styles.layerName}>{layer.name}</code>
                <p>{layer.knows}</p>
                <p className={styles.note}>{layer.examples}</p>
                <p className={styles.layerTest}>{layer.test}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Specimen>

      <Specimen
        id="notes-engineering"
        title="Engineering"
        intro="Choices that keep the experience honest under the hood."
      >
        <div className={styles.notes}>
          {ENGINEERING_NOTES.map((note) => (
            <NoteCard key={note.title} note={note} />
          ))}
        </div>
      </Specimen>
    </div>
  );
}
