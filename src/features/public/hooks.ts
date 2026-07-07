import { useMutation, useQuery } from '@tanstack/react-query';
import * as publicApi from './api';
import type { PublicSubmitPayload } from './api';

export function usePublicForm(tenantSlug: string, formSlug: string) {
  return useQuery({
    queryKey: ['public', 'form', tenantSlug, formSlug],
    queryFn: () => publicApi.getPublicForm(tenantSlug, formSlug),
  });
}

export function useSubmitPublicForm(tenantSlug: string, formSlug: string) {
  return useMutation({
    mutationFn: (payload: PublicSubmitPayload) =>
      publicApi.submitPublicForm(tenantSlug, formSlug, payload),
  });
}

export function usePublicCalendar(tenantSlug: string, month: string) {
  return useQuery({
    queryKey: ['public', 'calendar', tenantSlug, month],
    queryFn: () => publicApi.getPublicCalendar(tenantSlug, month),
    placeholderData: (prev) => prev,
  });
}

export function usePublicStats(tenantSlug: string) {
  return useQuery({
    queryKey: ['public', 'stats', tenantSlug],
    queryFn: () => publicApi.getPublicStats(tenantSlug),
  });
}
