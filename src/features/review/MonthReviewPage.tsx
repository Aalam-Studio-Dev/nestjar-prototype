import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JarGauge } from '@/components/JarGauge/JarGauge';
import { useMoneyFormatter } from '@/data/displayCurrency';
import { useBudgetMonth, useResetDemo, type BudgetMonthData } from '@/data/budget';
import { monthLabel, monthName } from '@/domain/month';
import { errorMessage } from '@/lib/errorMessages';
import { Button, Card, ErrorState, LoadingState, PageHeading } from '@/ui';
import styles from './MonthReview.module.css';

const NEXT_IN_PRODUCT = [
  'Bank feeds match expected pay to real deposits and flag the difference.',
  'Transfers between your accounts move money without counting it as spending.',
  'Next month starts from this one, so planning takes minutes, not an evening.',
] as const;

function ReviewView({ data }: { readonly data: BudgetMonthData }) {
  const { budget, summary, rates, month } = data;
  const format = useMoneyFormatter(budget.baseCurrency, rates);
  const reset = useResetDemo();
  const navigate = useNavigate();
  const name = monthName(month);
  const left = summary.seeded - summary.spent;

  return (
    <div className={styles.page}>
      <PageHeading
        documentTitle={`${monthLabel(month)} at a glance`}
        eyebrow={budget.name}
        description={
          summary.isFullySeeded
            ? `Every bit of ${name}'s income has a job. Here is the shelf.`
            : `${format(summary.readyToSeed)} is still in the central jar.`
        }
      >
        {`${name} at a glance`}
      </PageHeading>

      <Card>
        <dl className={styles.totals}>
          <div>
            <dt>Income</dt>
            <dd className="figures">{format(summary.income)}</dd>
          </div>
          <div>
            <dt>Seeded into jars</dt>
            <dd className="figures">{format(summary.seeded)}</dd>
          </div>
          <div>
            <dt>Spent so far</dt>
            <dd className="figures">{format(summary.spent)}</dd>
          </div>
          <div>
            <dt>Left in jars</dt>
            <dd className="figures">{format(left)}</dd>
          </div>
        </dl>
      </Card>

      <section aria-labelledby="shelf-title">
        <h2 id="shelf-title" className={styles.sectionTitle}>
          The shelf
        </h2>
        <ul className={styles.shelf}>
          {summary.groups
            .flatMap((g) => g.jars)
            .map((jar) => {
              const level = jar.seeded > 0 ? Math.max(0, jar.remaining) / jar.seeded : 0;
              return (
                <li key={jar.category.id} className={styles.shelfItem}>
                  <JarGauge level={level} size="sm" label={`${Math.round(level * 100)}% left`} />
                  <span className={styles.shelfName}>{jar.category.name}</span>
                  <span className={`figures ${styles.shelfFigure}`}>{format(jar.remaining)}</span>
                </li>
              );
            })}
        </ul>
      </section>

      <Card aria-labelledby="next-title">
        <h2 id="next-title" className={styles.sectionTitle}>
          Beyond this demo
        </h2>
        <p className={styles.nextIntro}>
          This prototype covers one month, start to finish. The full product picks up from here:
        </p>
        <ul className={styles.nextList}>
          {NEXT_IN_PRODUCT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <div className={styles.actions}>
        <Button
          href="/budget"
          variant="secondary"
          label="Back to budget"
          icon={<ArrowLeft size={18} aria-hidden="true" />}
        />
        <Button
          variant="ghost"
          loading={reset.isPending}
          loadingLabel="Restarting"
          label="Walk through again"
          icon={<RotateCcw size={18} aria-hidden="true" />}
          onClick={() =>
            reset.mutate(undefined, {
              onSuccess: () => navigate('/welcome', { replace: true }),
            })
          }
        />
      </div>
    </div>
  );
}

export function MonthReviewPage() {
  const state = useBudgetMonth();
  if (state.status === 'error') {
    return <ErrorState onRetry={state.retry}>{errorMessage(state.error)}</ErrorState>;
  }
  if (state.status !== 'ready') return <LoadingState />;
  return <ReviewView data={state.data} />;
}
