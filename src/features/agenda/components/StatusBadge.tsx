import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types/api';
import { STATUS_LABEL } from '../lib';

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  scheduled: 'bg-accent text-accent-foreground',
  confirmed: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-primary text-primary-foreground',
  completed: 'bg-muted text-muted-foreground',
  canceled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-destructive/10 text-destructive',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
