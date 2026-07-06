import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { ClientForm } from '../components/ClientForm';
import { useClient, useUpdateClient } from '../hooks';
import { clientToValues, valuesToClientPayload } from '../lib';

export function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useClient(id!);
  const updateMutation = useUpdateClient(id!);

  if (client.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando cliente…</p>;
  }
  if (client.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(client.error)}
      </p>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to={`/clientes/${id}`} aria-label="Volver al detalle">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Editar cliente</h2>
      </header>

      <ClientForm
        defaultValues={clientToValues(client.data)}
        submitLabel="Guardar cambios"
        pending={updateMutation.isPending}
        serverError={updateMutation.isError ? getApiErrorMessage(updateMutation.error) : null}
        onSubmit={(values) =>
          updateMutation.mutate(valuesToClientPayload(values), {
            onSuccess: () => navigate(`/clientes/${id}`),
          })
        }
      />
    </main>
  );
}
