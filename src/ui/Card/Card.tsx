import type { HTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'sunken' | 'highlight';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: 'section' | 'div' | 'article';
  /**
   * default: warm ivory, the brand card. sunken: parchment, for grouping
   * inside a page. highlight: a honey glow, for the one thing that matters most.
   */
  readonly variant?: CardVariant;
  readonly padding?: 'default' | 'dense';
}

/** The brand guide's card: a hairline clay border, 16px radius, no shadow. */
export function Card({
  as: Tag = 'section',
  variant = 'default',
  padding = 'default',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cx(styles.card, styles[variant], padding === 'dense' && styles.dense, className)}
      {...rest}
    />
  );
}
