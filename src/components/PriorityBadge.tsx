import { ProjectPriority } from '@/types/crm';
import { cn } from '@/lib/utils';

const priorityConfig: Record<ProjectPriority, { label: string; className: string }> = {
  low: { label: 'Låg', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-accent text-accent-foreground' },
  high: { label: 'Hög', className: 'bg-status-working/15 text-status-working' },
  critical: { label: 'Kritisk', className: 'bg-status-stuck/15 text-status-stuck' },
};

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const config = priorityConfig[priority];
  return (
    <span className={cn('inline-block px-2.5 py-0.5 rounded-md text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
