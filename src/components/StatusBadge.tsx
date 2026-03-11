import { ProjectStatus } from '@/types/crm';
import { cn } from '@/lib/utils';

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  done: { label: 'Klar', className: 'status-done' },
  working: { label: 'Pågår', className: 'status-working' },
  stuck: { label: 'Blockerad', className: 'status-stuck' },
  pending: { label: 'Väntande', className: 'status-pending' },
  review: { label: 'Granskning', className: 'status-review' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}
