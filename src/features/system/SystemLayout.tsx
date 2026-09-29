import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button, PageHeading } from '@/ui';
import { OnboardingLayout } from '../onboarding/OnboardingLayout';
import { PRINCIPLES, type PrincipleId } from './principles';
import styles from './System.module.css';

const SECTIONS = [
  { href: '/system', label: 'Design Principles' },
  { href: '/system/design-system', label: 'Design System' },
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
  principles,
  level = 2,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly intro?: ReactNode;
  /** The principles this part of the system puts into practice. */
  readonly principles?: readonly PrincipleId[];
  /** 3 when the block sits inside a Part. */
  readonly level?: 2 | 3;
  readonly children: ReactNode;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section className={styles.specimen} aria-labelledby={id}>
      <div className={styles.specimenHead}>
        <Heading id={id} className={styles.specimenTitle}>
          {title}
        </Heading>
        {intro && <p className={styles.specimenIntro}>{intro}</p>}
        {principles && <PrinciplesApplied ids={principles} />}
      </div>
      {children}
    </section>
  );
}

function PrinciplesApplied({ ids }: { readonly ids: readonly PrincipleId[] }) {
  const names = ids.map((id) => PRINCIPLES.find((principle) => principle.id === id)?.title ?? id);
  return (
    <p className={styles.principlesApplied}>
      <span>{ids.length === 1 ? 'Principle Applied:' : 'Principles Applied:'}</span>{' '}
      {names.join(', ')}
    </p>
  );
}

/** A chapter of the Design System page, grouping related blocks under one idea. */
export function Part({
  id,
  title,
  intro,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly intro: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className={styles.part} aria-labelledby={id}>
      <div className={styles.partHead}>
        <h2 id={id} className={styles.partTitle}>
          {title}
        </h2>
        <p className={styles.partIntro}>{intro}</p>
      </div>
      {children}
    </section>
  );
}
