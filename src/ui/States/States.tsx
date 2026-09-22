import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Spinner } from '../Spinner/Spinner';
import styles from './States.module.css';

/** Announced politely so screen reader users know something is happening. */
export function LoadingState({ label = 'Loading' }: { readonly label?: string }) {
  return (
    <div className={styles.state} role="status">
      <Spinner size={24} />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  children,
  onRetry,
}: {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly onRetry?: () => void;
}) {
  return (
    <div className={styles.state} role="alert">
      <AlertTriangle size={24} aria-hidden="true" className={styles.errorIcon} />
      <p className={styles.title}>{title}</p>
      {children && <p className={styles.body}>{children}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry} label="Try again" />}
    </div>
  );
}
