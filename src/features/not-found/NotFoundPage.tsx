import { Button, PageHeading } from '@/ui';
import { OnboardingLayout } from '../onboarding/OnboardingLayout';

export function NotFoundPage() {
  return (
    <OnboardingLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          alignItems: 'flex-start',
        }}
      >
        <PageHeading
          documentTitle="Page not found"
          description="That link does not lead anywhere in this prototype."
        >
          This jar is empty
        </PageHeading>
        <Button href="/" label="Go to nestjar" />
      </div>
    </OnboardingLayout>
  );
}
