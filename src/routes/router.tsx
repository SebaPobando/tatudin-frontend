import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/shared/AppShell';
import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { PublicCalendarPage } from '@/features/public/pages/PublicCalendarPage';
import { PublicFormPage } from '@/features/public/pages/PublicFormPage';
import { PublicStatsPage } from '@/features/public/pages/PublicStatsPage';
import { SelectTenantPage } from '@/features/auth/pages/SelectTenantPage';
import { AgendaPage } from '@/features/agenda/pages/AgendaPage';
import { AppointmentDetailPage } from '@/features/agenda/pages/AppointmentDetailPage';
import { AgendaSettingsPage } from '@/features/agenda/pages/AgendaSettingsPage';
import { BoothsPage } from '@/features/agenda/pages/BoothsPage';
import { ReasonsPage } from '@/features/agenda/pages/ReasonsPage';
import { WorkingHoursPage } from '@/features/agenda/pages/WorkingHoursPage';
import { EditAppointmentPage } from '@/features/agenda/pages/EditAppointmentPage';
import { NewAppointmentPage } from '@/features/agenda/pages/NewAppointmentPage';
import { NewProjectPage } from '@/features/agenda/pages/NewProjectPage';
import { ProjectDetailPage } from '@/features/agenda/pages/ProjectDetailPage';
import { ProjectsPage } from '@/features/agenda/pages/ProjectsPage';
import { ServicesPage } from '@/features/catalog/pages/ServicesPage';
import { ClientDetailPage } from '@/features/clients/pages/ClientDetailPage';
import { ClientsPage } from '@/features/clients/pages/ClientsPage';
import { EditClientPage } from '@/features/clients/pages/EditClientPage';
import { NewClientPage } from '@/features/clients/pages/NewClientPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ExpenseCategoriesPage } from '@/features/finanzas/pages/ExpenseCategoriesPage';
import { ExpensesPage } from '@/features/finanzas/pages/ExpensesPage';
import { FinanzasPage } from '@/features/finanzas/pages/FinanzasPage';
import { NewPaymentPage } from '@/features/finanzas/pages/NewPaymentPage';
import { PaymentDetailPage } from '@/features/finanzas/pages/PaymentDetailPage';
import { MenuPage } from '@/features/dashboard/pages/MenuPage';
import { FormFieldsPage } from '@/features/forms/pages/FormFieldsPage';
import { FormsPage } from '@/features/forms/pages/FormsPage';
import { SubmissionDetailPage } from '@/features/forms/pages/SubmissionDetailPage';
import { SubmissionsPage } from '@/features/forms/pages/SubmissionsPage';
import { TeamPage } from '@/features/team/pages/TeamPage';
import { RequireAuth } from './RequireAuth';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  // Páginas PÚBLICAS: sin RequireAuth, sin AppShell — para compartir/embeber
  { path: '/f/:tenantSlug/:formSlug', element: <PublicFormPage /> },
  { path: '/c/:tenantSlug', element: <PublicCalendarPage /> },
  { path: '/s/:tenantSlug', element: <PublicStatsPage /> },
  {
    // Autenticado pero sin exigir tenant: aquí se elige
    element: <RequireAuth requireTenant={false} />,
    children: [{ path: '/select-tenant', element: <SelectTenantPage /> }],
  },
  {
    // Todo lo demás exige sesión + tenant activo, y vive dentro del shell
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/menu', element: <MenuPage /> },
          { path: '/agenda', element: <AgendaPage /> },
          { path: '/agenda/nueva', element: <NewAppointmentPage /> },
          { path: '/agenda/ajustes', element: <AgendaSettingsPage /> },
          { path: '/agenda/cabinas', element: <BoothsPage /> },
          { path: '/agenda/motivos', element: <ReasonsPage /> },
          { path: '/agenda/horarios', element: <WorkingHoursPage /> },
          { path: '/proyectos', element: <ProjectsPage /> },
          { path: '/proyectos/nuevo', element: <NewProjectPage /> },
          { path: '/proyectos/:id', element: <ProjectDetailPage /> },
          { path: '/agenda/:id', element: <AppointmentDetailPage /> },
          { path: '/agenda/:id/editar', element: <EditAppointmentPage /> },
          { path: '/finanzas', element: <FinanzasPage /> },
          { path: '/finanzas/pagos/nuevo', element: <NewPaymentPage /> },
          { path: '/finanzas/pagos/:id', element: <PaymentDetailPage /> },
          { path: '/finanzas/gastos', element: <ExpensesPage /> },
          { path: '/finanzas/categorias', element: <ExpenseCategoriesPage /> },
          { path: '/clientes', element: <ClientsPage /> },
          { path: '/clientes/nuevo', element: <NewClientPage /> },
          { path: '/clientes/:id', element: <ClientDetailPage /> },
          { path: '/clientes/:id/editar', element: <EditClientPage /> },
          { path: '/catalogo', element: <ServicesPage /> },
          { path: '/formularios', element: <FormsPage /> },
          { path: '/formularios/entradas', element: <SubmissionsPage /> },
          { path: '/formularios/entradas/:id', element: <SubmissionDetailPage /> },
          { path: '/formularios/:id/campos', element: <FormFieldsPage /> },
          { path: '/eventos', element: <PlaceholderPage title="Eventos" phase={12} /> },
          { path: '/equipo', element: <TeamPage /> },
          { path: '/analytics', element: <PlaceholderPage title="Analytics" phase={13} /> },
          { path: '/integraciones', element: <PlaceholderPage title="Integraciones" phase={13} /> },
          { path: '/ajustes', element: <PlaceholderPage title="Ajustes" phase={14} /> },
        ],
      },
    ],
  },
]);
