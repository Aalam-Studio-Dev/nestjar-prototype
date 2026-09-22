import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import { Field } from './Field';
import styles from './Field.module.css';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectOptionGroup {
  readonly label: string;
  readonly options: readonly SelectOption[];
}

export interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'children'
> {
  readonly label: ReactNode;
  /** Either a flat list of options or labelled groups (rendered as <optgroup>). */
  readonly options: readonly SelectOption[] | readonly SelectOptionGroup[];
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly hideLabel?: boolean;
  readonly id?: string;
  readonly fieldClassName?: string | undefined;
}

/** A native select. It brings platform pickers on mobile and full keyboard support for free. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, options, hint, error, hideLabel = false, id, fieldClassName, className, ...selectProps },
  ref,
) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      className={fieldClassName}
      {...(id ? { id } : {})}
    >
      {(control) => (
        <select
          ref={ref}
          className={cx(styles.control, styles.select, className)}
          {...control}
          {...selectProps}
        >
          {options.map((item) =>
            'options' in item ? (
              <optgroup key={item.label} label={item.label}>
                {item.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ),
          )}
        </select>
      )}
    </Field>
  );
});
