import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo/Logo';
import { cx } from '@/lib/cx';
import { Button } from '@/ui';
import styles from './Onboarding.module.css';

/**
 * Chrome for the pre-budget screens: a brand bar and one focused column.
 * The bar's action defaults to the Design notes, which sit beside the story
 * rather than in it, so a reviewer can reach them from any stage.
 */
export function OnboardingLayout({
  children,
  wide = false,
  barAction = (
    <Button
      href="/system"
      variant="ghost"
      size="sm"
      label="Design notes"
      icon={<BookOpen size={16} aria-hidden="true" />}
    />
  ),
}: {
  readonly children: ReactNode;
  readonly wide?: boolean;
  readonly barAction?: ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.bar}>
        <Logo size={26} />
        {barAction}
      </header>
      <main id="main" tabIndex={-1} className={cx(styles.main, wide && styles.wide)}>
        {children}
      </main>
    </div>
  );
}
