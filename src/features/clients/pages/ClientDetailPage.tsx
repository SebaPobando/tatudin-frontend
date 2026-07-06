import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getApiErrorMessage } from '@/api/errors';
import { SOURCE_LABEL } from '../lib';
import { useClient, useDeleteClient } from '../hooks';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium break-all">{children}</span>
    </div>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useClient(id!);
  const deleteMutation = useDeleteClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  const c = client.data;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/clientes" aria-label="Volver a clientes">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">
            {c.full_name || c.first_name}
          </h2>
          {c.source && (
            <p className="text-muted-foreground text-xs">Llegó por {SOURCE_LABEL[c.source]}</p>
          )}
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
          {c.phone && <Row label="Teléfono">{c.phone}</Row>}
          {c.email && <Row label="Email">{c.email}</Row>}
          {c.birthdate && (
            <Row label="Cumpleaños">
              {format(parseISO(c.birthdate), "d 'de' MMMM", { locale: es })}
            </Row>
          )}
          {c.tags.length > 0 && (
            <Row label="Tags">
              <span className="flex flex-wrap justify-end gap-1">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="bg-accent text-accent-foreground rounded-full px-2.5 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </Row>
          )}
          {c.notes && <Row label="Notas">{c.notes}</Row>}
          <Row label="Cliente desde">
            {format(parseISO(c.created_at), 'MMM yyyy', { locale: es })}
          </Row>
        </CardContent>
      </Card>

      {/* TODO(Fase 7+): historial de citas del cliente cuando el backend
          exponga el filtro ?client=<uuid> en appointments */}

      <div className="flex flex-col gap-2">
        <Button variant="outline" className="rounded-full" asChild>
          <Link to={`/clientes/${c.id}/editar`}>
            <Pencil /> Editar
          </Link>
        </Button>

        {confirmingDelete ? (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1 rounded-full font-semibold"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate(c.id, { onSuccess: () => navigate('/clientes') })
              }
            >
              Sí, eliminar
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => setConfirmingDelete(false)}
            >
              Volver
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="text-destructive rounded-full"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 /> Eliminar cliente
          </Button>
        )}
      </div>
    </main>
  );
}
