import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as clientsApi from './api';
import type { ClientPayload } from './api';

export function useClients(params: { search?: string; source?: string; page?: number }) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['clients', 'list', tenantId, params],
    queryFn: () => clientsApi.getClients(params),
    // mantiene la lista anterior visible mientras llega la nueva búsqueda
    placeholderData: (prev) => prev,
  });
}

export function useClient(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['clients', 'detail', id, tenantId],
    queryFn: () => clientsApi.getClient(id),
  });
}

function useInvalidateClients() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['clients'] });
}

export function useCreateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (payload: ClientPayload) => clientsApi.createClient(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateClient(id: string) {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (payload: Partial<ClientPayload>) => clientsApi.updateClient(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(id),
    onSuccess: invalidate,
  });
}
