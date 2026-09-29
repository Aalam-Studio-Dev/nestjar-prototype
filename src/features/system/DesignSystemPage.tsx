import { ArrowRight, Palette, PiggyBank, Plus, Settings, Sprout, Trash2, X } from 'lucide-react';
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
import { Part, Specimen, SystemHeader } from './SystemLayout';
import styles from './System.module.css';

/* ---------- Foundations ---------- */

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
  ['--text-3xl', '36px'],
  ['--text-2xl', '28px'],
  ['--text-xl', '22px'],
  ['--text-lg', '18px'],
  ['--text-base', '16px'],
  ['--text-sm', '14px'],
  ['--text-xs', '12px'],
] as const;

const SPACE = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;
const RADII = [
  ['sm', 'Small, 8px'],
  ['md', 'Medium, 12px'],
  ['lg', 'Large, 16px'],
  ['pill', 'Pill'],
] as const;

/* ---------- Patterns ---------- */

const VARIANTS: readonly { variant: ButtonVariant; name: string; use: string }[] = [
  { variant: 'primary', name: 'Primary', use: 'The one main action on a screen.' },
  { variant: 'secondary', name: 'Secondary', use: 'An alternative to the main action.' },
  { variant: 'ghost', name: 'Quiet', use: 'Utility actions. No outline until hovered.' },
  { variant: 'danger', name: 'Danger', use: 'Actions that remove something.' },
];

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
      <div className={styles.rule}>
        <p>
          <strong>Going somewhere, or doing something?</strong> If pressing it goes to another page,
          it is a real link that can open in a new tab. If it changes something, it is an action.
          Either way it looks the same, and the screen decides what a press does.
        </p>
      </div>
      <ul className={styles.matrix}>
        {VARIANTS.map(({ variant, name, use }) => (
          <li key={variant} className={styles.matrixRow}>
            <p className={styles.matrixLabel}>
              <strong>{name}</strong>
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
            <strong>Sizes</strong>
            <span>Small looks compact but keeps a full-size area to press.</span>
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
            <strong>States</strong>
            <span>Loading keeps your place and says it is busy. Disabled is a last resort.</span>
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
            <Button variant="secondary" label="A link" href="/system" />
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
        hint="Type it as it reads on your statement."
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
            <dt>Quick, 120ms</dt>
            <dd>Hovers and presses.</dd>
          </div>
          <div>
            <dt>Steady, 200ms</dt>
            <dd>Sheets and messages arriving.</dd>
          </div>
          <div>
            <dt>Slow, 600ms</dt>
            <dd>Honey settling to a new level.</dd>
          </div>
        </dl>
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
        title="Design System"
        description="How the principles look in practice. Every example here is the live component, not a picture of it."
      />

      <Part id="ds-foundations" title="Foundations" intro="The brand, made to work for everyone.">
        <Specimen
          id="ds-colour"
          level={3}
          title="Colour"
          principles={['accessibility', 'details', 'architecture']}
          intro="Brand colours fill, stronger partners speak. Where a brand colour is too light for text, a darker partner carries the words. Screens only ever ask for a colour's job, never its value, so a rebrand is a change in one place."
        >
          <ul className={styles.swatches}>
            {SWATCHES.map((swatch) => (
              <SwatchCard key={swatch.token} swatch={swatch} />
            ))}
          </ul>
        </Specimen>

        <Specimen
          id="ds-type"
          level={3}
          title="Type"
          principles={['details']}
          intro="Three voices: Fraunces for moments, Inter for reading and IBM Plex Mono for figures, so money lines up digit for digit."
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
                <span className="figures">{size}</span>
                <span style={{ fontSize: `var(${token})` }}>Honey</span>
              </li>
            ))}
          </ul>
        </Specimen>

        <Specimen
          id="ds-space"
          level={3}
          title="Space and shape"
          principles={['details']}
          intro="Calm and flat. A 4px rhythm, soft corners, and hairlines instead of shadows."
        >
          <div className={styles.spaceGrid}>
            <ul className={styles.spaceList}>
              {SPACE.map((step) => (
                <li key={step} className={styles.spaceRow}>
                  <span className="figures">{step * 4}px</span>
                  <span className={styles.spaceBar} style={{ width: `var(--space-${step})` }} />
                </li>
              ))}
            </ul>
            <ul className={styles.radii}>
              {RADII.map(([radius, name]) => (
                <li key={radius}>
                  <span
                    className={styles.radiusBox}
                    style={{ borderRadius: `var(--radius-${radius})` }}
                  />
                  <span className={styles.token}>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </Specimen>

        <Specimen
          id="ds-motion"
          level={3}
          title="Motion"
          principles={['accessibility', 'data']}
          intro="Movement explains a change and never decorates. Ask your device for less motion and changes simply arrive."
        >
          <MotionSpecimen />
        </Specimen>
      </Part>

      <Part
        id="ds-patterns"
        title="Patterns"
        intro="The same situation always looks and works the same way."
      >
        <Specimen
          id="ds-money"
          level={3}
          title="Money"
          principles={['data', 'details']}
          intro="The statement figure comes first. Every spend leads with what left the account, so it always matches the bank app."
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
          <div className={styles.rule}>
            <p>
              <strong>Conversions are conservative.</strong> Income converts at the rate that gives
              less, spending at the rate that costs more. The rate is kept with each spend, so
              history never shifts.
            </p>
          </div>
        </Specimen>

        <Specimen
          id="ds-state"
          level={3}
          title="State"
          principles={['accessibility']}
          intro="Never colour alone. Every state is a word, an icon and a colour, and an empty track is a hatched shape."
        >
          <div className={styles.matrixCells}>
            <Badge label="Neutral" />
            <Badge label="Moss" tone="moss" />
            <Badge label="Honey" tone="honey" />
            <Badge label="Berry" tone="berry" />
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
            <span className={styles.token}>Empty</span>
            <ProgressTrack layers={[]} pattern="hatched" />
          </div>
        </Specimen>

        <Specimen
          id="ds-button"
          level={3}
          title="Actions"
          principles={['question', 'accessibility', 'architecture']}
          intro="One button, not three. It changes emphasis and size, and always says what it does, even as just an icon."
        >
          <ButtonSpecimen />
        </Specimen>

        <Specimen
          id="ds-fields"
          level={3}
          title="Questions"
          principles={['accessibility']}
          intro="Labelled, explained and forgiving. Labels stay visible, errors say what to do, and phones never zoom in."
        >
          <Card>
            <FieldSpecimen />
          </Card>
        </Specimen>

        <Specimen
          id="ds-toast"
          level={3}
          title="Messages"
          principles={['accessibility']}
          intro="Messages wait for you. They pause while you read, errors stay until closed, and nothing important lives only in a message."
        >
          <ToastSpecimen />
        </Specimen>

        <Specimen
          id="ds-card"
          level={3}
          title="Surfaces"
          principles={['details']}
          intro="A card holds one thing. Ivory for content, parchment to group, and a honey glow for what matters most."
        >
          <div className={styles.cards}>
            <Card as="div">
              <p className={styles.cardName}>Default</p>
              <p className={styles.note}>Warm ivory. Most content.</p>
            </Card>
            <Card as="div" variant="sunken">
              <p className={styles.cardName}>Sunken</p>
              <p className={styles.note}>Parchment. Grouping inside a page.</p>
            </Card>
            <Card as="div" variant="highlight">
              <p className={styles.cardName}>Highlight</p>
              <p className={styles.note}>A honey glow for the one thing that matters most.</p>
            </Card>
            <Card as="div" padding="dense">
              <p className={styles.cardName}>Dense</p>
              <p className={styles.note}>For lists.</p>
            </Card>
          </div>
        </Specimen>

        <Specimen
          id="ds-nav"
          level={3}
          title="Wayfinding"
          principles={['accessibility', 'less']}
          intro="You always know where you are. Places outside the demo stay visible and explain themselves."
        >
          <div className={styles.navDemos}>
            <nav aria-label="Tab bar example" className={styles.navTabDemo}>
              <ul>
                <li>
                  <NavItem
                    href="/system/design-system"
                    label="Design"
                    icon={Palette}
                    orientation="tab"
                  />
                </li>
                <li>
                  <NavItem href="/budget" label="Budget" icon={PiggyBank} orientation="tab" />
                </li>
                <li>
                  <NavItem
                    href="/settings"
                    label="Settings"
                    icon={Settings}
                    orientation="tab"
                    locked
                  />
                </li>
              </ul>
            </nav>
            <nav aria-label="Side navigation example" className={styles.navSideDemo}>
              <ul>
                <li>
                  <NavItem
                    href="/system/design-system"
                    label="Design"
                    icon={Palette}
                    orientation="side"
                  />
                </li>
                <li>
                  <NavItem href="/budget" label="Budget" icon={PiggyBank} orientation="side" />
                </li>
                <li>
                  <NavItem
                    href="/settings"
                    label="Settings"
                    icon={Settings}
                    orientation="side"
                    locked
                  />
                </li>
              </ul>
            </nav>
          </div>
        </Specimen>
      </Part>

      <Part id="ds-signature" title="Signature" intro="The one thing only nestjar does.">
        <Specimen
          id="ds-jar"
          level={3}
          title="The jar"
          principles={['data', 'question']}
          intro="The brand mark becomes the gauge. Honey drains as money gets a job, so money still waiting for one is something you can see."
        >
          <ul className={styles.jars}>
            <li>
              <JarGauge level={0.72} size="lg" label="Large jar, 72% full" />
              <span className={styles.token}>Large</span>
            </li>
            <li>
              <JarGauge level={0.35} size="md" label="Medium jar, 35% full" />
              <span className={styles.token}>Medium</span>
            </li>
            <li>
              <JarGauge level={0.6} size="sm" label="Small jar, 60% full" />
              <span className={styles.token}>Small</span>
            </li>
          </ul>
        </Specimen>
      </Part>
    </div>
  );
}
