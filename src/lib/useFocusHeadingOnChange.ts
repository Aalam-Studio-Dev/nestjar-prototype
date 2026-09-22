import { useEffect, useRef } from 'react';

/**
 * When a screen swaps its content without a route change (a step within one
 * URL), move focus to the new heading so the change is announced.
 */
export function useFocusHeadingOnChange(value: unknown): void {
  const previous = useRef(value);
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    document.querySelector<HTMLElement>('[data-page-heading]')?.focus();
  }, [value]);
}
