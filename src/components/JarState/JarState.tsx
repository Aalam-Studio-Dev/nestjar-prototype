import {
  CircleDashed,
  Minus,
  Sprout,
  TrendingDown,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { JarState } from '@/domain/budget';
import { Badge, ProgressTrack, type BadgeTone, type TrackLayer } from '@/ui';

interface StateStyle {
  /** Every jar state has words, so colour and pattern are never the only signal. */
  readonly label: string;
  readonly tone: BadgeTone;
  readonly icon: LucideIcon;
}

export const JAR_STATES: Record<JarState, StateStyle> = {
  unplanned: { label: 'No plan', tone: 'neutral', icon: Minus },
  blueprint: { label: 'Not seeded yet', tone: 'neutral', icon: CircleDashed },
  seeding: { label: 'Seeded', tone: 'moss', icon: Sprout },
  spending: { label: 'Spending', tone: 'honey', icon: TrendingDown },
  overspent: { label: 'Overspent', tone: 'berry', icon: TriangleAlert },
};

export const jarStateLabel = (state: JarState): string => JAR_STATES[state].label;

/** The jar's state as a word, a tone and a shape. */
export function JarStateBadge({
  state,
  className,
}: {
  readonly state: JarState;
  readonly className?: string | undefined;
}) {
  const { label, tone, icon: Icon } = JAR_STATES[state];
  return (
    <Badge
      label={label}
      tone={tone}
      icon={<Icon size={12} strokeWidth={2.5} aria-hidden="true" />}
      className={className}
    />
  );
}

export interface JarProgressProps {
  readonly state: JarState;
  /** 0..1, from the jar summary. */
  readonly seededRatio: number;
  readonly spentRatio: number;
  readonly className?: string | undefined;
}

/**
 * The four-state track: hatched while nothing is seeded, moss for money in
 * the jar, honey over it for money spent, berry once spending passes seeding.
 * Decorative, because the figures beside it are the source of truth.
 */
export function JarProgress({ state, seededRatio, spentRatio, className }: JarProgressProps) {
  const layers: TrackLayer[] = [
    { ratio: seededRatio, tone: 'moss' },
    { ratio: spentRatio, tone: state === 'overspent' ? 'berry' : 'honey' },
  ];
  const empty = state === 'unplanned' || state === 'blueprint';
  return (
    <ProgressTrack
      layers={empty ? [] : layers}
      pattern={empty ? 'hatched' : 'solid'}
      className={className}
    />
  );
}
