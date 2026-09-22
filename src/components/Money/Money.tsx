import { formatRate, type AppliedRate } from '@/domain/exchange';
import { formatMoney, type CurrencyCode, type Money as MoneyValue } from '@/domain/money';
import { cx } from '@/lib/cx';
import styles from './Money.module.css';

export interface MoneyProps {
  readonly value: MoneyValue;
  /** strong for the figure that matters most in its row. */
  readonly emphasis?: 'strong' | 'normal';
  readonly className?: string | undefined;
}

/** An amount in its own currency, set in the figures face. */
export function Money({ value, emphasis = 'normal', className }: MoneyProps) {
  return (
    <span className={cx('figures', styles.money, styles[emphasis], className)}>
      {formatMoney(value.amount, value.currency)}
    </span>
  );
}

const RATE_KIND = { live: "today's rate", fixed: 'planning rate' } as const;

export interface ExchangeRateProps {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly rate: AppliedRate;
  readonly className?: string | undefined;
}

/** "$1 = £0.781, today's rate". Always names which of the two rates was used. */
export function ExchangeRate({ from, to, rate, className }: ExchangeRateProps) {
  return (
    <span className={cx(styles.rate, className)}>
      <span className={styles.rateValue}>{formatRate(from, to, rate.value)}</span>
      <span className={styles.rateKind}>{RATE_KIND[rate.kind]}</span>
    </span>
  );
}
