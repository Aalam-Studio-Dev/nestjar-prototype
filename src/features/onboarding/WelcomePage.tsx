import { ArrowRight, Globe2, HeartHandshake, Sprout } from 'lucide-react';
import { JarGauge } from '@/components/JarGauge/JarGauge';
import { useViewer } from '@/data/budget';
import { Button, PageHeading } from '@/ui';
import { OnboardingLayout } from './OnboardingLayout';
import styles from './Onboarding.module.css';

const POINTS = [
  {
    icon: HeartHandshake,
    title: 'Plan the month together',
    body: 'One shared budget, two people, and a plan you both agreed to before the month begins.',
  },
  {
    icon: Globe2,
    title: 'Two currencies, one budget',
    body: 'Earn in dollars, spend in pounds. Conversions always lean cautious, so exchange rates never surprise you.',
  },
  {
    icon: Sprout,
    title: 'Every pound gets a job',
    body: 'Income fills the central jar. You pour it into jars for rent, groceries and goals until it is empty.',
  },
] as const;

export function WelcomePage() {
  const viewer = useViewer().data;

  return (
    <OnboardingLayout wide>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <PageHeading documentTitle="Welcome" eyebrow="Budgeting for couples" size="hero">
            Every pound, dollar and euro, in its own jar.
          </PageHeading>
          <p className={styles.lede}>
            nestjar is zero-based budgeting for couples who earn, save and spend across currencies.
          </p>
          <Button
            href="/setup"
            size="lg"
            className={styles.heroCta}
            label="Start the demo"
            icon={<ArrowRight size={18} aria-hidden="true" />}
            iconPosition="end"
          />
          {viewer && (
            <p className={styles.signedIn}>
              You are signed in as <strong>{viewer.displayName}</strong>, a demo account. Nothing
              you enter leaves this browser.
            </p>
          )}
        </div>
        <div className={styles.heroArt}>
          <JarGauge level={0.72} size="lg" label="Illustration: a jar, mostly full of honey" />
        </div>
      </div>

      <section aria-labelledby="how-it-works" className={styles.points}>
        <h2 id="how-it-works" className="visually-hidden">
          How nestjar works
        </h2>
        <ul className={styles.pointList}>
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className={styles.point}>
              <span className={styles.pointIcon} aria-hidden="true">
                <Icon size={20} />
              </span>
              <h3 className={styles.pointTitle}>{title}</h3>
              <p className={styles.pointBody}>{body}</p>
            </li>
          ))}
        </ul>
      </section>
    </OnboardingLayout>
  );
}
