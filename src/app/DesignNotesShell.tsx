import { SystemLayout } from '@/features/system/SystemLayout';
import { AppShell } from './AppShell/AppShell';
import { useJourney } from './journey';

/**
 * Design notes are a panel of the app once the month has started, so they
 * keep its navigation. Before that there is no app to return to, so they
 * open on their own with a way back to the story.
 */
export function DesignNotesShell() {
  const journey = useJourney();
  if (journey.status === 'ready' && journey.stage === 'budget') return <AppShell />;
  return <SystemLayout />;
}
