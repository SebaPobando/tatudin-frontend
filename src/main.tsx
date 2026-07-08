import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import './index.css';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { router } from '@/routes/router';

/**
 * staleTime 30s: evita refetches agresivos al cambiar de foco/ventana.
 * retry 1: los errores del backend (400/403) no se arreglan reintentando.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
