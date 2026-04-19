import clsx from 'clsx';
import type { ProjectStatus } from '@/lib/mock-data';
import { statusLabel } from '@/lib/mock-data';

interface Props {
  status: ProjectStatus;
  className?: string;
}

const styles: Record<ProjectStatus, string> = {
  selecting: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  editing: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  done: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
