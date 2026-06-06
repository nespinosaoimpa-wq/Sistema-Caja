/**
 * rubroConfig.js — Configuración central por tipo de negocio
 * Usado en: registro, inventario, POS, dashboard
 */

export const RUBROS = {
  general: {
    label: 'Kiosco / Almacén',
    icon: '🏪',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Cargá tus productos con código de barras para cobrar más rápido.',
    categories: [
      { name: 'General', icon: '📦', color: '#7C3AED' },
      { name: 'Bebidas', icon: '🥤', color: '#3B82F6' },
      { name: 'Golosinas', icon: '🍬', color: '#EC4899' },
      { name: 'Cigarrillos', icon: '🚬', color: '#6B7280' },
      { name: 'Lácteos', icon: '🥛', color: '#F59E0B' },
      { name: 'Limpieza', icon: '🧹', color: '#10B981' },
    ],
  },
  supermercado: {
    label: 'Supermercado / Minimarket',
    icon: '🛒',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Organizá tus productos por categoría para facilitar el control de stock.',
    categories: [
      { name: 'Almacén', icon: '🥫', color: '#7C3AED' },
      { name: 'Bebidas', icon: '🥤', color: '#3B82F6' },
      { name: 'Lácteos', icon: '🥛', color: '#F59E0B' },
      { name: 'Carnes', icon: '🥩', color: '#EF4444' },
      { name: 'Verduras', icon: '🥬', color: '#10B981' },
      { name: 'Limpieza', icon: '🧹', color: '#6B7280' },
      { name: 'Perfumería', icon: '🧴', color: '#EC4899' },
      { name: 'Congelados', icon: '🧊', color: '#60A5FA' },
    ],
  },
  ropa: {
    label: 'Ropa / Indumentaria',
    icon: '👕',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    hasVariants: true,
    inventoryTip: 'Usá variantes de talle y color para controlar el stock de cada prenda.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '34', '36', '38', '40', '42', '44', '46', '18', '20', '22', '24', '26', '28', 'Único'],
    categories: [
      { name: 'Remeras', icon: '👕', color: '#7C3AED' },
      { name: 'Pantalones', icon: '👖', color: '#3B82F6' },
      { name: 'Calzado', icon: '👟', color: '#F59E0B' },
      { name: 'Camperas', icon: '🧥', color: '#6B7280' },
      { name: 'Accesorios', icon: '👜', color: '#EC4899' },
      { name: 'Ropa Interior', icon: '🩱', color: '#10B981' },
      { name: 'Deportivo', icon: '🏃', color: '#EF4444' },
    ],
  },
  lubricentro: {
    label: 'Lubricentro / Automotor',
    icon: '🛢️',
    defaultUnit: 'l',
    defaultUnitType: 'volume',
    inventoryTip: 'Registrá aceites por litro para calcular el precio exacto al cliente.',
    categories: [
      { name: 'Aceites Motor', icon: '🛢️', color: '#F59E0B' },
      { name: 'Aceites Caja', icon: '⚙️', color: '#6B7280' },
      { name: 'Filtros', icon: '🔧', color: '#7C3AED' },
      { name: 'Líquidos', icon: '💧', color: '#3B82F6' },
      { name: 'Grasas', icon: '🔩', color: '#D97706' },
      { name: 'Aditivos', icon: '⚗️', color: '#10B981' },
      { name: 'Accesorios', icon: '🚗', color: '#EF4444' },
    ],
  },
  farmacia: {
    label: 'Farmacia / Perfumería',
    icon: '💊',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Controlá el stock de medicamentos y alertas de vencimiento.',
    categories: [
      { name: 'Medicamentos', icon: '💊', color: '#7C3AED' },
      { name: 'Perfumería', icon: '🧴', color: '#EC4899' },
      { name: 'Higiene', icon: '🪥', color: '#3B82F6' },
      { name: 'Bebés', icon: '👶', color: '#F59E0B' },
      { name: 'Suplementos', icon: '💪', color: '#10B981' },
      { name: 'Ortopedia', icon: '🦽', color: '#6B7280' },
    ],
  },
  ferreteria: {
    label: 'Ferretería / Bazar',
    icon: '🔧',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Organizá herramientas y materiales por categoría para encontrarlos más rápido.',
    categories: [
      { name: 'Herramientas', icon: '🔧', color: '#7C3AED' },
      { name: 'Pinturas', icon: '🎨', color: '#EF4444' },
      { name: 'Electricidad', icon: '⚡', color: '#F59E0B' },
      { name: 'Plomería', icon: '🚿', color: '#3B82F6' },
      { name: 'Tornillería', icon: '🔩', color: '#6B7280' },
      { name: 'Adhesivos', icon: '🧰', color: '#10B981' },
      { name: 'Maderas', icon: '🪵', color: '#D97706' },
    ],
  },
  carniceria: {
    label: 'Carnicería / Fiambrería',
    icon: '🥩',
    defaultUnit: 'kg',
    defaultUnitType: 'weight',
    inventoryTip: 'Configurá productos por kilogramo para calcular el precio automáticamente al pesar.',
    categories: [
      { name: 'Vacuno', icon: '🥩', color: '#EF4444' },
      { name: 'Cerdo', icon: '🐷', color: '#F59E0B' },
      { name: 'Pollo', icon: '🐔', color: '#FBBF24' },
      { name: 'Achuras', icon: '🫀', color: '#DC2626' },
      { name: 'Embutidos', icon: '🌭', color: '#D97706' },
      { name: 'Chacinados', icon: '🍖', color: '#7C3AED' },
      { name: 'Fiambres', icon: '🍗', color: '#EC4899' },
    ],
  },
  verduleria: {
    label: 'Verdulería / Frutería',
    icon: '🥬',
    defaultUnit: 'kg',
    defaultUnitType: 'weight',
    inventoryTip: 'Configurá frutas y verduras por kilogramo. Conectá una balanza para pesar directamente.',
    categories: [
      { name: 'Frutas', icon: '🍎', color: '#EF4444' },
      { name: 'Verduras', icon: '🥬', color: '#10B981' },
      { name: 'Legumbres', icon: '🫘', color: '#F59E0B' },
      { name: 'Aromáticas', icon: '🌿', color: '#6B7280' },
      { name: 'Varios', icon: '📦', color: '#7C3AED' },
    ],
  },
  panaderia: {
    label: 'Panadería / Pastelería',
    icon: '🥐',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Cargá tus productos de panadería con precios por unidad o docena.',
    categories: [
      { name: 'Pan', icon: '🍞', color: '#D97706' },
      { name: 'Facturas', icon: '🥐', color: '#F59E0B' },
      { name: 'Tortas', icon: '🎂', color: '#EC4899' },
      { name: 'Sandwiches', icon: '🥪', color: '#10B981' },
      { name: 'Empanadas', icon: '🥟', color: '#7C3AED' },
      { name: 'Bebidas', icon: '☕', color: '#3B82F6' },
    ],
  },
  ecommerce: {
    label: 'Tienda Online / E-commerce',
    icon: '🛍️',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Activá "Mostrar en tienda" en cada producto para que aparezca en tu tienda online.',
    categories: [
      { name: 'Destacados', icon: '⭐', color: '#F59E0B' },
      { name: 'Novedades', icon: '✨', color: '#7C3AED' },
      { name: 'General', icon: '📦', color: '#6B7280' },
    ],
  },
  otro: {
    label: 'Otro',
    icon: '📦',
    defaultUnit: 'un',
    defaultUnitType: 'unit',
    inventoryTip: 'Cargá tus productos y empezá a vender.',
    categories: [
      { name: 'General', icon: '📦', color: '#7C3AED' },
    ],
  },
}

/**
 * Devuelve la configuración del rubro, o 'general' como fallback
 */
export function getRubroConfig(businessType) {
  return RUBROS[businessType] || RUBROS['general']
}

/**
 * Devuelve las categorías iniciales para crear al registrarse
 */
export function getInitialCategories(businessType) {
  return getRubroConfig(businessType).categories
}

/**
 * Devuelve si el rubro soporta variantes (talle/color)
 */
export function rubroHasVariants(businessType) {
  return !!getRubroConfig(businessType).hasVariants
}

/**
 * Devuelve los talles predefinidos del rubro
 */
export function getRubroSizes(businessType) {
  return getRubroConfig(businessType).sizes || []
}
