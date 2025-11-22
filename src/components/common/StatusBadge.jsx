import Badge from '@/components/ui/Badge'

const StatusBadge = ({ status }) => {
  const statusConfig = {
    Draft: { variant: 'default', label: 'Draft' },
    Ready: { variant: 'primary', label: 'Ready' },
    Waiting: { variant: 'warning', label: 'Waiting' },
    Done: { variant: 'success', label: 'Done' },
    Canceled: { variant: 'danger', label: 'Canceled' },
  }

  const config = statusConfig[status] || { variant: 'default', label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default StatusBadge

