import { ArrowRight, PartyPopper, Sprout } from 'lucide-react';
import type { JarSummary, MonthSummary } from '@/domain/budget';
import type { FormatOptions, Minor } from '@/domain/money';
import { JarGauge } from '@/components/JarGauge/JarGauge';
import { Button } from '@/ui';
import styles from './Budget.module.css';

export interface CentralJarProps {
  readonly summary: MonthSummary;
  readonly monthName: string;
  /** "pound" or "dollar", from the base currency. */
  readonly unit: string;
  readonly format: (amount: Minor, options?: FormatOptions) => string;
  readonly seedAllPending: boolean;
  readonly onSeedAll: () => void;
  /** Opens the seed sheet for a jar, pre-filled with the remainder. */
  readonly onGiveHome: (jar: JarSummary) => void;
}

/**
 * The hero of the budget screen. It moves through three moments:
 * 1. Money waiting to be seeded to plan.
 * 2. Every jar is at plan, but some money still has no job.
 * 3. The central jar is empty. Every pound has a job.
 */
export function CentralJar({
  summary,
  monthName,
  unit,
  format,
  seedAllPending,
  onSeedAll,
  onGiveHome,
}: CentralJarProps) {
  const jars = summary.groups.flatMap((g) => g.jars);
  const shortfall = jars.reduce((sum, jar) => sum + jar.shortfall, 0);
  const toPlan = Math.min(shortfall, summary.readyToSeed);
  const goalJars = summary.groups.find((g) => g.group.name === 'Goals')?.jars ?? jars.slice(0, 3);
  const percentLeft = Math.round(summary.jarLevel * 100);

  const jarLabel = summary.isFullySeeded
    ? `The central jar is empty. Every ${unit} has been seeded into a jar.`
    : `The central jar is ${percentLeft}% full: ${format(summary.readyToSeed)} of ${format(summary.income)} still to seed.`;

  return (
    <section className={styles.central} aria-labelledby="central-jar-title">
      <JarGauge
        level={summary.jarLevel}
        size="md"
        label={jarLabel}
        className={styles.centralGauge}
      />

      <div className={styles.centralBody}>
        <h2
          id="central-jar-title"
          className={styles.centralLabel}
          tabIndex={-1}
          data-focus-fallback
        >
          {summary.isFullySeeded ? 'Central jar' : 'Ready to seed'}
        </h2>
        <p className={`figures ${styles.centralFigure}`}>{format(summary.readyToSeed)}</p>
        <p className={styles.centralCaption}>
          {summary.isFullySeeded
            ? `All ${format(summary.income)} of ${monthName}'s income has a job.`
            : `${percentLeft}% of ${format(summary.income)} still in the jar`}
        </p>
      </div>

      <div className={styles.centralActions}>
        {summary.isFullySeeded ? (
          <>
            <p className={styles.celebrate}>
              <PartyPopper size={18} aria-hidden="true" />
              {`Every ${unit} has a job.`}
            </p>
            <Button
              href="/budget/review"
              label={`See ${monthName} at a glance`}
              icon={<ArrowRight size={18} aria-hidden="true" />}
              iconPosition="end"
            />
          </>
        ) : toPlan > 0 ? (
          <Button
            onClick={onSeedAll}
            loading={seedAllPending}
            loadingLabel="Seeding jars"
            icon={<Sprout size={18} aria-hidden="true" />}
            label={
              <>
                Seed all to plan
                <span className={`figures ${styles.buttonFigure}`}>{format(toPlan)}</span>
              </>
            }
          />
        ) : (
          <div className={styles.remainder}>
            <p className={styles.remainderText}>
              Every jar is at plan, and {format(summary.readyToSeed)} still needs a job. Where
              should it go?
            </p>
            <ul className={styles.remainderChoices}>
              {goalJars.map((jar) => (
                <li key={jar.category.id}>
                  <button
                    type="button"
                    className={styles.quickPick}
                    onClick={() => onGiveHome(jar)}
                    aria-haspopup="dialog"
                  >
                    {jar.category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
