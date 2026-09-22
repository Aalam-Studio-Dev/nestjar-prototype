import { useId, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Field.module.css';

export interface FieldControlProps {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
}

export interface FieldProps {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  /** Visually hides the label while keeping it as the accessible name. */
  readonly hideLabel?: boolean;
  readonly id?: string;
  readonly className?: string | undefined;
  readonly children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label, hint and error wiring shared by every form control. The control is
 * rendered through a render prop so each input gets the right id,
 * aria-describedby and aria-invalid without repeating the plumbing.
 */
export function Field({ label, hint, error, hideLabel, id, className, children }: FieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={controlId} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      {children({
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error}>
          <span aria-hidden="true" className={styles.errorMark}>
            !
          </span>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
