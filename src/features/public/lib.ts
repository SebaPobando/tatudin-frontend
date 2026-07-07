import type { PublicFormField } from '@/types/api';
import type { PublicSubmitPayload } from './api';

/**
 * Convierte los valores del form dinámico al payload del API.
 * - multiselect: array → "a, b, c" (Answer.value es string)
 * - checkbox: boolean → "Sí"/"No"
 * - visitor_*: derivados de los tipos de campo (email→visitor_email,
 *   phone→visitor_phone, primer text→visitor_name) para que el backend
 *   auto-vincule con Client por email.
 */
export function buildSubmitPayload(
  fields: PublicFormField[],
  values: Record<string, unknown>,
): PublicSubmitPayload {
  const answers = fields
    .map((f) => {
      const raw = values[f.id];
      let value = '';
      if (Array.isArray(raw)) value = raw.join(', ');
      else if (typeof raw === 'boolean') value = raw ? 'Sí' : 'No';
      else if (raw !== undefined && raw !== null) value = String(raw);
      return { field_id: f.id, value };
    })
    .filter((a) => a.value !== '');

  const byType = (type: PublicFormField['field_type']) => {
    const field = fields.find((f) => f.field_type === type);
    const answer = field && answers.find((a) => a.field_id === field.id);
    return answer?.value || undefined;
  };

  return {
    answers,
    visitor_name: byType('text'),
    visitor_email: byType('email'),
    visitor_phone: byType('phone'),
  };
}

/** Campos requeridos sin respuesta → mapa de errores { fieldId: mensaje }. */
export function validateRequired(
  fields: PublicFormField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (!f.required) continue;
    const raw = values[f.id];
    const empty =
      raw === undefined ||
      raw === null ||
      raw === '' ||
      raw === false ||
      (Array.isArray(raw) && raw.length === 0);
    if (empty) errors[f.id] = 'Este campo es requerido.';
  }
  return errors;
}
