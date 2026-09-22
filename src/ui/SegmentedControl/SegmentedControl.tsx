import { useId } from 'react';
import { cx } from '@/lib/cx';
import styles from './SegmentedControl.module.css';

export interface Segment<T extends string> {
  readonly value: T;
  readonly label: string;
  /** Optional longer name for assistive tech, e.g. "British pound" for "GBP". */
  readonly accessibleLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly legend: string;
  readonly hideLegend?: boolean;
  readonly segments: readonly Segment<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly size?: 'sm' | 'md';
  readonly className?: string | undefined;
}

/**
 * A single-choice toggle built on native radio inputs inside a fieldset. The
 * browser supplies the keyboard model: Tab enters the group, arrow keys move
 * and select, and screen readers announce "1 of 2" positions.
 */
export function SegmentedControl<T extends string>({
  legend,
  hideLegend = false,
  segments,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={cx(styles.fieldset, className)}>
      <legend className={cx(styles.legend, hideLegend && 'visually-hidden')}>{legend}</legend>
      <div className={cx(styles.track, styles[size])}>
        {segments.map((segment) => {
          const id = `${name}-${segment.value}`;
          return (
            <div key={segment.value} className={styles.segment}>
              <input
                id={id}
                className={styles.input}
                type="radio"
                name={name}
                value={segment.value}
                checked={segment.value === value}
                onChange={() => onChange(segment.value)}
                {...(segment.accessibleLabel ? { 'aria-label': segment.accessibleLabel } : {})}
              />
              <label htmlFor={id} className={styles.label}>
                {segment.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
