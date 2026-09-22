import markSrc from '@/assets/nestjar-mark.png';
import { cx } from '@/lib/cx';
import styles from './Logo.module.css';

export interface LogoProps {
  /** Height of the jar mark in pixels. */
  readonly size?: number;
  readonly tone?: 'dark' | 'light';
  readonly showWordmark?: boolean;
  readonly className?: string | undefined;
}

/** The Woven-Rim Mason mark with the Fraunces wordmark. */
export function Logo({ size = 28, tone = 'dark', showWordmark = true, className }: LogoProps) {
  return (
    <span className={cx(styles.logo, styles[tone], className)}>
      <img
        src={markSrc}
        alt={showWordmark ? '' : 'nestjar'}
        height={size}
        width={Math.round((size * 132) / 194)}
        className={styles.mark}
      />
      {showWordmark && (
        <span className={styles.wordmark} style={{ fontSize: size * 0.72 }}>
          nestjar
        </span>
      )}
    </span>
  );
}
