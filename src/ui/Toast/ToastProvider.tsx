import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cx } from '@/lib/cx';
import { Button } from '../Button/Button';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastInput {
  readonly message: string;
  readonly tone?: ToastTone;
  /**
   * Transient toasts (the default) close themselves after --toast-duration.
   * Persistent ones stay until the person closes them: use them for anything
   * that needs acting on or must not be missed. Both can always be closed.
   */
  readonly persistent?: boolean;
}

interface ToastItem extends Required<ToastInput> {
  readonly id: number;
}

interface ToastApi {
  readonly show: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const FALLBACK_DURATION_MS = 3000;
const MAX_TRANSIENT = 2;

function readDuration(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--toast-duration');
  const ms = Number.parseInt(raw, 10);
  return Number.isFinite(ms) && ms > 0 ? ms : FALLBACK_DURATION_MS;
}

/**
 * Transient confirmations and persistent notices. News goes to a polite live
 * region that is always mounted; errors announce themselves assertively.
 * Toasts never carry the only copy of important information: every change
 * they confirm is also visible on the page.
 */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    const item: ToastItem = {
      id: nextId.current++,
      tone: 'success',
      persistent: false,
      ...toast,
    };
    setToasts((current) => {
      // Only transient toasts are capped. A new confirmation must never push
      // a persistent notice off screen before it has been read.
      const transient = current.filter((t) => !t.persistent);
      const drop = new Set(
        transient.slice(0, Math.max(0, transient.length - (MAX_TRANSIENT - 1))).map((t) => t.id),
      );
      return [...current.filter((t) => !drop.has(t.id)), item];
    });
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const polite = toasts.filter((t) => t.tone !== 'error');
  const urgent = toasts.filter((t) => t.tone === 'error');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region}>
        {/* Each error carries role="alert" itself, so it is announced the moment
            it appears without an empty alert region waiting on the page. */}
        <div className={styles.stack}>
          {urgent.map((toast) => (
            <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
        <div className={styles.stack} role="status" aria-live="polite" aria-atomic="false">
          {polite.map((toast) => (
            <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
} as const;

function ToastView({
  toast,
  onDismiss,
}: {
  readonly toast: ToastItem;
  readonly onDismiss: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const [duration] = useState(readDuration);
  // Bumped on resume so the progress line restarts with the timer.
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { id, persistent } = toast;

  // Pausing restarts the full window, so a message is never cut short while
  // someone is reading it or has focus inside it (WCAG 2.2.1).
  useEffect(() => {
    if (persistent || paused) return;
    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timer);
  }, [persistent, paused, duration, onDismiss, id]);

  const pause = () => setPaused(true);
  const resume = () => {
    setPaused(false);
    setCycle((c) => c + 1);
  };

  const close = () => {
    // The close button is about to disappear with the toast. If it had focus,
    // move focus to the page heading rather than dropping it on <body>.
    if (ref.current?.contains(document.activeElement)) {
      document.querySelector<HTMLElement>('[data-page-heading]')?.focus();
    }
    onDismiss(id);
  };

  const Icon = ICONS[toast.tone];

  return (
    // Pointer and focus handlers only pause the timer; the toast itself is not
    // a control. Its one control is the close button inside it.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      className={cx(styles.toast, styles[toast.tone])}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocus={pause}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) resume();
      }}
    >
      <Icon size={20} aria-hidden="true" className={styles.icon} />
      <p className={styles.message} role={toast.tone === 'error' ? 'alert' : undefined}>
        {toast.message}
      </p>
      <Button
        variant="ghost"
        iconOnly
        label="Dismiss"
        icon={<X size={18} aria-hidden="true" />}
        className={styles.dismiss}
        onClick={close}
      />
      {!persistent && !paused && (
        <span
          key={cycle}
          className={styles.timer}
          style={{ animationDuration: `${duration}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}
