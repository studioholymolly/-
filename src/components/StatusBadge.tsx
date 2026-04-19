import { ProjectStatus } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    }}
    className={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </span>
  )
}
