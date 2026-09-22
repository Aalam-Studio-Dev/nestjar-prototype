import { Sprout } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { validateSeedAmount, type JarSummary } from '@/domain/budget';
import {
  CURRENCIES,
  formatMoney,
  type CurrencyCode,
  type FormatOptions,
  type Minor,
} from '@/domain/money';
import type { MonthKey } from '@/domain/month';
import { useSeed } from '@/data/month';
import { errorMessage } from '@/lib/errorMessages';
import { jarStateLabel } from '@/components/JarState/JarState';
import { MoneyField } from '@/components/MoneyField/MoneyField';
import { Button, Sheet, useToast } from '@/ui';
import styles from './Budget.module.css';

export interface SeedSheetProps {
  readonly jar: JarSummary | null;
  readonly onClose: () => void;
  readonly budgetId: string;
  readonly month: MonthKey;
  readonly baseCurrency: CurrencyCode;
  readonly displayCurrency: CurrencyCode;
  readonly readyToSeed: Minor;
  /** Pre-filled amount. Defaults to topping the jar up to plan. */
  readonly suggested?: Minor | undefined;
  readonly format: (amount: Minor, options?: FormatOptions) => string;
}

const FORM_ID = 'seed-jar-form';
const AMOUNT_ID = 'seed-jar-amount';

interface SeedFormProps {
  readonly jar: JarSummary;
  readonly baseCurrency: CurrencyCode;
  readonly displayCurrency: CurrencyCode;
  readonly readyToSeed: Minor;
  readonly suggested: Minor | undefined;
  readonly format: (amount: Minor, options?: FormatOptions) => string;
  readonly error: unknown;
  readonly onSubmit: (amount: Minor) => void;
}

function SeedForm({
  jar,
  baseCurrency,
  displayCurrency,
  readyToSeed,
  suggested,
  format,
  error,
  onSubmit,
}: SeedFormProps) {
  const fallback = Math.min(jar.shortfall > 0 ? jar.shortfall : readyToSeed, readyToSeed);
  const [amount, setAmount] = useState<Minor | null>(suggested ?? (fallback > 0 ? fallback : null));
  const [touched, setTouched] = useState(false);
  const validation = validateSeedAmount(amount, readyToSeed);

  let fieldError: string | undefined;
  if (touched && !validation.ok) {
    fieldError =
      validation.reason === 'exceeds-available'
        ? `You have ${formatMoney(readyToSeed, baseCurrency)} left to seed.`
        : 'Enter an amount above zero.';
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!validation.ok || amount === null) {
      window.requestAnimationFrame(() => document.getElementById(AMOUNT_ID)?.focus());
      return;
    }
    onSubmit(amount);
  };

  const quickPicks: { label: string; value: Minor }[] = [];
  if (jar.shortfall > 0 && jar.shortfall <= readyToSeed) {
    quickPicks.push({ label: 'Top up to plan', value: jar.shortfall });
  }
  if (readyToSeed > 0 && readyToSeed !== jar.shortfall) {
    quickPicks.push({ label: 'Everything left', value: readyToSeed });
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className={styles.sheetForm}>
      <dl className={styles.sheetFigures}>
        <div>
          <dt>Planned</dt>
          <dd className="figures">{format(jar.planned)}</dd>
        </div>
        <div>
          <dt>Seeded</dt>
          <dd className="figures">{format(jar.seeded)}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd className="figures">{format(jar.spent)}</dd>
        </div>
        <div>
          <dt>Left</dt>
          <dd className="figures">{format(jar.remaining)}</dd>
        </div>
      </dl>

      {readyToSeed > 0 ? (
        <>
          <MoneyField
            id={AMOUNT_ID}
            label="Amount to seed"
            currency={baseCurrency}
            value={amount}
            onValueChange={(next) => {
              setAmount(next);
              setTouched(true);
            }}
            error={fieldError}
            hint={
              displayCurrency !== baseCurrency
                ? `Seeding happens in ${baseCurrency}, the budget's base currency.`
                : undefined
            }
          />
          {quickPicks.length > 0 && (
            <div className={styles.quickPicks} role="group" aria-label="Quick amounts">
              {quickPicks.map((pick) => (
                <button
                  key={pick.label}
                  type="button"
                  className={styles.quickPick}
                  aria-pressed={amount === pick.value}
                  onClick={() => {
                    setAmount(pick.value);
                    setTouched(true);
                  }}
                >
                  {pick.label}{' '}
                  <span className="figures">{formatMoney(pick.value, baseCurrency)}</span>
                </button>
              ))}
            </div>
          )}
          {error !== null && (
            <p role="alert" className={styles.formError}>
              {errorMessage(error)}
            </p>
          )}
        </>
      ) : (
        <p className={styles.sheetNote}>
          {`The central jar is empty. Every ${CURRENCIES[baseCurrency].unit} this month already has a job.`}
        </p>
      )}
    </form>
  );
}

/** Moves money from the central jar into one category jar. */
export function SeedSheet({
  jar,
  onClose,
  budgetId,
  month,
  baseCurrency,
  displayCurrency,
  readyToSeed: liveReadyToSeed,
  suggested,
  format,
}: SeedSheetProps) {
  const toast = useToast();
  const seed = useSeed(budgetId, month);
  // The optimistic update drains the jar before the sheet closes. Freeze the
  // figure the person was working with so the form does not flicker.
  const [frozenReady, setFrozenReady] = useState<Minor | null>(null);
  const readyToSeed = frozenReady ?? liveReadyToSeed;

  const close = () => {
    seed.reset();
    setFrozenReady(null);
    onClose();
  };

  const submit = (amount: Minor) => {
    if (!jar || seed.isPending) return;
    setFrozenReady(liveReadyToSeed);
    seed.mutate([{ categoryId: jar.category.id, amount }], {
      onSuccess: () => {
        toast.show({
          message: `Seeded ${formatMoney(amount, baseCurrency)} into ${jar.category.name}. ${formatMoney(readyToSeed - amount, baseCurrency)} left in the central jar.`,
        });
        close();
      },
      onError: () => setFrozenReady(null),
    });
  };

  return (
    <Sheet
      open={jar !== null}
      onClose={close}
      title={jar ? `Seed ${jar.category.name}` : 'Seed a jar'}
      description={
        jar
          ? `${jarStateLabel(jar.state)}. ${format(readyToSeed)} left in the central jar.`
          : undefined
      }
      footer={
        jar && readyToSeed > 0 ? (
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            fullWidth
            loading={seed.isPending}
            loadingLabel="Seeding"
            label="Seed jar"
            icon={<Sprout size={18} aria-hidden="true" />}
          />
        ) : (
          <Button variant="secondary" size="lg" fullWidth onClick={close} label="Close" />
        )
      }
    >
      {jar && (
        <SeedForm
          // Keyed by jar, so reopening on another jar starts from its own suggestion.
          key={`${jar.category.id}-${suggested ?? 'plan'}`}
          jar={jar}
          baseCurrency={baseCurrency}
          displayCurrency={displayCurrency}
          readyToSeed={readyToSeed}
          suggested={suggested}
          format={format}
          error={seed.error}
          onSubmit={submit}
        />
      )}
    </Sheet>
  );
}
