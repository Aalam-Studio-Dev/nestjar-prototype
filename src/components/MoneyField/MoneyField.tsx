import { forwardRef, useState, type ReactNode } from 'react';
import {
  CURRENCIES,
  parseAmount,
  toInputValue,
  type CurrencyCode,
  type Minor,
} from '@/domain/money';
import { TextField, type TextFieldProps } from '@/ui';

export interface MoneyFieldProps extends Omit<
  TextFieldProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'type'
  | 'inputMode'
  | 'prefix'
  | 'suffix'
  | 'numeric'
  | 'label'
> {
  readonly label: ReactNode;
  readonly currency: CurrencyCode;
  /** Minor units, or null when the field is empty or unparseable. */
  readonly value: Minor | null;
  readonly onValueChange: (value: Minor | null) => void;
}

function formatForEditing(value: Minor | null): string {
  if (value === null) return '';
  const text = toInputValue(value);
  return text === '' ? '0' : text;
}

/**
 * A text field that speaks minor units. It keeps what the person typed
 * (including half-finished values like "12.") and reports the parsed amount.
 * On blur it tidies the display to two decimal places.
 */
export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField(
  { currency, value, onValueChange, onBlur, ...rest },
  ref,
) {
  const [raw, setRaw] = useState(() => formatForEditing(value));
  const [lastValue, setLastValue] = useState(value);

  // Adopt changes made from outside (a reset, a suggestion chip) without
  // fighting the person while they type.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseAmount(raw) !== value) setRaw(formatForEditing(value));
  }

  const info = CURRENCIES[currency];

  return (
    <TextField
      ref={ref}
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      numeric
      prefix={info.symbol}
      suffix={info.code}
      value={raw}
      onChange={(event) => {
        const next = event.target.value;
        setRaw(next);
        const parsed = parseAmount(next);
        setLastValue(parsed);
        onValueChange(parsed);
      }}
      onBlur={(event) => {
        const parsed = parseAmount(raw);
        if (parsed !== null) {
          const whole = parsed % 100 === 0;
          setRaw(whole ? String(parsed / 100) : (parsed / 100).toFixed(2));
        }
        onBlur?.(event);
      }}
    />
  );
});
