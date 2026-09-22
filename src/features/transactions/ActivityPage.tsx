import { ReceiptText } from 'lucide-react';
import { ExchangeRate, Money } from '@/components/Money/Money';
import { useBudgetMonth, type BudgetMonthData } from '@/data/budget';
import { useDisplayCurrency } from '@/data/displayCurrency';
import { equivalentCurrency, equivalentFor } from '@/domain/exchange';
import { formatDay, monthLabel, monthName } from '@/domain/month';
import type { Transaction } from '@/domain/types';
import { errorMessage } from '@/lib/errorMessages';
import { Card, ErrorState, LoadingState, PageHeading } from '@/ui';
import { accountName } from '../blueprint/format';
import { DemoTip } from '../demo/DemoGuide';
import { LogSpendButton } from './LogSpendSheet';
import styles from './Transactions.module.css';

function groupByDay(transactions: readonly Transaction[]): [string, Transaction[]][] {
  const days = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const list = days.get(txn.date) ?? [];
    list.push(txn);
    days.set(txn.date, list);
  }
  return [...days];
}

function ActivityView({ data }: { readonly data: BudgetMonthData }) {
  const { budget, structure, snapshot, rates, month } = data;
  const { currency: view } = useDisplayCurrency(budget.baseCurrency);
  const household = [
    ...new Set([budget.baseCurrency, ...structure.accounts.map((a) => a.currency)]),
  ];
  const categories = new Map(structure.categories.map((c) => [c.id, c]));
  const accounts = new Map(structure.accounts.map((a) => [a.id, a]));
  const days = groupByDay(snapshot.transactions);

  return (
    <div className={styles.days}>
      <PageHeading
        documentTitle={`Activity, ${monthLabel(month)}`}
        eyebrow={budget.name}
        actions={<LogSpendButton data={data} />}
      >
        Activity
      </PageHeading>

      {days.length === 0 ? (
        <Card>
          <div className={styles.empty}>
            <ReceiptText size={28} aria-hidden="true" />
            <h2 className={styles.emptyTitle}>Nothing spent yet</h2>
            <p className={styles.emptyBody}>
              {`Spending you log in ${monthName(month)} shows up here, newest first, with any currency conversion spelled out.`}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <DemoTip>
            Try logging a spend from the Chase account. Every row shows what was paid, the rate, and
            the same amount in your other currency.
          </DemoTip>
          {days.map(([day, transactions]) => (
            <section key={day} aria-labelledby={`day-${day}`}>
              <h2 id={`day-${day}`} className={styles.dayTitle}>
                {formatDay(day)}
              </h2>
              <Card padding="dense">
                {/* Column names for sighted readers; each cell also names itself. */}
                <div className={styles.columns} aria-hidden="true">
                  <span>Spend</span>
                  <span>Paid</span>
                  <span>Rate</span>
                  <span>Equivalent</span>
                </div>
                <ul className={styles.list}>
                  {transactions.map((txn) => {
                    const category = categories.get(txn.categoryId);
                    const account = accounts.get(txn.accountId);
                    const target = equivalentCurrency(txn.original.currency, view, household);
                    const equivalent = target
                      ? equivalentFor(txn, target, budget.baseCurrency, rates)
                      : null;
                    return (
                      <li key={txn.id} className={styles.item}>
                        <div className={styles.itemMain}>
                          <p className={styles.itemTitle}>{txn.description}</p>
                          <p className={styles.itemMeta}>
                            {category?.name ?? 'Unknown jar'}
                            {account && ` · ${accountName(account)}`}
                          </p>
                        </div>
                        <p className={styles.itemPaid}>
                          <span className="visually-hidden">Paid </span>
                          <Money value={txn.original} emphasis="strong" />
                        </p>
                        {equivalent && (
                          <>
                            <p className={styles.itemRate}>
                              <span className="visually-hidden">Rate </span>
                              <ExchangeRate
                                from={txn.original.currency}
                                to={equivalent.amount.currency}
                                rate={equivalent.rate}
                              />
                            </p>
                            <p className={styles.itemEquivalent}>
                              <span className="visually-hidden">Equivalent </span>
                              <Money value={equivalent.amount} />
                            </p>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export function ActivityPage() {
  const state = useBudgetMonth();
  if (state.status === 'error') {
    return <ErrorState onRetry={state.retry}>{errorMessage(state.error)}</ErrorState>;
  }
  if (state.status !== 'ready') return <LoadingState label="Loading activity" />;
  return <ActivityView data={state.data} />;
}
