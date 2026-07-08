import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as eventsApi from './api';
import type { AssignArtistPayload, EventPayload } from './api';

// ── Eventos ──────────────────────────────────────────────────────

function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['events'] });
}

export function useEvents() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['events', 'list', tenantId],
    queryFn: eventsApi.getEvents,
  });
}

export function useEvent(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['events', 'detail', id, tenantId],
    queryFn: () => eventsApi.getEvent(id),
  });
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (payload: EventPayload) => eventsApi.createEvent(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: invalidate,
  });
}

// ── Artistas del evento ──────────────────────────────────────────

export function useEventArtists(eventId: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['events', 'artists', eventId, tenantId],
    queryFn: () => eventsApi.getEventArtists(eventId),
  });
}

export function useAssignArtist(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignArtistPayload) => eventsApi.assignArtist(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'artists', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] });
    },
  });
}

export function useRemoveArtist(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artistId: string) => eventsApi.removeArtist(eventId, artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'artists', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] });
    },
  });
}
