import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Field } from './Field';
import styles from './Field.module.css';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'children' | 'prefix'
> {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly hideLabel?: boolean;
  readonly id?: string;
  readonly fieldClassName?: string | undefined;
  /** Short decorative text inside the start of the box, such as a symbol. */
  readonly prefix?: string | undefined;
  /** Short decorative text inside the end of the box, such as a unit. */
  readonly suffix?: string | undefined;
  /** Uses the figures face with tabular digits, for amounts. */
  readonly numeric?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    hideLabel,
    id,
    fieldClassName,
    className,
    prefix,
    suffix,
    numeric = false,
    ...inputProps
  },
  ref,
) {
  const adorned = prefix !== undefined || suffix !== undefined;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel ?? false}
      className={fieldClassName}
      {...(id ? { id } : {})}
    >
      {(control) => {
        const input = (
          <input
            ref={ref}
            className={cx(
              styles.control,
              prefix !== undefined && styles.hasPrefix,
              suffix !== undefined && styles.hasSuffix,
              numeric && styles.numeric,
              className,
            )}
            {...control}
            {...inputProps}
          />
        );
        if (!adorned) return input;
        return (
          <div className={styles.adorned}>
            {prefix !== undefined && (
              <span className={styles.adornment} aria-hidden="true">
                {prefix}
              </span>
            )}
            {input}
            {suffix !== undefined && (
              <span className={styles.suffix} aria-hidden="true">
                {suffix}
              </span>
            )}
          </div>
        );
      }}
    </Field>
  );
});
