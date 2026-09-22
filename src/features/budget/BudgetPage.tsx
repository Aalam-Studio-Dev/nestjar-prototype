import { useState } from 'react';
import { useDisplayCurrency, useMoneyFormatter } from '@/data/displayCurrency';
import { useBudgetMonth, type BudgetMonthData } from '@/data/budget';
import { useSeed } from '@/data/month';
import { findJar, planSeedAllToPlan, type JarSummary } from '@/domain/budget';
import { CURRENCIES, formatMoney, type Minor } from '@/domain/money';
import { monthLabel, monthName } from '@/domain/month';
import { errorMessage } from '@/lib/errorMessages';
import { Card, ErrorState, LoadingState, PageHeading, useToast } from '@/ui';
import { DemoTip } from '../demo/DemoGuide';
import { LogSpendButton } from '../transactions/LogSpendSheet';
import { CentralJar } from './CentralJar';
import { CurrencyToggle } from './CurrencyToggle';
import { JarRow } from './JarRow';
import { SeedSheet } from './SeedSheet';
import styles from './Budget.module.css';

interface OpenSheet {
  readonly categoryId: string;
  readonly suggested?: Minor;
}

function tipFor(data: BudgetMonthData): string {
  const { summary } = data;
  if (summary.isFullySeeded) {
    return summary.spent > 0
      ? 'Tap a jar to see what is left in it, or open the month at a glance.'
      : 'Try logging a spend. Watch its jar change colour as money leaves it.';
  }
  const shortfall = summary.groups.flatMap((g) => g.jars).some((j) => j.shortfall > 0);
  return shortfall
    ? 'Seed all to plan fills every jar in one go. Or tap a single jar to seed it by hand.'
    : `The last few ${CURRENCIES[data.budget.baseCurrency].unit}s need a decision. Pick a goal jar to give them a home.`;
}

function BudgetView({ data }: { readonly data: BudgetMonthData }) {
  const { budget, summary, rates, month } = data;
  const format = useMoneyFormatter(budget.baseCurrency, rates);
  const { currency: displayCurrency } = useDisplayCurrency(budget.baseCurrency);
  const toast = useToast();
  const seedAll = useSeed(budget.id, month);
  const [sheet, setSheet] = useState<OpenSheet | null>(null);

  const openJar: JarSummary | null = sheet ? (findJar(summary, sheet.categoryId) ?? null) : null;
  const name = monthName(month);

  const handleSeedAll = () => {
    if (seedAll.isPending) return;
    const instructions = planSeedAllToPlan(summary);
    const total = instructions.reduce((sum, i) => sum + i.amount, 0);
    seedAll.mutate(instructions, {
      onSuccess: () => {
        toast.show({
          message: `Seeded ${formatMoney(total, budget.baseCurrency)} across ${instructions.length} jars. ${formatMoney(summary.readyToSeed - total, budget.baseCurrency)} left in the central jar.`,
        });
      },
      onError: (error) =>
        toast.show({
          message: errorMessage(error),
          tone: 'error',
          persistent: true,
        }),
    });
    // The optimistic update replaces this button with the next step at once,
    // so move focus to a stable place first: the central jar's heading.
    document.getElementById('central-jar-title')?.focus();
  };

  return (
    <div className={styles.page}>
      <PageHeading
        documentTitle={`Budget, ${monthLabel(month)}`}
        eyebrow={budget.name}
        actions={
          <>
            <CurrencyToggle baseCurrency={budget.baseCurrency} />
            <LogSpendButton data={data} />
          </>
        }
      >
        {monthLabel(month)}
      </PageHeading>

      <DemoTip>{tipFor(data)}</DemoTip>

      <div className={styles.layout}>
        <div className={styles.aside}>
          <Card variant="highlight">
            <CentralJar
              summary={summary}
              monthName={name}
              unit={CURRENCIES[budget.baseCurrency].unit}
              format={format}
              seedAllPending={seedAll.isPending}
              onSeedAll={handleSeedAll}
              onGiveHome={(jar) =>
                setSheet({
                  categoryId: jar.category.id,
                  suggested: summary.readyToSeed,
                })
              }
            />
          </Card>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Income</dt>
              <dd className="figures">{format(summary.income, { trimWholeUnits: true })}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Seeded</dt>
              <dd className="figures">{format(summary.seeded, { trimWholeUnits: true })}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Spent</dt>
              <dd className="figures">{format(summary.spent, { trimWholeUnits: true })}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.groups}>
          {summary.groups.map((group) => (
            <section
              key={group.group.id}
              className={styles.group}
              aria-labelledby={`group-${group.group.id}`}
            >
              <div className={styles.groupHeader}>
                <h2 id={`group-${group.group.id}`} className={styles.groupName}>
                  {group.group.name}
                </h2>
                <p className={styles.groupTotal}>
                  <span className="figures">{format(group.seeded)}</span> of{' '}
                  <span className="figures">{format(group.planned)}</span> seeded
                </p>
              </div>
              <ul className={styles.jarList}>
                {group.jars.map((jar) => (
                  <JarRow
                    key={jar.category.id}
                    jar={jar}
                    format={format}
                    onOpen={(categoryId) => setSheet({ categoryId })}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <SeedSheet
        jar={openJar}
        suggested={sheet?.suggested}
        onClose={() => setSheet(null)}
        budgetId={budget.id}
        month={month}
        baseCurrency={budget.baseCurrency}
        displayCurrency={displayCurrency}
        readyToSeed={summary.readyToSeed}
        format={format}
      />
    </div>
  );
}

export function BudgetPage() {
  const state = useBudgetMonth();
  if (state.status === 'error') {
    return <ErrorState onRetry={state.retry}>{errorMessage(state.error)}</ErrorState>;
  }
  if (state.status !== 'ready') return <LoadingState label="Loading your budget" />;
  return <BudgetView data={state.data} />;
}
