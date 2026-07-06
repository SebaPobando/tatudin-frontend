import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useClients } from '@/features/clients/hooks';
import { formatMoney } from '@/lib/money';
import { useAddParticipant, useParticipants } from '../hooks';

const participantSchema = z.object({
  client: z.string().min(1, 'Elige un cliente registrado.'),
  individual_price: z
    .string()
    .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Precio inválido.'),
  notes: z.string(),
});
type ParticipantValues = z.infer<typeof participantSchema>;

/**
 * Citas grupales (flash days, sesiones compartidas): el cliente principal va
 * en la cita; los demás se agregan aquí, cada uno con su precio individual.
 * El backend impide repetir el mismo cliente y recalcula total_price.
 */
export function ParticipantsCard({
  appointmentId,
  canAdd,
}: {
  appointmentId: string;
  canAdd: boolean;
}) {
  const participants = useParticipants(appointmentId);
  const addMutation = useAddParticipant(appointmentId);
  const clients = useClients({ page: 1 });
  const [adding, setAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParticipantValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: { client: '', individual_price: '', notes: '' },
  });

  const onSubmit = (values: ParticipantValues) => {
    addMutation.mutate(
      {
        client: values.client,
        individual_price: values.individual_price || undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setAdding(false);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Participantes</CardTitle>
        {canAdd && !adding && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setAdding(true)}
          >
            <UserPlus /> Agregar
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {participants.isPending && <p className="text-muted-foreground">Cargando participantes…</p>}
        {participants.data?.length === 0 && !adding && (
          <p className="text-muted-foreground">
            Solo el cliente principal. Agrega participantes para sesiones grupales.
          </p>
        )}

        {participants.data?.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{p.client_name}</p>
              {p.notes && <p className="text-muted-foreground truncate text-xs">{p.notes}</p>}
            </div>
            <span className="text-muted-foreground shrink-0">
              {formatMoney(p.individual_price)}
            </span>
          </div>
        ))}

        {adding && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-2" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="participant-client">Cliente</Label>
              <select
                id="participant-client"
                className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                {...register('client')}
              >
                <option value="">Elige un cliente…</option>
                {clients.data?.results.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.first_name}
                  </option>
                ))}
              </select>
              {errors.client && <p className="text-destructive text-xs">{errors.client.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="participant-price">Precio individual</Label>
                <Input
                  id="participant-price"
                  inputMode="decimal"
                  placeholder="150000"
                  {...register('individual_price')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="participant-notes">Notas</Label>
                <Input id="participant-notes" placeholder="Flash #3" {...register('notes')} />
              </div>
            </div>
            {addMutation.isError && (
              <p role="alert" className="text-destructive text-xs">
                {getApiErrorMessage(addMutation.error)}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1 rounded-full font-semibold"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? 'Agregando…' : 'Agregar participante'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setAdding(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
