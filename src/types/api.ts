/**
 * Convenciones del API de TATUDIN (ver docs/FRONTEND_INTEGRATION.md):
 * - Todos los IDs son UUIDs (string), nunca number.
 * - Dinero viaja como string.
 * - Listas paginadas con PageNumberPagination de DRF.
 */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type TenantType = 'studio' | 'independent_artist';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type Role = 'owner' | 'admin' | 'artist' | 'guest' | 'receptionist';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  subscription_plan: SubscriptionPlan;
  timezone: string;
  is_active: boolean;
}

export interface Membership {
  role: Role;
  is_active: boolean;
  tenant: Tenant;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
  refresh: string;
}

export type AppointmentStatus =
  'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'no_show';

/** Shape documentado en docs/FRONTEND_INTEGRATION.md (respuesta de POST /appointments/). */
export interface Appointment {
  id: string;
  artist_id: string;
  artist_email: string;
  booth_id: string | null;
  booth_name: string | null;
  client_name: string;
  client_phone: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string;
  estimated_price: string;
  /* Campos confirmados vía OPTIONS (2026-07-06) — opcionales porque el
     integration guide original no los documentaba: */
  client_id?: string | null;
  reason_id?: string | null;
  reason_code?: string | null;
  reason_name?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  project_id?: string | null;
  project_title?: string | null;
  participants_count?: number;
  is_group?: boolean;
  total_price?: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape confirmado contra el backend real (2026-07-06). Solo owner/admin. */
export interface AnalyticsOverview {
  tenant_slug: string;
  period: 'week' | 'month' | 'year';
  from: string;
  to: string;
  timezone: string;
  appointments: {
    total: number;
    completed: number;
    canceled: number;
    no_show: number;
    pending: number;
    no_show_rate: number;
    cancel_rate: number;
    completion_rate: number;
    average_duration_hours: number;
  };
  /** Shape interno por confirmar (siempre los hemos visto vacíos). */
  top_reasons: unknown[];
  top_services: unknown[];
  top_artists: unknown[];
  client_sources: {
    new_clients_total: number;
    breakdown: unknown[];
  };
  forms_funnel: {
    submissions_total: number;
    submissions_converted: number;
    conversion_rate: number;
  };
}

/**
 * Booth: el guide documenta el body de POST {name, description, is_active};
 * asumimos que GET devuelve esos campos + id (serializer DRF estándar).
 * ⚠ Asunción razonable pero no confirmada — validar contra /api/docs/.
 */
export interface Booth {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

/** Body documentado de POST /api/agenda/appointments/. */
export interface CreateAppointmentPayload {
  artist_id: string;
  booth_id?: string | null;
  /* El service create_appointment resuelve estos UUIDs (master doc §8.1);
     DRF ignora keys desconocidas, así que enviarlos es seguro: */
  client_id?: string | null;
  reason_id?: string | null;
  service_id?: string | null;
  project_id?: string | null;
  client_name: string;
  client_phone?: string;
  start_at: string;
  end_at: string;
  estimated_price?: string;
  notes?: string;
}

/** Shape confirmado contra backend real (GET /api/agenda/reasons/, 2026-07-06). */
export interface AppointmentReason {
  id: string;
  name: string;
  code: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Shape confirmado vía OPTIONS /api/agenda/working-hours/ (2026-07-06).
 * artist=null → horario default del estudio. Solo owner/admin.
 * Filtros: ?artist=<uuid>, ?artist__isnull=true, ?day_of_week=0
 */
export interface WorkingHours {
  id: string;
  artist_id: string | null;
  artist_email: string | null;
  day_of_week: number; // 0=Lunes … 6=Domingo (weekday() de Python)
  start_time: string; // "HH:MM:SS" en zona local del tenant
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Shape confirmado contra backend real (GET /api/tenants/team/, 2026-07-06). */
export interface TeamMember {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string | null;
  role: Role;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  invited_by_email: string | null;
  created_at: string;
}

/** Shape confirmado contra backend real (GET /api/finanzas/pnl/, 2026-07-06). */
export interface Pnl {
  tenant_slug: string;
  period: 'week' | 'month' | 'year';
  from: string;
  to: string;
  income: {
    total: string; // dinero SIEMPRE string
    by_payment_method: unknown[]; // shape interno por confirmar (vacíos hasta ahora)
    by_artist: unknown[];
  };
  expenses: {
    total: string;
    by_category: unknown[];
    by_payment_method: unknown[];
  };
  net: string;
  appointments_count: number;
  expenses_count: number;
}

/** Choices confirmados vía OPTIONS /api/clients/ (2026-07-06). */
export type ClientSource =
  'walk_in' | 'instagram' | 'referral' | 'website' | 'form' | 'google' | 'other';

/** Shape confirmado vía OPTIONS /api/clients/ (2026-07-06). */
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  birthdate: string | null;
  source: ClientSource;
  tags: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Shape confirmado vía OPTIONS /api/catalog/services/ (2026-07-06).
 * default_duration es DurationField de Django → string "HH:MM:SS".
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  default_duration: string;
  base_price: string | null;
  requires_deposit: boolean;
  default_deposit_amount: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  default_artist_id: string | null;
  default_artist_email: string | null;
  created_at: string;
  updated_at: string;
}

/** Confirmado vía OPTIONS /api/finanzas/payments/ (2026-07-06). */
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type PaymentStatus = 'completed' | 'refunded';

export interface PaymentSplit {
  id: string;
  account_id: string;
  account_name: string;
  percentage: string;
  amount: string;
}

/** Los pagos son INMUTABLES: create + list + retrieve, sin update/delete. */
export interface Payment {
  id: string;
  appointment_id: string | null;
  payer_name: string;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  notes: string;
  registered_by_email: string;
  splits: PaymentSplit[];
  created_at: string;
  updated_at: string;
}

/** Confirmado vía OPTIONS /api/finanzas/expenses/ (2026-07-06). */
export interface Expense {
  id: string;
  category_id: string | null;
  category_name: string | null;
  paid_by_id: string | null;
  paid_by_email: string | null;
  registered_by_email: string;
  amount: string;
  description: string;
  expense_date: string;
  payment_method: PaymentMethod | '';
  receipt_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** Confirmado vía OPTIONS /api/finanzas/expense-categories/ (2026-07-06). */
export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Shape confirmado contra backend real (GET tras primer pago, 2026-07-06). */
export interface Account {
  id: string;
  type: 'studio_revenue' | 'user_payable';
  name: string;
  user_id: string | null;
  user_email: string | null;
  balance: string; // dinero SIEMPRE string; cache derivado del Ledger
  created_at: string;
}

/** Confirmado vía OPTIONS /api/agenda/projects/ (2026-07-06). */
export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'canceled';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  estimated_sessions: number | null;
  estimated_total_price: string | null;
  reference_notes: string;
  started_at: string | null;
  completed_at: string | null;
  client_id: string;
  client_name: string;
  lead_artist_id: string;
  lead_artist_email: string;
  sessions_count: number;
  completed_sessions: number;
  remaining_sessions: number | null;
  /** Escala sin confirmar (¿0-1 o 0-100?) — calculamos progreso client-side. */
  progress_percentage: number;
  next_session_at: string | null;
  last_session_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape confirmado contra backend real (POST participant, 2026-07-06). */
export interface AppointmentParticipant {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  individual_price: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** Contratos confirmados vía OPTIONS /api/forms/* (2026-07-06). */
export type FormTemplateType = 'consent' | 'quote' | 'booking' | 'onboarding' | 'custom';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'signature'
  | 'file_url';

export interface FormField {
  id: string;
  field_type: FormFieldType;
  label: string;
  help_text: string;
  placeholder: string;
  required: boolean;
  order: number;
  options: string[] | null;
  min_length: number | null;
  max_length: number | null;
  created_at: string;
  updated_at: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  slug: string;
  type: FormTemplateType;
  description: string;
  instructions: string;
  is_active: boolean;
  submit_message: string;
  fields: FormField[];
  fields_count: number;
  submissions_count: number;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus = 'pending' | 'reviewed' | 'converted' | 'archived';

export interface SubmissionAnswer {
  id: string;
  field_id: string;
  field_label: string;
  field_type: string;
  value: string;
}

export interface FormSubmission {
  id: string;
  template_id: string;
  template_name: string;
  template_type: string;
  client_id: string | null;
  client_name: string | null;
  status: SubmissionStatus;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  reviewer_email: string | null;
  reviewed_at: string | null;
  reviewer_notes: string;
  answers: SubmissionAnswer[];
  submitted_ip: string;
  submitted_user_agent: string;
  created_at: string;
  updated_at: string;
}

/** Contratos públicos confirmados contra backend real (2026-07-06). */
export type PublicFormField = Omit<FormField, 'created_at' | 'updated_at'>;

export interface PublicFormTemplate {
  id: string;
  name: string;
  type: FormTemplateType;
  description: string;
  instructions: string;
  submit_message: string;
  fields: PublicFormField[];
}

export interface PublicCalendarDay {
  date: string;
  weekday: number; // 0=Lunes (convención weekday() de Python)
  is_working_day: boolean;
  has_availability: boolean;
  available_hours: number;
}

export interface PublicCalendar {
  tenant_slug: string;
  month: string;
  timezone: string;
  artist_id: string | null;
  days: PublicCalendarDay[];
}

export interface PublicStats {
  tenant_slug: string;
  period: string;
  from: string;
  to: string;
  timezone: string;
  total_working_days: number;
  total_working_hours: number;
  total_busy_hours: number;
  total_available_hours: number;
  busy_days_count: number;
  busy_days_percentage: number;
  total_appointments_count: number;
  active_artists_count: number;
}

export interface PublicAvailability {
  tenant_slug: string;
  artist_id: string;
  date: string;
  timezone: string;
  /** Shape interno por confirmar (siempre lo hemos visto vacío). */
  ranges: unknown[];
}

// ── Eventos (Fase 12) ────────────────────────────────────────────
// Reconstruido tras reversión de OneDrive del mount (2026-07-07).
export type EventStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'canceled';

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  artists_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EventArtist {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  commission_percentage: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── Analytics (Fase 13a) ─────────────────────────────────────────
export type AnalyticsPeriod = 'week' | 'month' | 'year';

export interface AnalyticsEnvelope {
  tenant_slug: string;
  period: AnalyticsPeriod;
  from: string;
  to: string;
  timezone: string;
}

export interface ArtistStat {
  artist_id: string;
  artist_email: string;
  appointments_count: number;
  completed_count: number;
  canceled_count: number;
  no_show_count: number;
  completion_rate: number;
  total_hours_worked: number;
  average_duration_hours: number;
}

export interface AnalyticsByArtist {
  tenant_slug: string;
  period: AnalyticsPeriod;
  from: string;
  to: string;
  artists: ArtistStat[];
}

export interface DayStat {
  weekday: number;
  day_name: string;
  appointments_count: number;
  completed_count: number;
  canceled_count: number;
}

export interface AnalyticsByDayOfWeek extends AnalyticsEnvelope {
  days: DayStat[];
}

export interface FunnelOverall {
  submissions_total: number;
  pending_count: number;
  reviewed_count: number;
  converted_count: number;
  archived_count: number;
  conversion_rate: number;
}

export interface AnalyticsFunnel {
  tenant_slug: string;
  period: AnalyticsPeriod;
  from: string;
  to: string;
  overall: FunnelOverall;
  by_template: unknown[];
}

// ── Integraciones (Fase 13b) ─────────────────────────────────────
export type IntegrationProvider =
  | 'google_calendar'
  | 'whatsapp_twilio'
  | 'whatsapp_meta'
  | 'google_reviews';

export type ConnectionStatus = 'inactive' | 'active' | 'error';

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  status: ConnectionStatus;
  config: Record<string, unknown>;
  has_secret: boolean;
  last_used_at: string | null;
  last_error: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationOutbox {
  id: string;
  status?: string;
  event_type?: string;
  recipient?: string;
  retry_count?: number;
  last_error?: string;
  created_at?: string;
  [key: string]: unknown;
}
