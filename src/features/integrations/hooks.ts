import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as integrationsApi from './api';
import type { ConnectionPayload } from './api';

function useStaff() {
  const role = useTenantStore((s) => s.activeTenant?.role);
  return role === 'owner' || role === 'admin';
}

export function useConnections() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const isStaff = useStaff();
  return useQuery({
    queryKey: ['integrations', 'connections', tenantId],
    queryFn: integrationsApi.getConnections,
    enabled: isStaff,
  });
}

function useInvalidateConnections() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['integrations', 'connections'] });
}

export function useCreateConnection() {
  const invalidate = useInvalidateConnections();
  return useMutation({
    mutationFn: (payload: ConnectionPayload) => integrationsApi.createConnection(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateConnection() {
  const invalidate = useInvalidateConnections();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<ConnectionPayload>) =>
      integrationsApi.updateConnection(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteConnection() {
  const invalidate = useInvalidateConnections();
  return useMutation({
    mutationFn: (id: string) => integrationsApi.deleteConnection(id),
    onSuccess: invalidate,
  });
}

export function useNotifications(page = 1) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const isStaff = useStaff();
  return useQuery({
    queryKey: ['integrations', 'notifications', tenantId, page],
    queryFn: () => integrationsApi.getNotifications(page),
    enabled: isStaff,
    placeholderData: (prev) => prev,
  });
}
