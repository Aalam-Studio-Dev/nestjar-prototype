import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import styles from './Sheet.module.css';

export interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  /** Sticky action area at the bottom of the sheet. */
  readonly footer?: ReactNode;
  /** Element to focus when the sheet opens. Defaults to the first focusable control. */
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * A modal sheet built on the native <dialog> element.
 *
 * showModal() gives us, for free and correctly: a focus trap, inert page
 * content behind it, Escape to close, and the dialog role. On small screens
 * it docks to the bottom as a sheet; on wider screens it centres.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
}: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      const target =
        initialFocusRef?.current ??
        dialog.querySelector<HTMLElement>(
          '[data-autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        );
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  // Return focus to whatever opened the sheet, wherever it closes from.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target?.isConnected) {
        target.focus();
        return;
      }
      // The trigger can disappear while the sheet is open (the action it
      // offered is done). Land somewhere meaningful instead of <body>.
      const fallback =
        document.querySelector<HTMLElement>('[data-focus-fallback]') ??
        document.querySelector<HTMLElement>('[data-page-heading]');
      fallback?.focus();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  return (
    // Escape is handled natively by <dialog>; the click handler only adds
    // pointer dismissal on the backdrop, so there is no keyboard gap.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Keep React in charge of `open`; Escape asks the owner to close.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <div className={styles.grabber} aria-hidden="true" />
            <div className={styles.headings}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
