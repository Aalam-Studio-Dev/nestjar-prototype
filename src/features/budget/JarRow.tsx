import { ChevronRight } from 'lucide-react';
import { JarProgress, JarStateBadge, jarStateLabel } from '@/components/JarState/JarState';
import type { JarSummary } from '@/domain/budget';
import type { FormatOptions, Minor } from '@/domain/money';
import { cx } from '@/lib/cx';
import styles from './Budget.module.css';

export interface JarRowProps {
  readonly jar: JarSummary;
  readonly format: (amount: Minor, options?: FormatOptions) => string;
  readonly onOpen: (categoryId: string) => void;
}

/**
 * One category jar. The whole row is a single button so it is one tap target
 * and one Tab stop. Its accessible name reads as a sentence:
 * "Groceries, Spending. £455.80 left. Planned £520.00, seeded £520.00, spent £64.20."
 */
export function JarRow({ jar, format, onOpen }: JarRowProps) {
  const { category, planned, seeded, spent, remaining, state } = jar;
  // An explicit name reads as one clean sentence. It starts with the visible
  // jar name, so voice control ("click Groceries") still matches (WCAG 2.5.3).
  const accessibleName = `${category.name}, ${jarStateLabel(state)}. ${format(remaining)} left. Planned ${format(planned)}, seeded ${format(seeded)}, spent ${format(spent)}.`;

  return (
    <li>
      <button
        type="button"
        className={styles.jarRow}
        onClick={() => onOpen(category.id)}
        aria-haspopup="dialog"
        aria-label={accessibleName}
      >
        <span className={styles.jarTop}>
          <span className={styles.jarName}>{category.name}</span>
          <JarStateBadge state={state} className={styles.jarBadge} />
          <span className={cx(styles.jarRemaining, 'figures', remaining < 0 && styles.negative)}>
            {format(remaining)}
            <span className={styles.jarRemainingLabel}> left</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" className={styles.jarChevron} />
        </span>

        <span className={styles.jarFigures}>
          <span className={styles.jarFigure}>
            <span className={styles.jarFigureLabel}>Planned</span>{' '}
            <span className="figures">{format(planned)}</span>
          </span>
          <span className={styles.jarFigure}>
            <span className={styles.jarFigureLabel}>Seeded</span>{' '}
            <span className="figures">{format(seeded)}</span>
          </span>
          <span className={styles.jarFigure}>
            <span className={styles.jarFigureLabel}>Spent</span>{' '}
            <span className="figures">{format(spent)}</span>
          </span>
        </span>

        <JarProgress state={state} seededRatio={jar.seededRatio} spentRatio={jar.spentRatio} />
      </button>
    </li>
  );
}
