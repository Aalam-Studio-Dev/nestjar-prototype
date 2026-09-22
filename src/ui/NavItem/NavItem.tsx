import { Lock, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/cx';
import styles from './NavItem.module.css';

export interface NavItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** tab: icon over label, for the bottom bar. side: a row, for the side rail. */
  readonly orientation: 'tab' | 'side';
  /** Reachable, but leads somewhere that explains it is not available. */
  readonly locked?: boolean;
}

/**
 * One navigation link. The active item is marked by a pill, a heavier label
 * and aria-current, which NavLink sets. The pill has a fixed size in the tab
 * bar, so it looks the same on a phone and a tablet.
 */
export function NavItem({ href, label, icon: Icon, orientation, locked = false }: NavItemProps) {
  const tab = orientation === 'tab';
  return (
    <NavLink
      to={href}
      className={({ isActive }) => cx(styles.item, styles[orientation], isActive && styles.active)}
    >
      <span className={styles.pill}>
        <Icon size={tab ? 22 : 18} aria-hidden="true" />
        {locked && <Lock size={10} aria-hidden="true" className={styles.lock} />}
      </span>
      <span className={styles.label}>
        {label}
        {locked && <span className="visually-hidden"> (not in this demo)</span>}
      </span>
    </NavLink>
  );
}
