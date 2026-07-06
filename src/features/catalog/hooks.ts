import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as catalogApi from './api';
import type { ServicePayload } from './api';

export function useServices() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({ queryKey: ['services', tenantId], queryFn: catalogApi.getServices });
}

function useInvalidateServices() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['services'] });
}

export function useCreateService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: (payload: ServicePayload) => catalogApi.createService(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Partial<ServicePayload> & { is_active?: boolean }) =>
      catalogApi.updateService(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteService(id),
    onSuccess: invalidate,
  });
}
