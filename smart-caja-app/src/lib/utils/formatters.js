/**
 * Format currency to Argentine Pesos
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0'
  
  let locale = 'es-AR'
  let currency = 'ARS'
  
  if (typeof window !== 'undefined') {
    const cachedLocale = localStorage.getItem('smartcaja_tenant_locale')
    const cachedCurrency = localStorage.getItem('smartcaja_tenant_currency')
    if (cachedLocale) locale = cachedLocale
    if (cachedCurrency) currency = cachedCurrency
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (e) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

/**
 * Format date to Argentine locale
 */
export function formatDate(date, options = {}) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d)
}

/**
 * Format datetime
 */
export function formatDateTime(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format time only
 */
export function formatTime(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Calculate profit margin percentage
 */
export function calculateMargin(costPrice, salePrice) {
  if (!costPrice || costPrice === 0) return 100
  return ((salePrice - costPrice) / salePrice * 100).toFixed(1)
}

/**
 * Calculate profit amount
 */
export function calculateProfit(costPrice, salePrice, quantity = 1) {
  return (salePrice - costPrice) * quantity
}

/**
 * Format number with thousand separators (Argentine style)
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  
  let locale = 'es-AR'
  if (typeof window !== 'undefined') {
    const cachedLocale = localStorage.getItem('smartcaja_tenant_locale')
    if (cachedLocale) locale = cachedLocale
  }

  try {
    return new Intl.NumberFormat(locale).format(num)
  } catch (e) {
    return new Intl.NumberFormat('es-AR').format(num)
  }
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 30) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Get days since last sold
 */
export function daysSince(date) {
  if (!date) return null
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now - then) / (1000 * 60 * 60 * 24))
  return diff
}

/**
 * Generate a slug from text
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

/**
 * Payment method label in Spanish
 */
export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  combined: 'Combinado',
  installment: 'Cuotas',
}

/**
 * Payment method icons
 */
export const PAYMENT_METHOD_ICONS = {
  cash: '💵',
  debit: '💳',
  credit: '💳',
  combined: '🔀',
  installment: '📋',
}

/**
 * Role labels
 */
export const ROLE_LABELS = {
  owner: 'Dueño',
  admin: 'Administrador',
  cashier: 'Cajero',
}

/**
 * Subscription status
 */
export const SUBSCRIPTION_STATUS_LABELS = {
  trial: 'Prueba gratuita',
  active: 'Activa',
  suspended: 'Suspendida',
  cancelled: 'Cancelada',
}
