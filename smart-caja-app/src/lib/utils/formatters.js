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
  transfer: 'Transferencia',
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
  transfer: '📲',
  combined: '🔀',
  installment: '📋',
}

/**
 * Get dynamic label checking if debit sale is actually a transfer
 */
export function getPaymentMethodLabel(sale) {
  if (!sale) return ''
  if (sale.payment_method === 'debit' && (sale.payment_details?.is_transfer || sale.payment_details?.card_brand === 'Transferencia')) {
    return 'Transferencia'
  }
  return PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method || ''
}

/**
 * Get dynamic icon checking if debit sale is actually a transfer
 */
export function getPaymentMethodIcon(sale) {
  if (!sale) return ''
  if (sale.payment_method === 'debit' && (sale.payment_details?.is_transfer || sale.payment_details?.card_brand === 'Transferencia')) {
    return '📲'
  }
  return PAYMENT_METHOD_ICONS[sale.payment_method] || ''
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

/**
 * Translate database errors to user-friendly messages in Spanish
 */
export function formatDatabaseError(error, defaultMsg = 'Ocurrió un error en la base de datos') {
  if (!error) return defaultMsg
  const msg = typeof error === 'string' ? error : (error.message || '')

  if (msg.includes('null value in column') && msg.includes('violates not-null constraint')) {
    const match = msg.match(/column "([^"]+)"/)
    const column = match ? match[1] : ''
    
    const columnsDict = {
      customer_phone: 'número de teléfono del cliente',
      customer_name: 'nombre del cliente',
      customer_email: 'email del cliente',
      customer_address: 'dirección del cliente',
      name: 'nombre',
      phone: 'teléfono',
      dni: 'DNI / CUIT',
      barcode: 'código de barras',
      reference_code: 'código de referencia',
      sale_price: 'precio de venta',
      cost_price: 'precio de costo'
    }
    
    const friendlyColumn = columnsDict[column] || column
    return `Falta cargar un dato obligatorio: ${friendlyColumn}`
  }

  if (msg.includes('unique constraint') || msg.includes('violates unique constraint')) {
    if (msg.includes('barcode')) return 'El código de barras ya está registrado en otro producto.'
    if (msg.includes('dni')) return 'El DNI o CUIT ya está registrado para otro cliente.'
    if (msg.includes('reference_code')) return 'El código de referencia ya está registrado.'
    return 'Ya existe un registro con estos datos únicos.'
  }

  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key constraint')) {
    return 'Los datos hacen referencia a un registro que no existe.'
  }

  return msg || defaultMsg
}
