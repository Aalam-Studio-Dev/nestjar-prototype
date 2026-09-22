import { monthName } from '@/domain/month';
import { MoneyField } from '@/components/MoneyField/MoneyField';
import { Card, PageHeading } from '@/ui';
import { useBlueprint } from '../context';
import { fieldId } from '../draftReducer';
import { accountDetail, accountName } from '../format';
import styles from '../Blueprint.module.css';

export function BalancesStep() {
  const { data, draft, dispatch, issues, showIssues } = useBlueprint();
  const month = monthName(data.month);

  return (
    <>
      <PageHeading
        documentTitle="Plan: balances"
        eyebrow={`Plan ${month}`}
        description={`What is in each account on 1 ${month}. Balances let you check the plan against real money. They are never counted as income.`}
      >
        Where does each account start?
      </PageHeading>

      <Card>
        <ul className={styles.rows}>
          {draft.balances.map((row) => {
            const account = data.structure.accounts.find((a) => a.id === row.accountId);
            if (!account) return null;
            const key = `balance.${row.accountId}`;
            return (
              <li key={row.accountId} className={styles.row}>
                <MoneyField
                  id={fieldId(key)}
                  label={accountName(account)}
                  hint={accountDetail(account, data.budget)}
                  currency={account.currency}
                  value={row.amount}
                  onValueChange={(amount) =>
                    dispatch({
                      type: 'balance',
                      accountId: row.accountId,
                      amount,
                    })
                  }
                  error={
                    showIssues && issues[key]
                      ? 'Enter the balance, or 0 if the account is empty.'
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
