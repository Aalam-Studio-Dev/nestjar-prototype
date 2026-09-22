import { Lightbulb } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import styles from './DemoGuide.module.css';

const STORAGE_KEY = 'nestjar.demo-tips';

interface DemoGuideValue {
  readonly tipsOn: boolean;
  readonly setTipsOn: (on: boolean) => void;
}

const DemoGuideContext = createContext<DemoGuideValue | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/**
 * Presenter aid. Tips point at the next step of the happy path so the
 * prototype can be walked without a script. They can be hidden from the
 * demo menu for a clean screen share.
 */
export function DemoGuideProvider({ children }: { readonly children: ReactNode }) {
  const [tipsOn, setState] = useState(readStored);
  const setTipsOn = useCallback((on: boolean) => {
    setState(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      // Preference applies for this visit only.
    }
  }, []);
  const value = useMemo(() => ({ tipsOn, setTipsOn }), [tipsOn, setTipsOn]);
  return <DemoGuideContext.Provider value={value}>{children}</DemoGuideContext.Provider>;
}

export function useDemoGuide(): DemoGuideValue {
  const value = useContext(DemoGuideContext);
  if (!value) throw new Error('useDemoGuide must be used inside <DemoGuideProvider>');
  return value;
}

/** A single, quiet hint about what to try next. Not a live region: it is read in page order. */
export function DemoTip({ children }: { readonly children: ReactNode }) {
  const { tipsOn } = useDemoGuide();
  if (!tipsOn) return null;
  return (
    <aside className={styles.tip} aria-label="Demo tip">
      <Lightbulb size={18} aria-hidden="true" className={styles.icon} />
      <p>{children}</p>
    </aside>
  );
}
