import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo/Logo';
import { useCurrentBudget } from '@/data/budget';
import { DemoMenu } from '@/features/demo/DemoMenu';
import { NavItem } from '@/ui';
import { NAV_ITEMS, type NavDestination } from '../navigation';
import styles from './AppShell.module.css';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function NavEntry({
  item,
  orientation,
}: {
  readonly item: NavDestination;
  readonly orientation: 'side' | 'tab';
}) {
  return (
    <li>
      <NavItem
        href={item.to}
        label={orientation === 'tab' ? (item.shortLabel ?? item.label) : item.label}
        icon={item.icon}
        orientation={orientation}
        locked={item.locked}
      />
    </li>
  );
}

/**
 * Chrome for the signed-in app. Mobile gets a top bar and a bottom tab bar;
 * from 64rem the same links move into a side navigation. There is one <nav>
 * landmark per layout, and only one layout is ever rendered visible.
 */
export function AppShell() {
  const budget = useCurrentBudget().data;

  return (
    <div className={styles.shell} data-app-shell>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>

      <header className={styles.topBar}>
        <Logo size={26} />
        <DemoMenu tone="light" />
      </header>

      <aside className={styles.side}>
        <div className={styles.sideBrand}>
          <Logo size={30} tone="light" />
        </div>
        {budget && (
          <div className={styles.budgetPill}>
            <span className={styles.budgetPillLabel}>Budget</span>
            <span className={styles.budgetPillName}>{budget.name}</span>
            <ul className={styles.members} aria-label="Members">
              {budget.members.map((member) => (
                <li key={member.id} className={styles.avatar} title={member.displayName}>
                  <span aria-hidden="true">{initials(member.displayName)}</span>
                  <span className="visually-hidden">{member.displayName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <nav aria-label="Main" className={styles.sideNav}>
          <ul className={styles.sideList}>
            {NAV_ITEMS.map((item) => (
              <NavEntry key={item.to} item={item} orientation="side" />
            ))}
          </ul>
        </nav>
        <div className={styles.sideFooter}>
          <DemoMenu tone="dark" />
        </div>
      </aside>

      <main id="main" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <nav aria-label="Main" className={styles.tabBar}>
        <ul className={styles.tabList}>
          {NAV_ITEMS.map((item) => (
            <NavEntry key={item.to} item={item} orientation="tab" />
          ))}
        </ul>
      </nav>
    </div>
  );
}
