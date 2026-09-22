import { Link } from 'react-router-dom';
import { JarGauge } from '@/components/JarGauge/JarGauge';
import { convertConservatively } from '@/domain/exchange';
import { formatMoney, money } from '@/domain/money';
import { monthName } from '@/domain/month';
import { Card, PageHeading } from '@/ui';
import { DemoTip } from '../../demo/DemoGuide';
import { useBlueprint } from '../context';
import { accountName, firstName } from '../format';
import styles from '../Blueprint.module.css';

export function ReviewStep() {
  const { data, draft, totals } = useBlueprint();
  const { budget, structure, rates } = data;
  const base = budget.baseCurrency;
  const month = monthName(data.month);
  const plannedJars = draft.plans.filter((p) => (p.amount ?? 0) > 0).length;

  return (
    <>
      <PageHeading
        documentTitle="Plan: review"
        eyebrow={`Plan ${month}`}
        description="Starting the month fills the central jar with expected income. From there, you pour it into your jars."
      >
        {`Ready to start ${month}?`}
      </PageHeading>

      <DemoTip>Starting the month opens the budget. That is where the jar starts to drain.</DemoTip>

      <Card className={styles.reviewHero}>
        <JarGauge
          level={1}
          size="md"
          label={`A full jar holding ${formatMoney(totals.incomeBase, base)}`}
        />
        <div>
          <p className={styles.reviewLabel}>Your central jar will hold</p>
          <p className={`figures ${styles.reviewFigure}`}>{formatMoney(totals.incomeBase, base)}</p>
          <p className={styles.reviewNote}>
            {plannedJars} jars planned for {formatMoney(totals.plannedBase, base)}.{' '}
            {totals.unplanned > 0 &&
              `${formatMoney(totals.unplanned, base)} is left to give a job.`}
          </p>
        </div>
      </Card>

      <Card aria-labelledby="review-income">
        <div className={styles.reviewHeader}>
          <h2 id="review-income" className={styles.reviewTitle}>
            Income
          </h2>
          <Link to="/plan/income" className={styles.editLink}>
            Edit<span className="visually-hidden"> income</span>
          </Link>
        </div>
        <ul className={styles.reviewList}>
          {draft.income.map((line) => {
            const member = budget.members.find((m) => m.id === line.memberId);
            const conversion = convertConservatively(
              money(line.amount ?? 0, line.currency),
              base,
              rates,
              'inflow',
            );
            return (
              <li key={line.key} className={styles.reviewItem}>
                <span>
                  {member
                    ? `${firstName(member.displayName)}'s ${line.label.toLowerCase()}`
                    : line.label}
                </span>
                <span className={styles.reviewAmounts}>
                  <span className="figures">{formatMoney(line.amount ?? 0, line.currency)}</span>
                  {conversion.rate && (
                    <span className={styles.reviewConverted}>
                      counts as{' '}
                      <span className="figures">{formatMoney(conversion.base.amount, base)}</span>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card aria-labelledby="review-jars">
        <div className={styles.reviewHeader}>
          <h2 id="review-jars" className={styles.reviewTitle}>
            Jars
          </h2>
          <Link to="/plan/plan" className={styles.editLink}>
            Edit<span className="visually-hidden"> jars</span>
          </Link>
        </div>
        <ul className={styles.reviewList}>
          {[...structure.groups]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((group) => {
              const ids = new Set(
                structure.categories.filter((c) => c.groupId === group.id).map((c) => c.id),
              );
              const total = draft.plans
                .filter((p) => ids.has(p.categoryId))
                .reduce((sum, p) => sum + (p.amount ?? 0), 0);
              return (
                <li key={group.id} className={styles.reviewItem}>
                  <span>
                    {group.name}
                    <span className={styles.reviewConverted}>
                      {' '}
                      {ids.size} {ids.size === 1 ? 'jar' : 'jars'}
                    </span>
                  </span>
                  <span className="figures">{formatMoney(total, base)}</span>
                </li>
              );
            })}
        </ul>
      </Card>

      <Card aria-labelledby="review-balances">
        <div className={styles.reviewHeader}>
          <h2 id="review-balances" className={styles.reviewTitle}>
            Starting balances
          </h2>
          <Link to="/plan/balances" className={styles.editLink}>
            Edit<span className="visually-hidden"> starting balances</span>
          </Link>
        </div>
        <ul className={styles.reviewList}>
          {draft.balances.map((row) => {
            const account = structure.accounts.find((a) => a.id === row.accountId);
            if (!account) return null;
            return (
              <li key={row.accountId} className={styles.reviewItem}>
                <span>{accountName(account)}</span>
                <span className="figures">{formatMoney(row.amount ?? 0, account.currency)}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
