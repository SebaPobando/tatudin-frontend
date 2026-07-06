import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as teamApi from './api';

export function useTeam() {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const isStaff = activeTenant?.role === 'owner' || activeTenant?.role === 'admin';
  return useQuery({
    queryKey: ['team', activeTenant?.id],
    queryFn: teamApi.getTeam,
    enabled: isStaff,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      role: string;
      valid_from?: string;
      valid_until?: string;
    }) => teamApi.inviteMember(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useRevokeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => teamApi.revokeMember(membershipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });
}
