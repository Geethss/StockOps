import { format } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd MMM yyyy')
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd MMM yyyy HH:mm')
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number || 0)
}

