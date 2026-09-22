import { convertConservatively } from '@/domain/exchange';
import { formatMoney, money } from '@/domain/money';
import { monthName } from '@/domain/month';
import { MoneyField } from '@/components/MoneyField/MoneyField';
import { Card, PageHeading, SelectField, TextField } from '@/ui';
import { useBlueprint } from '../context';
import { fieldId } from '../draftReducer';
import { accountName, firstName } from '../format';
import styles from '../Blueprint.module.css';

export function IncomeStep() {
  const { data, draft, dispatch, issues, showIssues } = useBlueprint();
  const { budget, structure, rates } = data;
  const base = budget.baseCurrency;

  return (
    <>
      <PageHeading
        documentTitle="Plan: income"
        eyebrow={`Plan ${monthName(data.month)}`}
        description="Expected pay for the month. Money in another currency is counted at whichever rate gives less, so the plan never relies on a good exchange day."
      >
        What is coming in?
      </PageHeading>

      <ul className={styles.cardList}>
        {draft.income.map((line) => {
          const member = budget.members.find((m) => m.id === line.memberId);
          const accounts = structure.accounts.filter(
            (a) => a.ownerId === line.memberId || a.ownerId === null,
          );
          const conversion =
            line.amount !== null && line.amount > 0
              ? convertConservatively(money(line.amount, line.currency), base, rates, 'inflow')
              : null;
          const hint =
            conversion?.rate != null
              ? `Counts as ${formatMoney(conversion.base.amount, base)} at the ${conversion.rate.kind} rate of ${conversion.rate.value}.`
              : undefined;
          const labelKey = `income.${line.key}.label`;
          const amountKey = `income.${line.key}.amount`;
          const ownerName = member ? firstName(member.displayName) : 'Partner';

          return (
            <li key={line.key}>
              <Card>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>{`${ownerName}'s income`}</legend>
                  <div className={styles.fieldGrid}>
                    <TextField
                      id={fieldId(labelKey)}
                      label="Name"
                      value={line.label}
                      onChange={(event) =>
                        dispatch({
                          type: 'income',
                          key: line.key,
                          patch: { label: event.target.value },
                        })
                      }
                      error={
                        showIssues && issues[labelKey] ? 'Give this income a name.' : undefined
                      }
                      autoComplete="off"
                    />
                    <SelectField
                      label="Paid into"
                      value={line.accountId}
                      options={accounts.map((a) => ({
                        value: a.id,
                        label: accountName(a),
                      }))}
                      onChange={(event) => {
                        const account = accounts.find((a) => a.id === event.target.value);
                        if (!account) return;
                        dispatch({
                          type: 'income',
                          key: line.key,
                          patch: { accountId: account.id },
                          currency: account.currency,
                        });
                      }}
                    />
                    <MoneyField
                      id={fieldId(amountKey)}
                      label="Expected amount"
                      currency={line.currency}
                      value={line.amount}
                      onValueChange={(amount) =>
                        dispatch({
                          type: 'income',
                          key: line.key,
                          patch: { amount },
                        })
                      }
                      hint={hint}
                      error={
                        showIssues && issues[amountKey] ? 'Enter an amount above zero.' : undefined
                      }
                      fieldClassName={styles.span2}
                    />
                  </div>
                </fieldset>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
