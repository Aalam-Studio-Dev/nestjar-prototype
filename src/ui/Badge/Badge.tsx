import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'moss' | 'honey' | 'berry';

export interface BadgeProps {
  readonly label: string;
  readonly tone?: BadgeTone;
  /** An optional shape cue, so the state never rests on colour alone. */
  readonly icon?: ReactNode;
  readonly className?: string | undefined;
}

/** A short status word. Text, not decoration: it is always read out. */
export function Badge({ label, tone = 'neutral', icon, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {icon}
      {label}
    </span>
  );
}
