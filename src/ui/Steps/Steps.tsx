import { Check } from 'lucide-react';
import { cx } from '@/lib/cx';
import styles from './Steps.module.css';

export interface StepsProps {
  readonly label: string;
  readonly steps: readonly string[];
  /** Zero-based index of the current step. */
  readonly current: number;
}

/**
 * A progress indicator for multi-step flows. It is a list, not a set of
 * controls: steps are reached with the flow's own Back and Continue buttons,
 * so Tab order stays short. aria-current marks where the person is.
 */
export function Steps({ label, steps, current }: StepsProps) {
  return (
    <nav aria-label={label} className={styles.nav}>
      <p className={styles.caption}>
        Step {current + 1} of {steps.length}
        <span className="visually-hidden">: {steps[current]}</span>
      </p>
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo';
          return (
            <li
              key={step}
              className={cx(styles.step, styles[state])}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className={styles.marker} aria-hidden="true">
                {state === 'done' ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <span className={styles.name}>
                {step}
                {state === 'done' && <span className="visually-hidden"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
