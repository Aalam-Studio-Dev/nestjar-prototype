import { Plus, ReceiptText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { BudgetMonthData } from '@/data/budget';
import { useDisplayCurrency } from '@/data/displayCurrency';
import { useLogTransaction } from '@/data/month';
import { useServices } from '@/data/ServicesProvider';
import { findJar } from '@/domain/budget';
import { convertConservatively, equivalentCurrency, equivalentFor } from '@/domain/exchange';
import { formatMoney, money, type Minor } from '@/domain/money';
import { dateInMonth, isDateInMonth, monthName } from '@/domain/month';
import { errorMessage } from '@/lib/errorMessages';
import { MoneyField } from '@/components/MoneyField/MoneyField';
import { Button, SelectField, Sheet, TextField, useToast } from '@/ui';
import { accountName } from '../blueprint/format';
import styles from './Transactions.module.css';

const FORM_ID = 'log-spend-form';
const FIELD = {
  description: 'spend-description',
  amount: 'spend-amount',
  date: 'spend-date',
} as const;

type Errors = Partial<Record<keyof typeof FIELD, string>>;

type LogMutation = ReturnType<typeof useLogTransaction>;

function LogSpendForm({
  data,
  log,
  onDone,
}: {
  readonly data: BudgetMonthData;
  readonly log: LogMutation;
  readonly onDone: () => void;
}) {
  const { budget, structure, rates, month } = data;
  const script = useServices().demo.getScript()?.sampleSpend;
  const toast = useToast();
  const { currency: view } = useDisplayCurrency(budget.baseCurrency);
  const household = [
    ...new Set([budget.baseCurrency, ...structure.accounts.map((a) => a.currency)]),
  ];

  const initialCategory =
    structure.categories.find((c) => c.name === script?.categoryName) ?? structure.categories[0];
  const initialAccount =
    structure.accounts.find((a) => a.name === script?.accountName) ?? structure.accounts[0];

  const [description, setDescription] = useState(script?.description ?? '');
  const [amount, setAmount] = useState<Minor | null>(script?.amount ?? null);
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? '');
  const [accountId, setAccountId] = useState(initialAccount?.id ?? '');
  const [date, setDate] = useState(dateInMonth(month, script?.day ?? 1));
  const [errors, setErrors] = useState<Errors>({});

  const account = structure.accounts.find((a) => a.id === accountId);
  const category = structure.categories.find((c) => c.id === categoryId);
  const currency = account?.currency ?? budget.baseCurrency;
  const conversion =
    amount !== null && amount > 0
      ? convertConservatively(money(amount, currency), budget.baseCurrency, rates, 'outflow')
      : null;

  const conversionHint = conversion?.rate
    ? `Counts as ${formatMoney(conversion.base.amount, budget.baseCurrency)} at the ${conversion.rate.kind} rate of ${conversion.rate.value}. Spending uses whichever rate costs more.`
    : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (log.isPending) return;
    const next: Errors = {};
    if (description.trim() === '') next.description = 'Say what this was for.';
    if (amount === null || amount <= 0) next.amount = 'Enter an amount above zero.';
    if (!isDateInMonth(date, month)) next.date = `Choose a date in ${monthName(month)}.`;
    setErrors(next);
    const firstInvalid = (Object.keys(FIELD) as (keyof typeof FIELD)[]).find((key) => next[key]);
    if (firstInvalid) {
      window.requestAnimationFrame(() => document.getElementById(FIELD[firstInvalid])?.focus());
      return;
    }
    if (!account || !category || amount === null) return;

    log.mutate(
      { accountId, categoryId, date, description, amount, currency },
      {
        onSuccess: (txn) => {
          const jar = findJar(data.summary, categoryId);
          const left = jar ? jar.remaining - txn.base : null;
          // Name the other currency too, as the Activity row will.
          const target = equivalentCurrency(currency, view, household);
          const equivalent = target ? equivalentFor(txn, target, budget.baseCurrency, rates) : null;
          const paid = equivalent
            ? `${formatMoney(amount, currency)} (${formatMoney(equivalent.amount.amount, equivalent.amount.currency)})`
            : formatMoney(amount, currency);
          toast.show({
            message:
              left === null
                ? `Logged ${paid} in ${category.name}.`
                : `Logged ${paid} in ${category.name}. ${formatMoney(left, budget.baseCurrency)} left in the jar.`,
          });
          onDone();
        },
      },
    );
  };

  const groups = [...structure.groups].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
      <TextField
        id={FIELD.description}
        label="What was it?"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        error={errors.description}
        autoComplete="off"
        maxLength={80}
      />
      <div className={styles.pair}>
        <SelectField
          label="Paid from"
          value={accountId}
          options={structure.accounts.map((a) => ({
            value: a.id,
            label: accountName(a),
          }))}
          onChange={(event) => setAccountId(event.target.value)}
        />
        <MoneyField
          id={FIELD.amount}
          label="Amount"
          currency={currency}
          value={amount}
          onValueChange={setAmount}
          error={errors.amount}
          hint={conversionHint}
        />
      </div>
      <div className={styles.pair}>
        <SelectField
          label="Jar"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          options={groups.map((group) => ({
            label: group.name,
            options: structure.categories
              .filter((c) => c.groupId === group.id)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((c) => ({ value: c.id, label: c.name })),
          }))}
        />
        <TextField
          id={FIELD.date}
          label="Date"
          type="date"
          value={date}
          min={dateInMonth(month, 1)}
          max={dateInMonth(month, 31)}
          onChange={(event) => setDate(event.target.value)}
          error={errors.date}
        />
      </div>
      {log.isError && (
        <p role="alert" className={styles.formError}>
          {errorMessage(log.error)}
        </p>
      )}
    </form>
  );
}

/**
 * The button that opens the log sheet. On phones it floats above the tab
 * bar as the page's primary action; on wide screens it sits in the header.
 */
export function LogSpendButton({ data }: { readonly data: BudgetMonthData }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const log = useLogTransaction(data.budget.id, data.month);

  const close = () => {
    log.reset();
    setOpen(false);
  };

  return (
    <>
      <Button
        className={styles.fab}
        onClick={() => {
          setFormKey((key) => key + 1);
          setOpen(true);
        }}
        label="Log spend"
        icon={<Plus size={20} aria-hidden="true" />}
        aria-haspopup="dialog"
      />
      <Sheet
        open={open}
        onClose={close}
        title="Log spending"
        description={`Record money that left one of your accounts in ${monthName(data.month)}.`}
        footer={
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            fullWidth
            loading={log.isPending}
            loadingLabel="Logging"
            label="Log spend"
            icon={<ReceiptText size={18} aria-hidden="true" />}
          />
        }
      >
        <LogSpendForm key={formKey} data={data} log={log} onDone={close} />
      </Sheet>
    </>
  );
}
