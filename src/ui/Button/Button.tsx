import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { Link } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { Spinner } from '../Spinner/Spinner';
import styles from './Button.module.css';

/**
 * Emphasis, from loudest to quietest. One primary per screen.
 * Disabled and loading are states any variant can be in, not variants.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppearanceProps {
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | undefined;
  readonly fullWidth?: boolean | undefined;
}

/**
 * What the button shows. An icon-only button still takes a label: it becomes
 * the accessible name and the tooltip, so the type system will not let an
 * unlabelled icon through.
 */
type ContentProps =
  | {
      readonly label: ReactNode;
      readonly icon?: ReactNode;
      readonly iconPosition?: 'start' | 'end' | undefined;
      readonly iconOnly?: false | undefined;
    }
  | {
      readonly label: string;
      readonly icon: ReactNode;
      readonly iconPosition?: undefined;
      readonly iconOnly: true;
    };

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'aria-label'
>;
type NativeAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'>;

/** Does something. The caller decides what, through onClick. */
type ActionProps = NativeButtonProps & {
  readonly href?: undefined;
  readonly type?: 'button' | 'submit' | 'reset';
  /**
   * Shows a spinner and swallows repeat presses. The button stays focusable
   * and announces as busy rather than becoming disabled, so focus is not lost.
   */
  readonly loading?: boolean | undefined;
  readonly loadingLabel?: string | undefined;
  readonly ref?: Ref<HTMLButtonElement>;
};

/** Goes somewhere. Renders a real link, so it can be opened in a new tab. */
type LinkProps = NativeAnchorProps & {
  readonly href: string;
  readonly replace?: boolean;
  readonly loading?: undefined;
  readonly loadingLabel?: undefined;
  readonly ref?: Ref<HTMLAnchorElement>;
};

export type ButtonProps = AppearanceProps & ContentProps & (ActionProps | LinkProps);

const isExternal = (href: string) => /^[a-z]+:/i.test(href);

/**
 * The one button. It holds no behaviour of its own: it renders what it is
 * given and reports presses through onClick. Pass href and it becomes a link.
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth,
    label,
    icon,
    iconPosition = 'start',
    iconOnly,
    className,
    loading = false,
    loadingLabel,
    ...rest
  } = props;
  // Hover and focus tooltips must be dismissible without moving the pointer
  // or focus (WCAG 1.4.13), so Escape anywhere hides it until the next visit.
  const [tipHidden, setTipHidden] = useState(false);
  useEffect(() => {
    if (!iconOnly) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setTipHidden(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [iconOnly]);

  const classes = cx(
    styles.button,
    styles[variant],
    styles[size],
    iconOnly && styles.iconOnly,
    fullWidth && styles.fullWidth,
    className,
  );

  const leading = loading ? <Spinner size={16} /> : iconPosition === 'start' ? icon : null;
  const trailing = !loading && iconPosition === 'end' ? icon : null;
  const text = loading && loadingLabel ? loadingLabel : label;

  const content = iconOnly ? (
    <>
      {loading ? <Spinner size={16} /> : icon}
      {!tipHidden && (
        <span className={styles.tooltip} aria-hidden="true">
          {label}
        </span>
      )}
    </>
  ) : (
    <>
      {leading}
      <span className={styles.label}>{text}</span>
      {trailing}
    </>
  );

  // Capture-phase handlers, so they never replace a caller's own handlers.
  const tipHandlers = iconOnly
    ? {
        onBlurCapture: () => setTipHidden(false),
        onPointerOutCapture: () => setTipHidden(false),
      }
    : {};

  const accessibleName = iconOnly ? label : undefined;

  if (rest.href !== undefined) {
    const { href, replace, ...anchor } = rest;
    if (isExternal(href)) {
      return (
        <a {...anchor} {...tipHandlers} href={href} className={classes} aria-label={accessibleName}>
          {content}
        </a>
      );
    }
    return (
      <Link
        {...anchor}
        {...tipHandlers}
        to={href}
        {...(replace ? { replace } : {})}
        className={classes}
        aria-label={accessibleName}
      >
        {content}
      </Link>
    );
  }

  const { type = 'button', onClick, ...button } = rest;
  return (
    <button
      {...button}
      {...tipHandlers}
      type={type}
      className={classes}
      aria-label={accessibleName}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {content}
    </button>
  );
}
