import { cx } from '@/lib/cx';
import styles from './ProgressTrack.module.css';

export type TrackTone = 'moss' | 'honey' | 'berry' | 'spruce';

export interface TrackLayer {
  /** 0..1 of the track's width. */
  readonly ratio: number;
  readonly tone: TrackTone;
}

export interface ProgressTrackProps {
  /** Fills drawn from the left, later layers on top of earlier ones. */
  readonly layers: readonly TrackLayer[];
  /**
   * hatched marks a track with nothing in it yet, as a shape rather than a
   * colour. It replaces a dashed border, which breaks up unevenly on
   * rounded ends and under zoom.
   */
  readonly pattern?: 'solid' | 'hatched';
  /**
   * Leave unset when the numbers are already written next to the track: the
   * bar is then decoration. Set it when the bar is the only carrier.
   */
  readonly label?: string | undefined;
  readonly className?: string | undefined;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function ProgressTrack({ layers, pattern = 'solid', label, className }: ProgressTrackProps) {
  return (
    <span
      className={cx(styles.track, pattern === 'hatched' && styles.hatched, className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {layers.map((layer, index) => (
        <span
          key={index}
          className={cx(styles.fill, styles[layer.tone])}
          style={{ width: `${clamp(layer.ratio) * 100}%` }}
        />
      ))}
    </span>
  );
}
