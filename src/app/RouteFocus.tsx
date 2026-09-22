import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Client-side navigation does not move focus or announce anything by default.
 * After every route change (but not the first load) this moves focus to the
 * new page's <h1>, which screen readers announce, and resets scroll.
 *
 * Pages render their heading only once data is ready, so this retries for a
 * short window rather than focusing a loading spinner.
 */
export function RouteFocus() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });

    let attempts = 0;
    let frame = 0;
    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>('[data-page-heading]');
      if (heading) {
        heading.focus({ preventScroll: true });
        return;
      }
      if (attempts++ < 60) frame = window.requestAnimationFrame(focusHeading);
      else document.getElementById('main')?.focus({ preventScroll: true });
    };
    frame = window.requestAnimationFrame(focusHeading);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
