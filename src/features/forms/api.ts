import { api } from '@/api/client';
import type {
  FormField,
  FormFieldType,
  FormSubmission,
  FormTemplate,
  FormTemplateType,
  Paginated,
  SubmissionStatus,
} from '@/types/api';

// ── Plantillas (owner/admin) ─────────────────────────────────────

export interface TemplatePayload {
  name: string;
  slug: string;
  type?: FormTemplateType;
  description?: string;
  instructions?: string;
  submit_message?: string;
}

export async function getTemplates(): Promise<FormTemplate[]> {
  const { data } = await api.get<Paginated<FormTemplate>>('/api/forms/templates/', {
    params: { page_size: 100 },
  });
  return data.results;
}

export async function getTemplate(id: string): Promise<FormTemplate> {
  const { data } = await api.get<FormTemplate>(`/api/forms/templates/${id}/`);
  return data;
}

export async function createTemplate(payload: TemplatePayload): Promise<FormTemplate> {
  const { data } = await api.post<FormTemplate>('/api/forms/templates/', payload);
  return data;
}

export async function updateTemplate(
  id: string,
  payload: Partial<TemplatePayload> & { is_active?: boolean },
): Promise<FormTemplate> {
  const { data } = await api.patch<FormTemplate>(`/api/forms/templates/${id}/`, payload);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/api/forms/templates/${id}/`);
}

// ── Campos anidados ──────────────────────────────────────────────

export interface FieldPayload {
  field_type: FormFieldType;
  label: string;
  help_text?: string;
  placeholder?: string;
  required?: boolean;
  order?: number;
  options?: string[] | null;
  min_length?: number | null;
  max_length?: number | null;
}

export async function createField(templateId: string, payload: FieldPayload): Promise<FormField> {
  const { data } = await api.post<FormField>(`/api/forms/templates/${templateId}/fields/`, payload);
  return data;
}

export async function updateField(
  templateId: string,
  fieldId: string,
  payload: Partial<FieldPayload>,
): Promise<FormField> {
  const { data } = await api.patch<FormField>(
    `/api/forms/templates/${templateId}/fields/${fieldId}/`,
    payload,
  );
  return data;
}

export async function deleteField(templateId: string, fieldId: string): Promise<void> {
  await api.delete(`/api/forms/templates/${templateId}/fields/${fieldId}/`);
}

// ── Submissions (cualquier miembro) ──────────────────────────────

export async function getSubmissions(params: {
  status?: string;
  template?: string;
  page?: number;
}): Promise<Paginated<FormSubmission>> {
  const { data } = await api.get<Paginated<FormSubmission>>('/api/forms/submissions/', {
    params: {
      status: params.status || undefined,
      template: params.template || undefined,
      page: params.page ?? 1,
    },
  });
  return data;
}

export async function getSubmission(id: string): Promise<FormSubmission> {
  const { data } = await api.get<FormSubmission>(`/api/forms/submissions/${id}/`);
  return data;
}

export async function updateSubmission(
  id: string,
  payload: { status?: SubmissionStatus; reviewer_notes?: string },
): Promise<FormSubmission> {
  const { data } = await api.patch<FormSubmission>(`/api/forms/submissions/${id}/`, payload);
  return data;
}

export async function markReviewed(id: string): Promise<FormSubmission> {
  const { data } = await api.post<FormSubmission>(`/api/forms/submissions/${id}/mark-reviewed/`);
  return data;
}
