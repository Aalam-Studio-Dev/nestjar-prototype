import { createContext, useContext, type ReactNode } from 'react';
import type { Services } from '@/services';

const ServicesContext = createContext<Services | null>(null);

/**
 * Dependency injection for the data layer. The app root passes the adapter
 * chosen in src/services/index.ts; tests pass a mock built with zero latency.
 */
export function ServicesProvider({
  services,
  children,
}: {
  readonly services: Services;
  readonly children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
