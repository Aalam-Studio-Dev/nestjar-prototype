import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button, PageHeading } from '@/ui';
import { OnboardingLayout } from '../onboarding/OnboardingLayout';
import styles from './System.module.css';

const SECTIONS = [
  { href: '/system', label: 'Design system' },
  { href: '/system/notes', label: 'Prototype notes' },
] as const;

/**
 * Design notes before the month starts: beside the story, not inside it,
 * with one way back to wherever you were. Once the month is running they
 * open inside the app shell instead (see app/DesignNotesShell.tsx).
 */
export function SystemLayout() {
  return (
    <OnboardingLayout
      wide
      barAction={
        <Button
          href="/"
          variant="ghost"
          size="sm"
          label="Back to the story"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
        />
      }
    >
      <Outlet />
    </OnboardingLayout>
  );
}

/** The heading and section switcher shared by both Design notes pages. */
export function SystemHeader({
  title,
  description,
}: {
  readonly title: string;
  readonly description: ReactNode;
}) {
  const { pathname } = useLocation();
  return (
    <>
      <PageHeading documentTitle={title} eyebrow="Design notes" description={description}>
        {title}
      </PageHeading>
      <nav aria-label="Design notes sections" className={styles.sectionNav}>
        <ul>
          {SECTIONS.map((section) => {
            const current = pathname === section.href;
            return (
              <li key={section.href}>
                <Button
                  href={section.href}
                  variant={current ? 'secondary' : 'ghost'}
                  size="sm"
                  label={section.label}
                  aria-current={current ? 'page' : undefined}
                />
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** One titled block of the Design notes pages. */
export function Specimen({
  id,
  title,
  intro,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly intro?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className={styles.specimen} aria-labelledby={id}>
      <div className={styles.specimenHead}>
        <h2 id={id} className={styles.specimenTitle}>
          {title}
        </h2>
        {intro && <p className={styles.specimenIntro}>{intro}</p>}
      </div>
      {children}
    </section>
  );
}
