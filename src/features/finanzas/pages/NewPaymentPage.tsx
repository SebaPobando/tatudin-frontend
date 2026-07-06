import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Decimal from 'decimal.js';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { getAllAppointments } from '@/features/agenda/api';
import { useTeam } from '@/features/team/hooks';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  PAYMENT_METHOD_LABEL,
  paymentSchema,
  valuesToPaymentPayload,
  type PaymentValues,
} from '../lib';
import { useCreatePayment } from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

const EMPTY: PaymentValues = {
  appointment_id: '',
  payer_name: '',
  amount: '',
  payment_method: 'cash',
  notes: '',
  // default: todo para el estudio; edita o agrega filas para repartir
  splits: [{ recipient_id: '', percentage: '100.00' }],
};

export function NewPaymentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const team = useTeam(); // owner/admin; para artists el select ofrece solo Estudio/Yo
  const createMutation = useCreatePayment();

  const appointments = useQuery({
    queryKey: ['appointments', 'all', tenantId],
    queryFn: () => getAllAppointments(),
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: EMPTY,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' });
  const splits = useWatch({ control, name: 'splits' });

  const sum = (splits ?? []).reduce(
    (acc, s) => acc.plus(/^\d+(\.\d{1,2})?$/.test(s?.percentage ?? '') ? s.percentage : 0),
    new Decimal(0),
  );

  const recipients = [
    { id: '', label: 'Estudio' },
    ...(team.data?.map((m) => ({ id: m.user_id, label: m.user_full_name || m.user_email })) ??
      (user ? [{ id: user.id, label: 'Yo' }] : [])),
  ];

  const onSubmit = (values: PaymentValues) => {
    createMutation.mutate(valuesToPaymentPayload(values), {
      onSuccess: (payment) => navigate(`/finanzas/pagos/${payment.id}`),
      onError: (error) => setError('root', { type: 'server', message: getApiErrorMessage(error) }),
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/finanzas" aria-label="Volver a finanzas">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registrar pago</h2>
          <p className="text-muted-foreground text-xs">
            Inmutable una vez creado — para corregir se registra uno compensatorio
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="appointment_id">Cita asociada (opcional)</Label>
          <select id="appointment_id" className={selectClass} {...register('appointment_id')}>
            <option value="">Sin cita</option>
            {appointments.data
              ?.filter((a) => a.status !== 'canceled')
              .slice(0, 50)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.client_name} · {format(parseISO(a.start_at), 'dd/MM HH:mm')}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payer_name">¿Quién paga?</Label>
          <Input id="payer_name" placeholder="Ana Pérez" {...register('payer_name')} />
          {errors.payer_name && (
            <p className="text-destructive text-xs">{errors.payer_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="350000.00"
              {...register('amount')}
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment_method">Método</Label>
            <select id="payment_method" className={selectClass} {...register('payment_method')}>
              {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Reparto (splits)</CardTitle>
            <span
              className={
                sum.equals(100)
                  ? 'text-xs font-semibold text-green-600'
                  : 'text-destructive text-xs font-semibold'
              }
            >
              {sum.toFixed(2)} / 100.00
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  aria-label={`Destinatario del split ${index + 1}`}
                  className={`${selectClass} flex-1`}
                  {...register(`splits.${index}.recipient_id`)}
                >
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label={`Porcentaje del split ${index + 1}`}
                  inputMode="decimal"
                  className="w-24"
                  placeholder="70.00"
                  {...register(`splits.${index}.percentage`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar split ${index + 1}`}
                  className="text-destructive rounded-full"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start rounded-full"
              onClick={() => append({ recipient_id: '', percentage: '' })}
            >
              <Plus /> Agregar split
            </Button>
            {errors.splits?.root && (
              <p className="text-destructive text-xs">{errors.splits.root.message}</p>
            )}
            {errors.splits && !errors.splits.root && typeof errors.splits.message === 'string' && (
              <p className="text-destructive text-xs">{errors.splits.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            rows={2}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('notes')}
          />
        </div>

        {errors.root && (
          <p role="alert" className="text-destructive text-sm">
            {errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="rounded-full font-semibold"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Registrando…' : 'Registrar pago'}
        </Button>
      </form>
    </main>
  );
}
