import { BookOpen, FlaskConical, RotateCcw } from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResetDemo } from '@/data/budget';
import { cx } from '@/lib/cx';
import { Button, Sheet, useToast } from '@/ui';
import { useDemoGuide } from './DemoGuide';
import styles from './DemoMenu.module.css';

export function DemoMenu({ tone = 'light' }: { readonly tone?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { tipsOn, setTipsOn } = useDemoGuide();
  const reset = useResetDemo();
  const navigate = useNavigate();
  const toast = useToast();
  const tipsId = useId();

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  const restart = () => {
    reset.mutate(undefined, {
      onSuccess: () => {
        close();
        navigate('/welcome', { replace: true });
        toast.show({
          message: 'Demo restarted. Everything is back to the beginning.',
          tone: 'info',
        });
      },
    });
  };

  return (
    <>
      <button
        type="button"
        className={cx(styles.trigger, styles[tone])}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <FlaskConical size={18} aria-hidden="true" />
        <span>Demo</span>
      </button>
      <Sheet
        open={open}
        onClose={close}
        title="About this demo"
        description="nestjar is an interactive prototype. Your changes live in this browser tab only."
      >
        <div className={styles.content}>
          <div className={styles.row}>
            <div>
              <label htmlFor={tipsId} className={styles.rowTitle}>
                Show demo tips
              </label>
              <p className={styles.rowHint}>Hints about what to try next on each screen.</p>
            </div>
            <input
              id={tipsId}
              type="checkbox"
              role="switch"
              className={styles.switch}
              checked={tipsOn}
              onChange={(event) => setTipsOn(event.target.checked)}
              data-autofocus
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.rowTitle}>How it is built</h3>
            <p className={styles.rowHint}>
              The design system, and the decisions behind this prototype.
            </p>
            <Button
              href="/system"
              variant="secondary"
              label="Open design notes"
              icon={<BookOpen size={16} aria-hidden="true" />}
              onClick={close}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.rowTitle}>Start over</h3>
            {confirming ? (
              <>
                <p className={styles.rowHint} id={`${tipsId}-confirm`}>
                  This clears the budget, the plan and any spending, and returns to the welcome
                  screen.
                </p>
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    onClick={restart}
                    loading={reset.isPending}
                    loadingLabel="Restarting"
                    aria-describedby={`${tipsId}-confirm`}
                    label="Yes, restart the demo"
                  />
                  <Button variant="ghost" onClick={() => setConfirming(false)} label="Keep going" />
                </div>
              </>
            ) : (
              <>
                <p className={styles.rowHint}>Walk the story again from the welcome screen.</p>
                <Button
                  variant="secondary"
                  label="Restart demo"
                  icon={<RotateCcw size={16} aria-hidden="true" />}
                  onClick={() => setConfirming(true)}
                />
              </>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
}
