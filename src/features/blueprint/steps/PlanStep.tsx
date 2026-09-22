import { CURRENCIES, formatMoney } from '@/domain/money';
import { monthName } from '@/domain/month';
import { cx } from '@/lib/cx';
import { MoneyField } from '@/components/MoneyField/MoneyField';
import { Card, PageHeading } from '@/ui';
import { DemoTip } from '../../demo/DemoGuide';
import { useBlueprint } from '../context';
import { fieldId } from '../draftReducer';
import styles from '../Blueprint.module.css';

export function PlanStep() {
  const { data, draft, dispatch, totals, planIssue, showIssues } = useBlueprint();
  const base = data.budget.baseCurrency;
  const planned = new Map(draft.plans.map((p) => [p.categoryId, p.amount]));
  const groups = [...data.structure.groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const over = totals.unplanned < 0;
  const fillRatio = totals.incomeBase > 0 ? Math.min(1, totals.plannedBase / totals.incomeBase) : 0;

  const status = over
    ? `${formatMoney(-totals.unplanned, base)} more than you expect to earn. Lower a jar to continue.`
    : totals.unplanned === 0
      ? `Every ${CURRENCIES[base].unit} has a plan.`
      : `${formatMoney(totals.unplanned, base)} without a plan yet. You can give it a job when you seed your jars.`;

  return (
    <>
      <PageHeading
        documentTitle="Plan: jars"
        eyebrow={`Plan ${monthName(data.month)}`}
        description="A target for every jar. Nothing moves yet: you pour money in once the month starts."
      >
        Give every jar a target
      </PageHeading>

      <DemoTip>
        These targets are pre-filled. Try raising one past your income to see the plan push back.
      </DemoTip>

      <div className={styles.planLayout}>
        <div className={styles.cardList}>
          {groups.map((group) => {
            const categories = data.structure.categories
              .filter((c) => c.groupId === group.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (categories.length === 0) return null;
            return (
              <Card key={group.id}>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>{group.name}</legend>
                  <ul className={styles.rows}>
                    {categories.map((category) => (
                      <li key={category.id} className={styles.row}>
                        <MoneyField
                          id={fieldId(`plan.${category.id}`)}
                          label={category.name}
                          currency={base}
                          value={planned.get(category.id) ?? null}
                          onValueChange={(amount) =>
                            dispatch({
                              type: 'plan',
                              categoryId: category.id,
                              amount,
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </fieldset>
              </Card>
            );
          })}
        </div>

        <section
          id="plan-summary"
          tabIndex={-1}
          aria-labelledby="plan-summary-title"
          className={cx(styles.summary, over && styles.summaryOver)}
        >
          <h2 id="plan-summary-title" className={styles.summaryTitle}>
            Plan so far
          </h2>
          <dl className={styles.summaryFigures}>
            <div>
              <dt>Expected income</dt>
              <dd className="figures">{formatMoney(totals.incomeBase, base)}</dd>
            </div>
            <div>
              <dt>Planned</dt>
              <dd className="figures">{formatMoney(totals.plannedBase, base)}</dd>
            </div>
          </dl>
          <div className={styles.meter} aria-hidden="true">
            <div className={styles.meterFill} style={{ width: `${fillRatio * 100}%` }} />
          </div>
          <p className={styles.summaryStatus} {...(over && showIssues ? { role: 'alert' } : {})}>
            {status}
          </p>
          {planIssue === 'nothing-planned' && showIssues && (
            <p role="alert" className={styles.summaryStatus}>
              Plan at least one jar to continue.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
