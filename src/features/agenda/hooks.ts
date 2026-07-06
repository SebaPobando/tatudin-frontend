import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import type { Appointment, CreateAppointmentPayload, Project } from '@/types/api';
import * as agendaApi from './api';

/** Cache de TODAS las citas (ver nota en api.ts); las vistas filtran por día. */
export function useAllAppointments() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['appointments', 'all', tenantId],
    queryFn: () => agendaApi.getAllAppointments(),
  });
}

export function useAppointment(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['appointments', 'detail', id, tenantId],
    queryFn: () => agendaApi.getAppointment(id),
  });
}

export function useBooths() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['booths', tenantId],
    queryFn: agendaApi.getBooths,
  });
}

/** Toda mutación de citas invalida el cache completo de appointments. */
function useInvalidateAppointments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['appointments'] });
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => agendaApi.createAppointment(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAppointment(id: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (payload: Partial<CreateAppointmentPayload> & { status?: Appointment['status'] }) =>
      agendaApi.updateAppointment(id, payload),
    onSuccess: invalidate,
  });
}

function useInvalidateBooths() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['booths'] });
}

export function useCreateBooth() {
  const invalidate = useInvalidateBooths();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => agendaApi.createBooth(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateBooth() {
  const invalidate = useInvalidateBooths();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      description?: string;
      is_active?: boolean;
    }) => agendaApi.updateBooth(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteBooth() {
  const invalidate = useInvalidateBooths();
  return useMutation({
    mutationFn: (id: string) => agendaApi.deleteBooth(id),
    onSuccess: invalidate,
  });
}

// ── Motivos ──────────────────────────────────────────────────────

function useInvalidateReasons() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['reasons'] });
}

export function useReasons() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({ queryKey: ['reasons', tenantId], queryFn: agendaApi.getReasons });
}

export function useCreateReason() {
  const invalidate = useInvalidateReasons();
  return useMutation({
    mutationFn: (payload: { name: string; code: string; color: string }) =>
      agendaApi.createReason(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateReason() {
  const invalidate = useInvalidateReasons();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      color?: string;
      is_active?: boolean;
    }) => agendaApi.updateReason(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteReason() {
  const invalidate = useInvalidateReasons();
  return useMutation({
    mutationFn: (id: string) => agendaApi.deleteReason(id),
    onSuccess: invalidate,
  });
}

// ── Horarios (solo owner/admin — el backend rechaza al resto) ────

function useInvalidateWorkingHours() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['working-hours'] });
}

export function useWorkingHours() {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const isStaff = activeTenant?.role === 'owner' || activeTenant?.role === 'admin';
  return useQuery({
    queryKey: ['working-hours', activeTenant?.id],
    queryFn: agendaApi.getWorkingHours,
    enabled: isStaff,
  });
}

export function useCreateWorkingHours() {
  const invalidate = useInvalidateWorkingHours();
  return useMutation({
    mutationFn: (payload: {
      artist?: string | null;
      day_of_week: number;
      start_time: string;
      end_time: string;
    }) => agendaApi.createWorkingHours(payload),
    onSuccess: invalidate,
  });
}

export function useToggleWorkingHours() {
  const invalidate = useInvalidateWorkingHours();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      agendaApi.updateWorkingHours(id, { is_active }),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkingHours() {
  const invalidate = useInvalidateWorkingHours();
  return useMutation({
    mutationFn: (id: string) => agendaApi.deleteWorkingHours(id),
    onSuccess: invalidate,
  });
}

// ── Proyectos ────────────────────────────────────────────────────

function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['projects'] });
}

export function useProjects() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({ queryKey: ['projects', 'list', tenantId], queryFn: agendaApi.getProjects });
}

export function useProject(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['projects', 'detail', id, tenantId],
    queryFn: () => agendaApi.getProject(id),
  });
}

export function useProjectSessions(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['projects', 'sessions', id, tenantId],
    queryFn: () => agendaApi.getProjectSessions(id),
  });
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (payload: agendaApi.ProjectPayload) => agendaApi.createProject(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProject(id: string) {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (payload: Partial<agendaApi.ProjectPayload> & { status?: Project['status'] }) =>
      agendaApi.updateProject(id, payload),
    onSuccess: invalidate,
  });
}

export function useCompleteProject(id: string) {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: () => agendaApi.completeProject(id),
    onSuccess: invalidate,
  });
}

// ── Participantes (grupales) ─────────────────────────────────────

export function useParticipants(appointmentId: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['participants', appointmentId, tenantId],
    queryFn: () => agendaApi.getParticipants(appointmentId),
  });
}

export function useAddParticipant(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { client: string; individual_price?: string; notes?: string }) =>
      agendaApi.addParticipant(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', appointmentId] });
      // is_group, participants_count y total_price cambian en la cita
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
