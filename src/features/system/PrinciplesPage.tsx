import { ArrowRight } from 'lucide-react';
import { Button, Card } from '@/ui';
import { PRINCIPLES } from './principles';
import { SystemHeader } from './SystemLayout';
import styles from './System.module.css';

export function PrinciplesPage() {
  return (
    <div className={styles.page}>
      <SystemHeader
        title="Design Principles"
        description="Six ideas behind every decision in nestjar, and where you can see each one in this prototype."
      />

      <ol className={styles.principles}>
        {PRINCIPLES.map((principle, index) => (
          <li key={principle.id}>
            <Card
              as="article"
              className={styles.principle}
              aria-labelledby={`principle-${principle.id}`}
            >
              <span className={styles.principleNumber} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 id={`principle-${principle.id}`} className={styles.principleTitle}>
                {principle.title}
              </h2>
              <p>{principle.summary}</p>
              <p className={styles.note}>{principle.why}</p>
              <div className={styles.principleProof}>
                <h3 className={styles.principleLabel}>In this prototype</h3>
                <ul className={styles.principleList}>
                  {principle.inPrototype.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Card variant="highlight" className={styles.next}>
        <p>See how these principles shape every colour, pattern and interaction.</p>
        <Button
          href="/system/design-system"
          label="Continue to the Design System"
          icon={<ArrowRight size={18} aria-hidden="true" />}
          iconPosition="end"
        />
      </Card>
    </div>
  );
}
