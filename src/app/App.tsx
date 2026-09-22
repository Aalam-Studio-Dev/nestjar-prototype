import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DisplayCurrencyProvider } from '@/data/displayCurrency';
import { ServicesProvider } from '@/data/ServicesProvider';
import { DemoGuideProvider } from '@/features/demo/DemoGuide';
import type { Services } from '@/services';
import { ToastProvider } from '@/ui';
import { routes } from './routes';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}

/**
 * Provider order, outside in: data access, cache, per-viewer preferences,
 * then UI services. Everything here is injectable so tests can render the
 * real app against a zero-latency mock.
 */
export function App({ services }: { readonly services: Services }) {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(() => createBrowserRouter(routes));

  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={queryClient}>
        <DisplayCurrencyProvider>
          <DemoGuideProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </DemoGuideProvider>
        </DisplayCurrencyProvider>
      </QueryClientProvider>
    </ServicesProvider>
  );
}
