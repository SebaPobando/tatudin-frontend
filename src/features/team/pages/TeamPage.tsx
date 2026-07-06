import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { UserPlus, UserX } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/auth';
import type { Role, TeamMember } from '@/types/api';
import { useInviteMember, useRevokeMember, useTeam } from '../hooks';

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  artist: 'Artista',
  receptionist: 'Recepción',
  guest: 'Guest',
};

/** Roles invitables — owner no se invita, se transfiere (acción delicada, post-MVP). */
const INVITABLE_ROLES: Role[] = ['admin', 'artist', 'receptionist', 'guest'];

const inviteSchema = z
  .object({
    email: z.email('Email inválido.'),
    role: z.string().min(1, 'Elige un rol.'),
    valid_from: z.string(),
    valid_until: z.string(),
  })
  .refine((v) => !v.valid_from || !v.valid_until || v.valid_until > v.valid_from, {
    message: 'El fin de la vigencia debe ser posterior al inicio.',
    path: ['valid_until'],
  });
type InviteValues = z.infer<typeof inviteSchema>;

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function InviteForm({ onDone }: { onDone: () => void }) {
  const inviteMutation = useInviteMember();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: '', valid_from: '', valid_until: '' },
  });

  const onSubmit = (values: InviteValues) => {
    inviteMutation.mutate(
      {
        email: values.email,
        role: values.role,
        valid_from: values.valid_from ? new Date(values.valid_from).toISOString() : undefined,
        valid_until: values.valid_until ? new Date(values.valid_until).toISOString() : undefined,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">Email del usuario</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="artista@mail.com"
          {...register('email')}
        />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        <p className="text-muted-foreground text-xs">
          Debe tener cuenta en Tatudin (las invitaciones por email llegan post-MVP).
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Rol</Label>
        <select id="invite-role" className={selectClass} {...register('role')}>
          <option value="">Elige un rol…</option>
          {INVITABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        {errors.role && <p className="text-destructive text-xs">{errors.role.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-from">Vigente desde (opcional)</Label>
          <Input id="invite-from" type="datetime-local" {...register('valid_from')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-until">Hasta (opcional)</Label>
          <Input id="invite-until" type="datetime-local" {...register('valid_until')} />
          {errors.valid_until && (
            <p className="text-destructive text-xs">{errors.valid_until.message}</p>
          )}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        La vigencia es la esencia de los guests: un artista invitado solo por temporada.
      </p>

      {inviteMutation.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(inviteMutation.error)}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1 rounded-full font-semibold"
          disabled={inviteMutation.isPending}
        >
          {inviteMutation.isPending ? 'Invitando…' : 'Invitar'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function MemberItem({ member, isSelf }: { member: TeamMember; isSelf: boolean }) {
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const revokeMutation = useRevokeMember();

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {member.user_full_name || member.user_email}
            {isSelf && <span className="text-muted-foreground font-normal"> (tú)</span>}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {member.user_email}
            {member.valid_until && ` · hasta ${format(parseISO(member.valid_until), 'dd/MM/yyyy')}`}
            {member.invited_by_email && ` · invitó ${member.invited_by_email}`}
          </p>
        </div>
        <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
          {ROLE_LABEL[member.role]}
        </span>

        {!isSelf &&
          (confirmingRevoke ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                disabled={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate(member.id)}
              >
                Sí, revocar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setConfirmingRevoke(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Revocar acceso a ${member.user_email}`}
              className="text-destructive rounded-full"
              onClick={() => setConfirmingRevoke(true)}
            >
              <UserX />
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}

export function TeamPage() {
  const team = useTeam();
  const user = useAuthStore((s) => s.user);
  const [inviting, setInviting] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Equipo</h2>
          <p className="text-muted-foreground text-xs">
            Miembros del estudio: roles, vigencias y accesos.
          </p>
        </div>
        {!inviting && (
          <Button className="rounded-full font-semibold" onClick={() => setInviting(true)}>
            <UserPlus /> Invitar
          </Button>
        )}
      </header>

      {inviting && (
        <Card>
          <CardContent>
            <InviteForm onDone={() => setInviting(false)} />
          </CardContent>
        </Card>
      )}

      {team.isPending && <p className="text-muted-foreground text-sm">Cargando equipo…</p>}
      {team.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(team.error)}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {team.data?.map((m) => (
          <li key={m.id}>
            <MemberItem member={m} isSelf={m.user_id === user?.id} />
          </li>
        ))}
      </ul>
    </main>
  );
}
