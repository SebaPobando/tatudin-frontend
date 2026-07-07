import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as formsApi from './api';
import type { FieldPayload, TemplatePayload } from './api';
import type { SubmissionStatus } from '@/types/api';

// ── Plantillas ───────────────────────────────────────────────────

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['form-templates'] });
}

export function useTemplates() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['form-templates', 'list', tenantId],
    queryFn: formsApi.getTemplates,
  });
}

export function useTemplate(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['form-templates', 'detail', id, tenantId],
    queryFn: () => formsApi.getTemplate(id),
  });
}

export function useCreateTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (payload: TemplatePayload) => formsApi.createTemplate(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Partial<TemplatePayload> & { is_active?: boolean }) =>
      formsApi.updateTemplate(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (id: string) => formsApi.deleteTemplate(id),
    onSuccess: invalidate,
  });
}

// ── Campos ───────────────────────────────────────────────────────

export function useCreateField(templateId: string) {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (payload: FieldPayload) => formsApi.createField(templateId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateField(templateId: string) {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: ({ fieldId, ...payload }: { fieldId: string } & Partial<FieldPayload>) =>
      formsApi.updateField(templateId, fieldId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteField(templateId: string) {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (fieldId: string) => formsApi.deleteField(templateId, fieldId),
    onSuccess: invalidate,
  });
}

// ── Submissions ──────────────────────────────────────────────────

function useInvalidateSubmissions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
}

export function useSubmissions(params: { status?: string; page?: number }) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['form-submissions', 'list', tenantId, params],
    queryFn: () => formsApi.getSubmissions(params),
    placeholderData: (prev) => prev,
  });
}

export function useSubmission(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['form-submissions', 'detail', id, tenantId],
    queryFn: () => formsApi.getSubmission(id),
  });
}

export function useUpdateSubmission(id: string) {
  const invalidate = useInvalidateSubmissions();
  return useMutation({
    mutationFn: (payload: { status?: SubmissionStatus; reviewer_notes?: string }) =>
      formsApi.updateSubmission(id, payload),
    onSuccess: invalidate,
  });
}

export function useMarkReviewed(id: string) {
  const invalidate = useInvalidateSubmissions();
  return useMutation({
    mutationFn: () => formsApi.markReviewed(id),
    onSuccess: invalidate,
  });
}
