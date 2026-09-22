import { ArrowRight, BookOpen, Palette, Plus, Sprout, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { JarGauge } from '@/components/JarGauge/JarGauge';
import { JarProgress, JarStateBadge } from '@/components/JarState/JarState';
import { ExchangeRate, Money } from '@/components/Money/Money';
import { MoneyField } from '@/components/MoneyField/MoneyField';
import type { JarState } from '@/domain/budget';
import { money, type Minor } from '@/domain/money';
import { contrastRatio } from '@/lib/contrast';
import {
  Badge,
  Button,
  Card,
  NavItem,
  ProgressTrack,
  SegmentedControl,
  SelectField,
  TextField,
  useToast,
  type ButtonVariant,
} from '@/ui';
import { Specimen, SystemHeader } from './SystemLayout';
import styles from './System.module.css';

/* ---------- Tokens ---------- */

type SwatchKind = 'text' | 'line' | 'fill' | 'surface';

interface Swatch {
  readonly token: string;
  readonly use: string;
  readonly kind: SwatchKind;
  /** The background the ratio is measured against. */
  readonly on?: string;
}

const SWATCHES: readonly Swatch[] = [
  { token: '--color-canvas', use: 'Page background', kind: 'surface' },
  { token: '--color-surface', use: 'Cards and sheets', kind: 'surface' },
  {
    token: '--color-surface-sunken',
    use: 'Wells and empty tracks',
    kind: 'surface',
  },
  { token: '--color-text', use: 'Body text', kind: 'text' },
  {
    token: '--color-text-muted',
    use: 'Secondary text',
    kind: 'text',
    on: '--color-canvas',
  },
  { token: '--color-border-strong', use: 'Control boundaries', kind: 'line' },
  { token: '--color-honey', use: 'Primary fills, the honey', kind: 'fill' },
  { token: '--color-honey-text', use: 'Honey as text', kind: 'text' },
  { token: '--color-moss', use: 'Seeded fills', kind: 'fill' },
  { token: '--color-moss-text', use: 'Positive text', kind: 'text' },
  { token: '--color-berry', use: 'Overspent fills', kind: 'fill' },
  { token: '--color-berry-text', use: 'Warning text', kind: 'text' },
  { token: '--color-nav', use: 'Side navigation', kind: 'surface' },
];

/* Text needs 4.5:1 and control boundaries 3:1 (WCAG 1.4.3 and 1.4.11). */
const TARGET: Partial<Record<SwatchKind, number>> = { text: 4.5, line: 3 };

function readToken(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function SwatchCard({ swatch }: { readonly swatch: Swatch }) {
  const [value] = useState(() => readToken(swatch.token));
  const [background] = useState(() => readToken(swatch.on ?? '--color-surface'));
  const target = TARGET[swatch.kind];
  const ratio = target ? contrastRatio(value, background) : null;
  const passes = ratio !== null && target !== undefined && ratio >= target;

  return (
    <li className={styles.swatch}>
      <span className={styles.swatchChip} style={{ background: `var(${swatch.token})` }} />
      <span className={styles.swatchBody}>
        <code className={styles.token}>{swatch.token}</code>
        <span className={styles.swatchUse}>{swatch.use}</span>
        <span className={styles.swatchMeta}>
          <span className="figures">{value}</span>
          {ratio !== null ? (
            <Badge
              tone={passes ? 'moss' : 'berry'}
              label={`${ratio.toFixed(1)}:1 ${passes ? 'passes' : 'fails'} AA`}
            />
          ) : (
            <span>{swatch.kind === 'fill' ? 'Fill only, never text' : 'Surface'}</span>
          )}
        </span>
      </span>
    </li>
  );
}

const TYPE_SCALE = [
  ['--text-3xl', '2.25rem'],
  ['--text-2xl', '1.75rem'],
  ['--text-xl', '1.375rem'],
  ['--text-lg', '1.125rem'],
  ['--text-base', '1rem'],
  ['--text-sm', '0.875rem'],
  ['--text-xs', '0.75rem'],
] as const;

const SPACE = ['1', '2', '3', '4', '5', '6', '8', '10', '12'] as const;
const RADII = ['sm', 'md', 'lg', 'pill'] as const;

/* ---------- Components ---------- */

const VARIANTS: readonly { variant: ButtonVariant; use: string }[] = [
  { variant: 'primary', use: 'The one main action on a screen.' },
  { variant: 'secondary', use: 'An alternative to the main action.' },
  { variant: 'ghost', use: 'Quiet, utility actions. No chrome until hovered.' },
  { variant: 'danger', use: 'Actions that destroy something.' },
];

const BUTTON_EXAMPLE = `<Button label="Log spend" icon={<Plus />} onClick={openSheet} />
<Button label="Back to budget" icon={<ArrowLeft />} href="/budget" variant="secondary" />
<Button label="Dismiss" icon={<X />} iconOnly variant="ghost" onClick={close} />`;

const JAR_STATES: readonly {
  state: JarState;
  seeded: number;
  spent: number;
}[] = [
  { state: 'unplanned', seeded: 0, spent: 0 },
  { state: 'blueprint', seeded: 0, spent: 0 },
  { state: 'seeding', seeded: 1, spent: 0 },
  { state: 'spending', seeded: 1, spent: 0.35 },
  { state: 'overspent', seeded: 0.8, spent: 1 },
];

function ButtonSpecimen() {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <pre className={styles.code}>
        <code>{BUTTON_EXAMPLE}</code>
      </pre>
      <div className={styles.rule}>
        <p>
          <strong>href or onClick?</strong> If pressing it goes to another page, give it an{' '}
          <code>href</code>: it renders a real link that can open in a new tab. If it changes
          something, give it an <code>onClick</code>. The button never decides what happens; the
          screen using it does.
        </p>
      </div>
      <ul className={styles.matrix}>
        {VARIANTS.map(({ variant, use }) => (
          <li key={variant} className={styles.matrixRow}>
            <p className={styles.matrixLabel}>
              <code>{variant}</code>
              <span>{use}</span>
            </p>
            <div className={styles.matrixCells}>
              <Button variant={variant} label="Label only" />
              <Button
                variant={variant}
                label="Icon and label"
                icon={<Sprout size={18} aria-hidden="true" />}
              />
              <Button
                variant={variant}
                label="Icon at the end"
                icon={<ArrowRight size={18} aria-hidden="true" />}
                iconPosition="end"
              />
              <Button
                variant={variant}
                iconOnly
                label={variant === 'danger' ? 'Delete' : 'Add'}
                icon={
                  variant === 'danger' ? (
                    <Trash2 size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )
                }
              />
            </div>
          </li>
        ))}
        <li className={styles.matrixRow}>
          <p className={styles.matrixLabel}>
            <code>size</code>
            <span>Small keeps a 44px hit area around a compact face.</span>
          </p>
          <div className={styles.matrixCells}>
            <Button size="sm" label="Small" />
            <Button size="md" label="Medium" />
            <Button size="lg" label="Large" />
            <Button size="sm" iconOnly label="Close" icon={<X size={16} aria-hidden="true" />} />
            <Button size="lg" iconOnly label="Close" icon={<X size={20} aria-hidden="true" />} />
          </div>
        </li>
        <li className={styles.matrixRow}>
          <p className={styles.matrixLabel}>
            <code>states</code>
            <span>Loading keeps focus and announces busy. Disabled is a last resort.</span>
          </p>
          <div className={styles.matrixCells}>
            <Button
              label="Press to load"
              loading={busy}
              loadingLabel="Saving"
              onClick={() => {
                setBusy(true);
                window.setTimeout(() => setBusy(false), 1500);
              }}
            />
            <Button variant="secondary" label="Disabled" disabled />
            <Button variant="secondary" label="A link" href="/system/notes" />
          </div>
        </li>
      </ul>
    </>
  );
}

function FieldSpecimen() {
  const [amount, setAmount] = useState<Minor | null>(6000);
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('USD');
  return (
    <div className={styles.fields}>
      <TextField label="What was it?" defaultValue="Groceries at Whole Foods" />
      <MoneyField
        label="Amount"
        currency={currency}
        value={amount}
        onValueChange={setAmount}
        hint="Speaks integer minor units: 60 becomes 6000."
      />
      <SelectField
        label="Paid from"
        defaultValue="chase"
        options={[
          { value: 'chase', label: 'Chase checking' },
          { value: 'monzo', label: 'Monzo joint' },
        ]}
      />
      <TextField
        label="With an error"
        defaultValue=""
        error="Say what this was for."
        hint="Errors carry an icon and words, never colour alone."
      />
      <SegmentedControl
        legend="Currency"
        value={currency}
        onChange={setCurrency}
        segments={[
          { value: 'GBP', label: 'GBP', accessibleLabel: 'British pounds' },
          { value: 'USD', label: 'USD', accessibleLabel: 'US dollars' },
        ]}
      />
    </div>
  );
}

function ToastSpecimen() {
  const toast = useToast();
  return (
    <div className={styles.matrixCells}>
      <Button
        variant="secondary"
        label="Transient"
        onClick={() => toast.show({ message: 'Seeded £520 into Groceries.' })}
      />
      <Button
        variant="secondary"
        label="Persistent"
        onClick={() =>
          toast.show({
            message: 'Rates are a day old. Totals use your planning rate.',
            tone: 'info',
            persistent: true,
          })
        }
      />
      <Button
        variant="secondary"
        label="Error"
        onClick={() =>
          toast.show({
            message: 'That did not save. Check your connection and try again.',
            tone: 'error',
            persistent: true,
          })
        }
      />
    </div>
  );
}

function MotionSpecimen() {
  const [full, setFull] = useState(true);
  return (
    <div className={styles.motion}>
      <JarGauge
        level={full ? 0.8 : 0.15}
        size="md"
        label={full ? 'A jar, mostly full' : 'A jar, nearly empty'}
      />
      <div className={styles.motionBody}>
        <dl className={styles.tokenList}>
          <div>
            <dt>
              <code>--duration-fast</code>
            </dt>
            <dd>120ms. Hovers and presses.</dd>
          </div>
          <div>
            <dt>
              <code>--duration-base</code>
            </dt>
            <dd>200ms. Sheets and toasts arriving.</dd>
          </div>
          <div>
            <dt>
              <code>--duration-slow</code>
            </dt>
            <dd>600ms. Honey settling to a new level.</dd>
          </div>
        </dl>
        <p className={styles.note}>
          Every animation reads these tokens. Under reduced motion they become 0ms, so the jar still
          changes level, just without the pour.
        </p>
        <Button
          variant="secondary"
          label={full ? 'Seed it out' : 'Pour it back'}
          icon={<Sprout size={18} aria-hidden="true" />}
          onClick={() => setFull((f) => !f)}
        />
      </div>
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <div className={styles.page}>
      <SystemHeader
        title="Design system"
        description="The tokens and components every screen is built from. Everything here is the real code, not a picture of it."
      />

      <Specimen
        id="ds-principles"
        title="Three tiers of tokens"
        intro="Primitives hold the brand's raw values. Semantic tokens name a job. Component tokens hold one component's choices. Screens only read the last two, so a rebrand is a change in one file."
      >
        <pre className={styles.code}>
          <code>{`/* primitive: a raw brand value */
--honey-amber: #dca23c;

/* semantic: named for the job */
--color-honey: var(--honey-amber);
--color-honey-text: var(--honey-800);

/* component: one component's choice */
--nav-pill-width: 3.5rem;`}</code>
        </pre>
      </Specimen>

      <Specimen
        id="ds-colour"
        title="Colour"
        intro="Brand colours are for fills. Where one fails contrast as text, an accessible sibling does that job. Ratios are measured live from the tokens."
      >
        <ul className={styles.swatches}>
          {SWATCHES.map((swatch) => (
            <SwatchCard key={swatch.token} swatch={swatch} />
          ))}
        </ul>
      </Specimen>

      <Specimen
        id="ds-type"
        title="Type"
        intro="Fraunces for moments, Inter for reading, IBM Plex Mono for every figure so columns of money line up."
      >
        <Card>
          <div className={styles.typeFaces}>
            <p className={styles.faceDisplay}>Every pound has a job.</p>
            <p className={styles.faceUi}>
              Seed money from the central jar into the jars that need it.
            </p>
            <p className="figures">£5,758.00 · $4,200.00 · £58.00</p>
          </div>
        </Card>
        <ul className={styles.scale}>
          {TYPE_SCALE.map(([token, size]) => (
            <li key={token} className={styles.scaleRow}>
              <code className={styles.token}>{token}</code>
              <span className="figures">{size}</span>
              <span style={{ fontSize: `var(${token})` }}>Honey</span>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen
        id="ds-space"
        title="Space and shape"
        intro="A 4px grid. Hairline borders instead of shadows, as the brand guide asks."
      >
        <div className={styles.spaceGrid}>
          <ul className={styles.spaceList}>
            {SPACE.map((step) => (
              <li key={step} className={styles.spaceRow}>
                <code className={styles.token}>--space-{step}</code>
                <span className={styles.spaceBar} style={{ width: `var(--space-${step})` }} />
              </li>
            ))}
          </ul>
          <ul className={styles.radii}>
            {RADII.map((radius) => (
              <li key={radius}>
                <span
                  className={styles.radiusBox}
                  style={{ borderRadius: `var(--radius-${radius})` }}
                />
                <code className={styles.token}>--radius-{radius}</code>
              </li>
            ))}
          </ul>
        </div>
      </Specimen>

      <Specimen id="ds-motion" title="Motion">
        <MotionSpecimen />
      </Specimen>

      <Specimen
        id="ds-button"
        title="Button"
        intro="One component. Variant sets emphasis, size sets scale, and content can be a label, an icon and a label, or an icon alone. An icon-only button still requires a label: it becomes the accessible name and the tooltip."
      >
        <ButtonSpecimen />
      </Specimen>

      <Specimen
        id="ds-card"
        title="Card"
        intro="The brand card: 16px radius, 24px padding, one clay hairline."
      >
        <div className={styles.cards}>
          <Card as="div">
            <p className={styles.cardName}>default</p>
            <p className={styles.note}>Warm ivory. Most content.</p>
          </Card>
          <Card as="div" variant="sunken">
            <p className={styles.cardName}>sunken</p>
            <p className={styles.note}>Parchment. Grouping inside a page.</p>
          </Card>
          <Card as="div" variant="highlight">
            <p className={styles.cardName}>highlight</p>
            <p className={styles.note}>A honey glow for the one thing that matters most.</p>
          </Card>
          <Card as="div" padding="dense">
            <p className={styles.cardName}>padding=&quot;dense&quot;</p>
            <p className={styles.note}>For lists.</p>
          </Card>
        </div>
      </Specimen>

      <Specimen
        id="ds-state"
        title="Badges, tracks and jar states"
        intro="Badge and ProgressTrack know nothing about budgets. JarStateBadge and JarProgress map a jar's state onto them, so every screen shows state the same way: a word, a shape and a colour."
      >
        <div className={styles.matrixCells}>
          <Badge label="neutral" />
          <Badge label="moss" tone="moss" />
          <Badge label="honey" tone="honey" />
          <Badge label="berry" tone="berry" />
        </div>
        <ul className={styles.states}>
          {JAR_STATES.map(({ state, seeded, spent }) => (
            <li key={state} className={styles.stateRow}>
              <JarStateBadge state={state} />
              <JarProgress state={state} seededRatio={seeded} spentRatio={spent} />
            </li>
          ))}
        </ul>
        <div className={styles.stateRow}>
          <code className={styles.token}>pattern=&quot;hatched&quot;</code>
          <ProgressTrack layers={[]} pattern="hatched" />
        </div>
      </Specimen>

      <Specimen
        id="ds-nav"
        title="Navigation"
        intro="The active item wears a pill around its icon, a heavier label and aria-current. The pill has a fixed size, so it looks the same on a phone and a tablet. Items outside the demo add a small lock and say so to screen readers."
      >
        <div className={styles.navDemos}>
          <nav aria-label="Tab bar example" className={styles.navTabDemo}>
            <ul>
              <li>
                <NavItem href="/system" label="Design" icon={Palette} orientation="tab" />
              </li>
              <li>
                <NavItem href="/system/notes" label="Notes" icon={BookOpen} orientation="tab" />
              </li>
            </ul>
          </nav>
          <nav aria-label="Side navigation example" className={styles.navSideDemo}>
            <ul>
              <li>
                <NavItem href="/system" label="Design" icon={Palette} orientation="side" />
              </li>
              <li>
                <NavItem href="/system/notes" label="Notes" icon={BookOpen} orientation="side" />
              </li>
            </ul>
          </nav>
        </div>
      </Specimen>

      <Specimen
        id="ds-fields"
        title="Fields"
        intro="Every field has a visible label, a hint and error wired with aria-describedby, and 16px text so phones do not zoom."
      >
        <Card>
          <FieldSpecimen />
        </Card>
      </Specimen>

      <Specimen
        id="ds-toast"
        title="Toast"
        intro="Transient toasts close after 3 seconds (--toast-duration) and pause while hovered or focused. Persistent ones stay until closed. Both can always be dismissed. Errors are announced assertively."
      >
        <ToastSpecimen />
      </Specimen>

      <Specimen
        id="ds-jar"
        title="Jar gauge"
        intro="The brand's signature, drawn from the logo: a woven rim, a soft-shouldered body, a glint on the glass and a gently waving honey line."
      >
        <ul className={styles.jars}>
          <li>
            <JarGauge level={0.72} size="lg" label="Large jar, 72% full" />
            <code className={styles.token}>lg</code>
          </li>
          <li>
            <JarGauge level={0.35} size="md" label="Medium jar, 35% full" />
            <code className={styles.token}>md</code>
          </li>
          <li>
            <JarGauge level={0.6} size="sm" label="Small jar, 60% full" />
            <code className={styles.token}>sm</code>
          </li>
        </ul>
      </Specimen>

      <Specimen
        id="ds-money"
        title="Money and rates"
        intro="Every spend reads the same way, whatever it was paid in: the amount on the statement, the rate, and the equivalent in the other currency. When the equivalent is the base currency it is exactly what the jar was charged."
      >
        <Card padding="dense">
          <ul className={styles.moneyList}>
            <li>
              <span>Paid in dollars</span>
              <span className={styles.moneyFigures}>
                <Money value={money(60_00, 'USD')} emphasis="strong" />
                <Money value={money(46_86, 'GBP')} />
                <ExchangeRate from="USD" to="GBP" rate={{ value: 0.781, kind: 'live' }} />
              </span>
            </li>
            <li>
              <span>Paid in pounds</span>
              <span className={styles.moneyFigures}>
                <Money value={money(37_00, 'GBP')} emphasis="strong" />
                <Money value={money(50_00, 'USD')} />
                <ExchangeRate from="GBP" to="USD" rate={{ value: 1 / 0.74, kind: 'fixed' }} />
              </span>
            </li>
          </ul>
        </Card>
      </Specimen>
    </div>
  );
}
