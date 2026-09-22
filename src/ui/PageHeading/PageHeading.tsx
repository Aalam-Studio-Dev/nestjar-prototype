import { useEffect, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './PageHeading.module.css';

export interface PageHeadingProps {
  readonly children: ReactNode;
  /** Short line above the title, e.g. the budget name. */
  readonly eyebrow?: ReactNode;
  readonly description?: ReactNode;
  /** Controls aligned with the heading on wide screens. */
  readonly actions?: ReactNode;
  /** Sets document.title as "<title> · nestjar". */
  readonly documentTitle: string;
  readonly size?: 'page' | 'hero';
  readonly className?: string | undefined;
}

/**
 * Every page has exactly one. The <h1> is the programmatic focus target after
 * client-side navigation (see app/RouteFocus.tsx), so screen reader users hear
 * the new page's name the way they would on a full page load.
 */
export function PageHeading({
  children,
  eyebrow,
  description,
  actions,
  documentTitle,
  size = 'page',
  className,
}: PageHeadingProps) {
  useEffect(() => {
    document.title = `${documentTitle} · nestjar`;
  }, [documentTitle]);

  return (
    <header className={cx(styles.header, className)}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1
          className={cx(styles.title, size === 'hero' && styles.hero)}
          tabIndex={-1}
          data-page-heading
        >
          {children}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
