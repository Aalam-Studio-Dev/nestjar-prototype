import { useId } from 'react';
import rimSrc from '@/assets/nestjar-rim.png';
import { cx } from '@/lib/cx';
import styles from './JarGauge.module.css';

export type JarGaugeSize = 'sm' | 'md' | 'lg';

/** Rendered widths. Height follows the jar's 100:140 proportions. */
const WIDTHS: Record<JarGaugeSize, number> = { sm: 44, md: 112, lg: 150 };

export interface JarGaugeProps {
  /** 0..1, how full the jar is. */
  readonly level: number;
  /** Accessible description of what the level means, e.g. "£58 of £5,758 left to seed". */
  readonly label: string;
  /** sm for a shelf of many jars, md for the central jar, lg for illustration. */
  readonly size?: JarGaugeSize;
  readonly className?: string | undefined;
}

/*
 * Geometry, in a 100 x 140 viewBox, traced from the Woven-Rim Mason mark.
 * The woven rim is the brand raster; the SVG body starts at the rope's
 * measured neck width (17.2 to 82.8) so raster and vector join cleanly.
 * Every curve leaves and meets a straight edge on the same tangent, so the
 * outline has no corners, only the soft shoulders and base of the mark.
 */
const NECK_L = 17.2;
const NECK_R = 100 - NECK_L;
const NECK_Y = 31;
const BODY_L = 7.2;
const BODY_R = 100 - BODY_L;
const BODY_TOP = 52;
const BODY_BOTTOM = 139;
const BASE_RISE = 22;
const BASE_RUN = 20;

const JAR_PATH = [
  `M${NECK_L} ${NECK_Y}`,
  `C${NECK_L} ${NECK_Y + 9} ${BODY_L} ${BODY_TOP - 11} ${BODY_L} ${BODY_TOP}`,
  `L${BODY_L} ${BODY_BOTTOM - BASE_RISE}`,
  `C${BODY_L} ${BODY_BOTTOM - 7} ${BODY_L + 6} ${BODY_BOTTOM} ${BODY_L + BASE_RUN} ${BODY_BOTTOM}`,
  `L${BODY_R - BASE_RUN} ${BODY_BOTTOM}`,
  `C${BODY_R - 6} ${BODY_BOTTOM} ${BODY_R} ${BODY_BOTTOM - 7} ${BODY_R} ${BODY_BOTTOM - BASE_RISE}`,
  `L${BODY_R} ${BODY_TOP}`,
  `C${BODY_R} ${BODY_TOP - 11} ${NECK_R} ${NECK_Y + 9} ${NECK_R} ${NECK_Y}Z`,
].join('');

/*
 * The honey surface, drawn with y=0 as its resting line so it can be
 * translated. Like the mark it dips on the left and rises gently to the
 * right; S segments keep the tangent continuous, so there is no kink.
 */
const LIQUID_PATH = 'M-2 0C10 3 22 4.5 34 3.5S58 -3 72 -3.2S92 -2 102 -2L102 150L-2 150Z';

/* The glint on the glass: a curve off the shoulder, a long run, a short dash. */
const SHEEN_PATH = 'M23 42C18 44.5 15.6 48 15.6 53L15.6 77M15.6 82.5L15.6 88';

/**
 * The signature visual: a jar that drains as money is seeded out into
 * category jars. The level animates with a transform, which respects reduced
 * motion through the duration tokens.
 */
export function JarGauge({ level, label, size = 'md', className }: JarGaugeProps) {
  const clipId = `jar-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const width = WIDTHS[size];
  const clamped = Math.min(1, Math.max(0, level));
  // A nearly empty jar still shows a visible film of honey, so "a little left"
  // never reads as "nothing left".
  const visible = clamped > 0 ? Math.max(clamped, 0.1) : 0;
  const liquidTop = BODY_TOP + (1 - visible) * (BODY_BOTTOM - BODY_TOP);

  return (
    <div
      className={cx(styles.jar, className)}
      style={{ width, height: (width * 140) / 100 }}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 100 140" className={styles.svg} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId}>
            <path d={JAR_PATH} />
          </clipPath>
        </defs>
        <path d={JAR_PATH} className={styles.glass} />
        <g clipPath={`url(#${clipId})`}>
          <g
            className={styles.liquid}
            style={{
              transform: `translateY(${clamped > 0 ? liquidTop : BODY_BOTTOM + 8}px)`,
            }}
          >
            <path d={LIQUID_PATH} />
          </g>
        </g>
        {/* A band of glass between wall and honey, as in the mark. */}
        <path d={JAR_PATH} className={styles.gap} clipPath={`url(#${clipId})`} />
        <path d={JAR_PATH} className={styles.outline} />
        {size !== 'sm' && <path d={SHEEN_PATH} className={styles.sheen} />}
      </svg>
      <img src={rimSrc} alt="" className={styles.rim} draggable={false} />
    </div>
  );
}
