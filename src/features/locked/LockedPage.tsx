import { ArrowLeft, Lock } from 'lucide-react';
import { Button, Card, PageHeading } from '@/ui';
import styles from './LockedPage.module.css';

export interface LockedPageProps {
  readonly title: string;
  /** What this area does in the full product. */
  readonly summary: string;
}

/**
 * A deliberate dead end. Paths outside the demo are visible in navigation,
 * so the product feels whole, and each explains itself instead of failing.
 */
export function LockedPage({ title, summary }: LockedPageProps) {
  return (
    <div className={styles.page}>
      <PageHeading documentTitle={title}>{title}</PageHeading>
      <Card className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          <Lock size={22} />
        </span>
        <h2 className={styles.title}>Not part of this demo</h2>
        <p className={styles.body}>{summary}</p>
        <p className={styles.body}>
          This prototype follows one story: planning a month and giving every pound a job.
        </p>
        <Button
          href="/budget"
          variant="secondary"
          label="Back to budget"
          icon={<ArrowLeft size={18} aria-hidden="true" />}
        />
      </Card>
    </div>
  );
}
