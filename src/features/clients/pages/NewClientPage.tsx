import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { ClientForm } from '../components/ClientForm';
import { useCreateClient } from '../hooks';
import { valuesToClientPayload } from '../lib';

export function NewClientPage() {
  const navigate = useNavigate();
  const createMutation = useCreateClient();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/clientes" aria-label="Volver a clientes">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo cliente</h2>
      </header>

      <ClientForm
        submitLabel="Crear cliente"
        pending={createMutation.isPending}
        serverError={createMutation.isError ? getApiErrorMessage(createMutation.error) : null}
        onSubmit={(values) =>
          createMutation.mutate(valuesToClientPayload(values), {
            onSuccess: (client) => navigate(`/clientes/${client.id}`),
          })
        }
      />
    </main>
  );
}
