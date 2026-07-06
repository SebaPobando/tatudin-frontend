import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientSource } from '@/types/api';
import { SOURCE_LABEL } from '../lib';
import { clientSchema, type ClientValues } from '../schemas';

const EMPTY: ClientValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birthdate: '',
  source: '',
  tags: '',
  notes: '',
};

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

export function ClientForm({
  defaultValues,
  submitLabel,
  pending,
  serverError,
  onSubmit,
}: {
  defaultValues?: ClientValues;
  submitLabel: string;
  pending: boolean;
  serverError?: string | null;
  onSubmit: (values: ClientValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">Nombre</Label>
          <Input id="first_name" placeholder="Ana" {...register('first_name')} />
          {errors.first_name && (
            <p className="text-destructive text-xs">{errors.first_name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Apellido</Label>
          <Input id="last_name" placeholder="Pérez" {...register('last_name')} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="ana@mail.com" {...register('email')} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" placeholder="+57 300 000 0000" {...register('phone')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="birthdate">Cumpleaños</Label>
          <Input id="birthdate" type="date" {...register('birthdate')} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="source">¿Cómo llegó?</Label>
        <select id="source" className={selectClass} {...register('source')}>
          <option value="">Sin especificar</option>
          {(Object.keys(SOURCE_LABEL) as ClientSource[]).map((value) => (
            <option key={value} value={value}>
              {SOURCE_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Tags (separados por coma)</Label>
        <Input id="tags" placeholder="flash, blackwork" {...register('tags')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Alergias, preferencias, historial…"
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register('notes')}
        />
      </div>

      {serverError && (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <Button type="submit" className="mt-2 rounded-full font-semibold" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  );
}
