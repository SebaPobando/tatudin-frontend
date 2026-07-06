import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Stat-card del dashboard de los mockups: icono en tile de color,
 * etiqueta pequeña en mayúsculas, valor grande, descripción abajo.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  description,
  tone = 'accent',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: 'accent' | 'primary';
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-xl',
              tone === 'primary'
                ? 'bg-primary/10 text-primary'
                : 'bg-accent text-accent-foreground',
            )}
          >
            <Icon className="size-5" />
          </span>
          <span className="text-muted-foreground text-right text-[10px] font-semibold tracking-widest uppercase">
            {label}
          </span>
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
