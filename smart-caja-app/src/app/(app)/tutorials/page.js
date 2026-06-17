'use client'

import { useState, useCallback } from 'react'
import {
  ShoppingCart, Package, Clock, Receipt, Users, TrendingUp, CreditCard,
  ShoppingBag, Search, ChevronDown, ChevronRight, Keyboard, HelpCircle,
  Zap, CheckCircle, Printer, Trash2, Plus, Minus, X, ArrowRight, ClipboardList
} from 'lucide-react'


// ─── Datos del simulador ──────────────────────────────────────────────────────
const DEMO_PRODUCTS = [
  { id: 1, name: 'Coca-Cola 1.5L', price: 1500, icon: '🥤', unit: 'u' },
  { id: 2, name: 'Pan Francés', price: 800, icon: '🍞', unit: 'u' },
  { id: 3, name: 'Yerba 1kg', price: 3200, icon: '🍃', unit: 'u' },
  { id: 4, name: 'Facturas x6', price: 2400, icon: '🥐', unit: 'u' },
  { id: 5, name: 'Aceite 900ml', price: 2800, icon: '🫙', unit: 'u' },
  { id: 6, name: 'Queso x100g', price: 900, icon: '🧀', unit: 'kg', isWeight: true },
]

const PAYMENT_METHODS = [
  { key: 'cash',        label: 'Efectivo',     icon: '💵', color: '#4edea3' },
  { key: 'debit',       label: 'Débito',       icon: '💳', color: '#ddb7ff' },
  { key: 'credit',      label: 'Crédito',      icon: '💳', color: '#ddb7ff' },
  { key: 'transfer',    label: 'Transferencia',icon: '🏦', color: '#60a5fa' },
  { key: 'mixed',       label: 'Mixto',        icon: '🔀', color: '#ffb2b7' },
  { key: 'installment', label: 'Fiado / Cta.', icon: '📋', color: '#fbbf24' },
]

// ─── Datos de módulos ─────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'pos',
    label: 'Caja (POS)',
    icon: <ShoppingCart size={18} />,
    emoji: '🛒',
    description: 'Registrá ventas rápido, con teclado o escáner.',
    steps: [
      { title: '1. Abrí el turno', body: 'Antes de empezar a vender, andá a Turnos → "Abrir Caja Nueva". Ingresá el efectivo inicial (puede ser $0 si no tenés fondo de caja). Sin turno abierto, el sistema no te dejará confirmar ventas en efectivo.' },
      { title: '2. Buscá o escaneá productos', body: 'Usá el campo de búsqueda para buscar por nombre, código de barras o referencia. También podés escanear con pistola lectora (la entrada se detecta automáticamente) o con la cámara del celular (botón 📷).' },
      { title: '3. Ajustá cantidades', body: 'En el carrito podés cambiar la cantidad de cada ítem haciendo clic en los botones + / − o escribiendo directamente el número. Para productos por peso (kilo/litro), el campo acepta decimales (ej: 0.750 kg).' },
      { title: '4. Aplicá descuento (opcional)', body: 'Podés aplicar un descuento porcentual (%) o monto fijo ($) antes de confirmar. El sistema calcula automáticamente el total final y lo refleja en el ticket.' },
      { title: '5. Elegí el método de pago', body: 'Seleccioná entre Efectivo, Débito, Crédito, Transferencia, Mixto o Fiado. Cada método tiene campos adicionales (ej. vuelto en efectivo, número de cupón en tarjeta, distribución de montos en mixto).' },
      { title: '6. Confirmá la venta', body: 'Presioná "Confirmar Venta" (o Enter / F12). El sistema registra la venta, descuenta el stock automáticamente y genera el ticket no fiscal. Podés imprimir directamente a una impresora térmica de 80mm.' },
    ],
    shortcuts: [
      { key: 'F2', desc: 'Efectivo' },
      { key: 'F3', desc: 'Débito' },
      { key: 'F4', desc: 'Crédito' },
      { key: 'F6', desc: 'Transferencia' },
      { key: 'Enter / F12', desc: 'Confirmar venta' },
      { key: 'Esc', desc: 'Limpiar carrito' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: <Package size={18} />,
    emoji: '📦',
    description: 'Gestioná productos, precios, stock y categorías.',
    steps: [
      { title: 'Alta de producto', body: 'Hacé clic en "+ Nuevo Producto". Completá nombre, precio de costo, precio de venta y stock inicial. El código de barras es opcional pero facilita la venta con escáner.' },
      { title: 'Alertas de stock mínimo', body: 'Cada producto tiene un campo "Stock Mínimo". Cuando el stock real baje a ese valor o menos, aparecerá en el inventario con un indicador rojo y se contará en el widget de "Alertas de Stock" en el Dashboard.' },
      { title: 'Categorías', body: 'Las categorías agrupan tus productos y permiten filtrarlos rápido en la Caja. Creá categorías con ícono emoji y color desde el botón "Categorías" en el Inventario.' },
      { title: 'Variantes de producto', body: 'Para productos con talle o color (ej. remeras), activá la opción de variantes al editar un producto. Cada variante tiene su propio stock y puede tener un precio adicional.' },
      { title: 'Importación masiva CSV', body: 'Si ya tenés una lista de productos en Excel, exportala como CSV y subila desde el botón "CSV". El formato requerido es: Nombre, Costo, Precio Venta, Stock, Código Barras (opcional).' },
      { title: 'Escanear para buscar o crear', body: 'Usá el botón 📷 en el Inventario para escanear un código con la cámara. Si el producto existe, te lleva directo a editarlo. Si no existe, abre el formulario de alta rápida con el código pre-cargado.' },
    ],
  },
  {
    id: 'no-stock',
    label: 'Venta sin Stock',
    icon: <Zap size={18} />,
    emoji: '🥖',
    description: 'Venta libre para panaderías y comercios de producción diaria.',
    steps: [
      { title: 'Crear producto sin stock', body: 'En la sección Inventario, al dar de alta o editar un producto (como Pan Mignon o Facturas), verás la casilla "Controlar Stock" activada por defecto. Si la desmarcas, el producto no requerirá stock inicial.' },
      { title: 'Comportamiento en Caja (POS)', body: 'Los productos que no controlan stock se muestran en el catálogo y autocompletado sin indicadores de stock. Se pueden añadir en cualquier cantidad sin que el sistema bloquee la venta por stock insuficiente.' },
      { title: 'Integración en Preventa y Pedidos', body: 'En los módulos de Pedidos Online y Preventista, los productos marcados sin control de stock permiten adiciones ilimitadas al carrito sin alertas de stock excedido o nulo.' },
      { title: 'Control financiero e ingresos', body: 'La venta de estos productos registra los ingresos económicos con total precisión para el arqueo y cierre del turno de caja, omitiendo únicamente la auditoría del stock físico.' }
    ]
  },
  {
    id: 'shifts',
    label: 'Turnos',
    icon: <Clock size={18} />,
    emoji: '⏱️',
    description: 'Control de apertura, cierre y arqueo de caja.',
    steps: [
      { title: 'Abrir caja', body: 'Cada cajero abre su propio turno con el efectivo inicial que tiene en la caja. Podés ingresar $0 si no hay fondo de caja. El sistema registra quién abre y a qué hora.' },
      { title: 'Durante el turno', body: 'Mientras el turno está activo, podés ver en tiempo real el efectivo esperado (fondo inicial + ventas en efectivo), el total de ventas con tarjeta y el resumen por método de pago.' },
      { title: 'Conciliación de tarjetas', body: 'Al cierre, el sistema lista todos los tickets de venta con tarjeta. Chequeá físicamente cada cupón del POSnet y tildalo en el sistema. Podés editar el número de operación si hubo diferencia.' },
      { title: 'Contador de billetes', body: 'Usá el botón "Contar billetes" para ingresar cuántos billetes de cada denominación tenés en la caja. El sistema calcula el total automáticamente.' },
      { title: 'Cerrar turno', body: 'Ingresá el efectivo real contado en la caja al cierre. El sistema calcula la diferencia vs. lo esperado. Al confirmar, el turno queda cerrado y aparece en el historial con toda la información.' },
      { title: 'Historial', body: 'Desde la parte inferior de la pantalla podés ver todos los turnos anteriores: quién los abrió, a qué hora, cuánto efectivo inicial y cuánto efectivo al cierre, con la diferencia marcada en verde o rojo.' },
    ],
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: <Users size={18} />,
    emoji: '👥',
    description: 'Cuentas corrientes, fiados y seguimiento.',
    steps: [
      { title: 'Registrar un cliente', body: 'En la sección Clientes, hacé clic en "+ Nuevo Cliente". Cargá nombre, teléfono y email (opcionales). El saldo deudor empieza en $0.' },
      { title: 'Vender en fiado', body: 'En la Caja, elegí el método de pago "Fiado / Cta. Cte." y seleccioná el cliente. La venta se registra y el saldo deudor del cliente se incrementa automáticamente por el total.' },
      { title: 'Registrar un pago', body: 'Cuando el cliente paga parte o todo lo que debe, registrá una "Entrega" desde la ficha del cliente. El saldo se reduce en el monto recibido y queda el historial completo.' },
      { title: 'Ver historial', body: 'Desde la ficha de cada cliente podés ver todas sus compras en fiado, cuándo pagó y cuánto debe actualmente.' },
    ],
  },
  {
    id: 'analytics',
    label: 'Estadísticas',
    icon: <TrendingUp size={18} />,
    emoji: '📊',
    description: 'Análisis de ventas, márgenes y productos top.',
    steps: [
      { title: 'Resumen diario / semanal / mensual', body: 'El Dashboard muestra los KPIs principales: ventas totales, número de transacciones, margen promedio y comparativa con el período anterior. Podés filtrar por rango de fechas.' },
      { title: 'Productos más vendidos', body: 'En Estadísticas podés ver el ranking de productos con mayor cantidad de ventas y mayor ingreso generado. Útil para decidir qué reponer con prioridad.' },
      { title: 'Ventas por método de pago', body: 'El gráfico de distribución muestra qué porcentaje de tus ventas fue en efectivo, tarjeta, transferencia, etc. Te ayuda a entender el flujo de caja real.' },
      { title: 'Rentabilidad', body: 'Si cargaste correctamente el precio de costo de tus productos, el sistema calcula el margen bruto de cada venta. Podés ver cuánto ganás por producto y en total.' },
    ],
  },
  {
    id: 'installments',
    label: 'Cuotas',
    icon: <CreditCard size={18} />,
    emoji: '📋',
    description: 'Planes de pago en cuotas y seguimiento de cobranzas.',
    steps: [
      { title: '¿Qué es una venta en cuotas?', body: 'Al vender desde la Caja con el método "Cuotas", el sistema crea un plan de cobro automático. Podés configurar la cantidad de cuotas y el interés (opcional).' },
      { title: 'Ver planes activos', body: 'En la sección Cuotas aparecen todos los planes con su saldo pendiente, cuántas cuotas cobradas y cuántas faltan. Los planes atrasados se marcan en rojo.' },
      { title: 'Registrar una cuota cobrada', body: 'Cuando el cliente paga una cuota, marcala como pagada desde el plan. El saldo restante se actualiza automáticamente.' },
      { title: 'Compras a proveedores', body: 'En la sección Compras podés registrar las compras que realizás a tus proveedores. Esto actualiza el stock automáticamente y te permite llevar el seguimiento de pagos pendientes a proveedores.' },
    ],
  },
  {
    id: 'store',
    label: 'Tienda Online',
    icon: <ShoppingBag size={18} />,
    emoji: '🌐',
    description: 'Habilitá un catálogo público y mostrá tus productos al mundo.',
    steps: [
      { title: '1. Habilitar la tienda', body: 'Andá a Configuración → pestaña "Tienda Online". Activá la opción "Habilitar tienda pública" para que tu catálogo sea accesible desde internet.' },
      { title: '2. Configurar WhatsApp', body: 'Completá tu número de teléfono de WhatsApp (con código de país, ej: 54911...). Los pedidos que realicen tus clientes llegarán formateados con un mensaje automático directamente a este número.' },
      { title: '3. Publicar productos', body: 'En el Inventario, editá cualquier producto y activá el interruptor "Mostrar en Tienda Online". Solo los productos marcados como visibles aparecerán en el catálogo público.' },
      { title: '4. Enlace personalizado', body: 'El sistema genera una URL única para tu tienda (ej: /tienda/tu-negocio). Podés copiar este enlace para ponerlo en tu perfil de Instagram, enviarlo a clientes o imprimir un código QR.' },
    ],
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: <ClipboardList size={18} />,
    emoji: '📋',
    description: 'Gestioná los pedidos que llegan de tu tienda, controlá sus estados y notificá a tus clientes.',
    steps: [
      { title: '1. Recepción de pedidos', body: 'Cuando un cliente completa su compra en la Tienda Online, el pedido se registra automáticamente en la sección "Pedidos" del panel y se envía la alerta correspondiente por WhatsApp.' },
      { title: '2. Tablero de control (Kanban)', body: 'En la sección Pedidos, verás las tarjetas organizadas en columnas según su estado: Pendientes, En Preparación, Listos para Entregar y Entregados/Cerrados.' },
      { title: '3. Cambio de estados', body: 'Arrastrá las tarjetas o usá los botones de acción rápidos dentro del detalle del pedido para avanzar su estado a medida que procesás la orden.' },
      { title: '4. Notificación y Facturación', body: 'Desde el detalle del pedido, podés hacer clic en "Notificar" para enviarle un mensaje automático de actualización al cliente por WhatsApp, o facturarlo directamente para pasarlo a tus ventas registradas.' },
      { title: '5. Preventistas e integración', body: 'Los pedidos creados por preventistas en la calle también se consolidan en este módulo bajo la etiqueta del vendedor correspondiente.' },
    ],
  },
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: '¿El ticket que emite Smart Caja tiene validez fiscal?', a: 'No. Smart Caja emite tickets no fiscales de uso interno (comprobante de la operación). Para emitir facturas o tickets fiscales válidos ante AFIP es necesario contar con un controlador fiscal homologado. Smart Caja puede convivir con un controlador fiscal.' },
  { q: '¿Puedo usar la app sin conexión a internet?', a: 'La app requiere conexión para sincronizar los datos con la base de datos en la nube. Sin embargo, usa caché local para mostrar productos y turnos activos si la conexión es inestable. Las ventas sin conexión se guardan en cola y se sincronizan al recuperar la señal.' },
  { q: '¿Cómo funciona la conciliación de tarjetas en el cierre de turno?', a: 'Al cerrar el turno, el sistema lista todas las ventas hechas con débito o crédito. Debés cruzar físicamente los cupones del POSnet con esa lista, tildar los que están OK y editar el número de operación si alguno difiere. El sistema calcula la diferencia automáticamente.' },
  { q: '¿Qué pasa si me equivoco en una venta?', a: 'Podés anular una venta desde el historial de Ventas. Buscá la venta, entrá al detalle y seleccioná "Anular". El stock vuelve al estado anterior. Las ventas anuladas quedan en el historial con estado "Cancelada" para trazabilidad.' },
  { q: '¿Puedo tener más de un cajero al mismo tiempo?', a: 'Sí. Cada usuario tiene su propio turno abierto. Varios cajeros pueden operar simultáneamente con sus propios turnos, y al cierre cada uno ve sus propias ventas y arqueo.' },
  { q: '¿Cómo funciona la balanza inteligente?', a: 'Si tenés una balanza conectada al puerto USB/serial de la computadora, Smart Caja puede leer el peso automáticamente cuando agregás un producto de tipo "por peso" al carrito. El peso se toma como cantidad de la unidad vendida (ej. 0.750 kg).' },
  { q: '¿Los datos están seguros en la nube?', a: 'Sí. Los datos se guardan en Supabase (PostgreSQL) con cifrado en tránsito (TLS) y en reposo. Cada comercio tiene sus propios datos completamente aislados de los demás mediante Row-Level Security (RLS).' },
  { q: '¿Cómo cobro las ventas de la tienda online?', a: 'Actualmente, los clientes arman su pedido en la tienda y te lo envían. El pago y la entrega se coordinan directamente por WhatsApp o al momento de la entrega (efectivo, transferencia bancaria, Mercado Pago, etc.).' },
  { q: '¿Los pedidos online descuentan stock de inmediato?', a: 'No. Para evitar que el stock quede bloqueado por pedidos falsos o no confirmados, el stock solo se descuenta cuando editás el pedido y hacés clic en "Facturar" desde el panel de control, convirtiéndolo en una venta de caja.' },
]

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function TutorialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeModuleId, setActiveModuleId] = useState('pos')
  const [expandedFaqs, setExpandedFaqs] = useState({})
  const [expandedSteps, setExpandedSteps] = useState({})

  // Simulador
  const [simCart, setSimCart] = useState([])
  const [simPayment, setSimPayment] = useState('cash')
  const [simCashInput, setSimCashInput] = useState('')
  const [simStep, setSimStep] = useState('cart') // 'cart' | 'payment' | 'receipt'
  const [simMixedCash, setSimMixedCash] = useState('')
  const [simMixedCard, setSimMixedCard] = useState('')

  const simTotal = simCart.reduce((s, i) => s + i.price * i.qty, 0)
  const simChange = Math.max(0, parseFloat(simCashInput || 0) - simTotal)

  const addToSim = useCallback((product) => {
    setSimCart(prev => {
      const ex = prev.find(i => i.id === product.id)
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: parseFloat((i.qty + (i.isWeight ? 0.5 : 1)).toFixed(3)) } : i)
      return [...prev, { ...product, qty: product.isWeight ? 0.5 : 1 }]
    })
    setSimStep('cart')
  }, [])

  const removeFromSim = useCallback((id) => {
    setSimCart(prev => prev.filter(i => i.id !== id))
  }, [])

  const resetSim = () => {
    setSimCart([])
    setSimPayment('cash')
    setSimCashInput('')
    setSimMixedCash('')
    setSimMixedCard('')
    setSimStep('cart')
  }

  const toggleFaq = (idx) => setExpandedFaqs(p => ({ ...p, [idx]: !p[idx] }))
  const toggleStep = (key) => setExpandedSteps(p => ({ ...p, [key]: !p[key] }))

  // Filtrado de módulos por búsqueda
  const filteredModules = searchTerm.trim()
    ? MODULES.filter(m =>
        m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.steps.some(s =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.body.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : MODULES

  const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[0]

  const fmt = (n) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 })

  return (
    <div>
      <style>{`
        .tut-hero {
          background: linear-gradient(135deg, rgba(221,183,255,0.08) 0%, rgba(78,222,163,0.05) 100%);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-10) var(--space-8);
          margin-bottom: var(--space-8);
          position: relative;
          overflow: hidden;
        }
        .tut-hero::before {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(221,183,255,0.12) 0%, transparent 70%);
          border-radius: 50%;
        }
        .tut-hero::after {
          content: '';
          position: absolute; bottom: -30px; left: 60px;
          width: 150px; height: 150px;
          background: radial-gradient(circle, rgba(78,222,163,0.08) 0%, transparent 70%);
          border-radius: 50%;
        }
        .module-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: var(--radius-md);
          border: 1px solid transparent;
          font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          background: transparent; color: var(--text-secondary);
          white-space: nowrap;
        }
        .module-tab:hover { color: var(--text-primary); background: var(--bg-card); }
        .module-tab.active {
          background: var(--color-primary-light);
          border-color: var(--color-primary-border);
          color: var(--color-primary);
        }
        .step-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .step-card:hover { border-color: var(--border-highlight); }
        .step-trigger {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; cursor: pointer;
          background: var(--bg-input);
          font-size: 0.9375rem; font-weight: 600; color: #fff;
          border: none; width: 100%; text-align: left;
          transition: background 0.2s;
        }
        .step-trigger:hover { background: var(--bg-card-hover); }
        .step-body {
          padding: 14px 16px;
          background: var(--bg-surface);
          font-size: 0.875rem; color: var(--text-secondary);
          line-height: 1.7; border-top: 1px solid var(--border-color);
        }
        .faq-item {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden; transition: border-color 0.2s;
        }
        .faq-item:hover { border-color: var(--border-highlight); }
        .faq-trigger {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; cursor: pointer;
          background: var(--bg-card);
          font-size: 0.9375rem; font-weight: 600; color: #fff;
          border: none; width: 100%; text-align: left; gap: 12px;
          transition: background 0.2s;
        }
        .faq-trigger:hover { background: var(--bg-card-hover); }
        .faq-body {
          padding: 16px 20px;
          background: var(--bg-surface);
          font-size: 0.875rem; color: var(--text-secondary);
          line-height: 1.7; border-top: 1px solid var(--border-color);
        }
        .sim-product-btn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 6px;
          padding: 12px 8px; border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-input); cursor: pointer;
          transition: all 0.2s; font-size: 0.75rem; color: var(--text-secondary);
          font-weight: 500;
        }
        .sim-product-btn:hover {
          border-color: var(--color-primary-border);
          background: var(--color-primary-light);
          color: var(--color-primary);
          transform: translateY(-2px);
        }
        .sim-product-btn .emoji { font-size: 1.5rem; }
        .pay-method-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 10px 6px; border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-input); cursor: pointer;
          transition: all 0.15s; font-size: 0.6875rem; font-weight: 600;
          color: var(--text-secondary);
        }
        .pay-method-btn.active {
          border-color: var(--color-primary-border);
          background: var(--color-primary-light);
          color: var(--color-primary);
        }
        .pay-method-btn .pay-icon { font-size: 1.25rem; }
        .kbd {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 4px 10px; border-radius: 6px;
          background: var(--bg-surface); border: 1px solid var(--border-highlight);
          box-shadow: 0 2px 0 var(--border-highlight);
          font-family: monospace; font-size: 0.875rem; font-weight: 700;
          color: var(--color-primary); white-space: nowrap;
        }
        .shortcut-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .shortcut-row:last-child { border-bottom: none; }
        .sim-ticket {
          font-family: 'Courier New', monospace; font-size: 12px;
          color: #000; background: #fff;
          padding: 16px; border-radius: var(--radius-md);
          width: 100%; max-width: 280px; margin: 0 auto;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeSlideIn 0.3s ease forwards; }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .check-pop { animation: checkPop 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} style={{ color: 'var(--color-primary)' }} /> Centro de Tutoriales
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Aprendé a usar cada función de Smart Caja paso a paso
          </p>
        </div>
      </div>

      <div className="app-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

        {/* ── Hero + Buscador ─────────────────────────────────────── */}
        <div className="tut-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="premium-badge" style={{ display: 'inline-flex' }}>
              📚 Guía completa de Smart Caja
            </div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              ¿Qué querés aprender hoy?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '520px' }}>
              Todos los módulos explicados paso a paso. Simulá una venta real sin afectar tus datos.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '480px' }}>
              <div className="form-input-icon" style={{ flex: 1 }}>
                <Search size={16} className="input-icon" style={{ left: '14px' }} />
                <input
                  className="form-input"
                  placeholder="Buscar: caja, CSV, atajo, fiado, cupón..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
              {searchTerm && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSearchTerm('')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Simulador de Venta ───────────────────────────────────── */}
        {!searchTerm && (
          <div className="card animate-in">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} style={{ color: 'var(--color-primary)' }} /> Simulador de Venta Interactivo
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Practicá sin afectar datos reales. Hacé clic en los productos para agregarlos.
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={resetSim}>
                <Trash2 size={14} /> Reiniciar
              </button>
            </div>
            <div className="card-body" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>

                {/* Columna izquierda: Catálogo + Carrito */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '10px' }}>
                      📦 Catálogo de ejemplo — clic para agregar
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {DEMO_PRODUCTS.map(p => (
                        <button key={p.id} className="sim-product-btn" onClick={() => addToSim(p)}>
                          <span className="emoji">{p.icon}</span>
                          <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{p.name}</span>
                          <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>{fmt(p.price)}{p.isWeight ? '/kg' : ''}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Carrito */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '10px' }}>
                      🛒 Carrito
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '80px' }}>
                      {simCart.length === 0 && (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                          Hacé clic en un producto ↑ para agregarlo
                        </div>
                      )}
                      {simCart.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>{item.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => setSimCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(i.isWeight ? 0.25 : 1, parseFloat((i.qty - (i.isWeight ? 0.25 : 1)).toFixed(3))) } : i))}
                              style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                            >
                              <Minus size={10} />
                            </button>
                            <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700 }}>{item.qty}{item.isWeight ? 'kg' : ''}</span>
                            <button
                              onClick={() => addToSim(item)}
                              style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <span style={{ color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.875rem', minWidth: '70px', textAlign: 'right' }}>
                            {fmt(item.price * item.qty)}
                          </span>
                          <button onClick={() => removeFromSim(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {simCart.length > 0 && (
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{fmt(simTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna derecha: Pago + Resultado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

                  {simStep !== 'receipt' ? (
                    <>
                      {/* Métodos de pago */}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '10px' }}>
                          💳 Método de pago
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '16px' }}>
                          {PAYMENT_METHODS.map(pm => (
                            <button key={pm.key} className={`pay-method-btn ${simPayment === pm.key ? 'active' : ''}`} onClick={() => setSimPayment(pm.key)}>
                              <span className="pay-icon">{pm.icon}</span>
                              {pm.label}
                            </button>
                          ))}
                        </div>

                        {/* Panel de pago según método */}
                        {simPayment === 'cash' && (
                          <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Efectivo recibido</label>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="0"
                              value={simCashInput}
                              onChange={e => setSimCashInput(e.target.value)}
                              style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}
                            />
                            {simCashInput && parseFloat(simCashInput) >= simTotal && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                                <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Vuelto:</span>
                                <span style={{ color: 'var(--color-secondary)', fontWeight: 800, fontSize: '1.125rem' }}>{fmt(simChange)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {(simPayment === 'debit' || simPayment === 'credit') && (
                          <div style={{ background: 'rgba(221,183,255,0.06)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(221,183,255,0.15)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>💳 Modo POSnet / Tarjeta</div>
                            <p>El sistema inicia la comunicación con el terminal POSnet. Cuando el cliente pasa la tarjeta, se registra automáticamente la marca (VISA, Mastercard, etc.) y el número de cupón.</p>
                            <p style={{ marginTop: '8px' }}>También podés ingresar el cupón manualmente si el lector no está disponible.</p>
                          </div>
                        )}
                        {simPayment === 'transfer' && (
                          <div style={{ background: 'rgba(96,165,250,0.06)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(96,165,250,0.15)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '8px' }}>🏦 Transferencia bancaria</div>
                            <p>El cliente transfiere el importe por CBU/CVU o alias. La venta queda registrada con método "Transferencia" para el arqueo del turno.</p>
                          </div>
                        )}
                        {simPayment === 'mixed' && (
                          <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-tertiary)', marginBottom: '4px' }}>🔀 Pago mixto</div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Efectivo</label>
                              <input type="number" className="form-input" placeholder="0" value={simMixedCash} onChange={e => setSimMixedCash(e.target.value)} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tarjeta / Mercado Pago</label>
                              <input type="number" className="form-input" placeholder="0" value={simMixedCard} onChange={e => setSimMixedCard(e.target.value)} />
                            </div>
                            {simMixedCash && simMixedCard && (
                              <div style={{ color: parseFloat(simMixedCash) + parseFloat(simMixedCard) >= simTotal ? 'var(--color-secondary)' : 'var(--color-error)', fontSize: '0.875rem', fontWeight: 600 }}>
                                Total cubierto: {fmt(parseFloat(simMixedCash || 0) + parseFloat(simMixedCard || 0))} de {fmt(simTotal)}
                              </div>
                            )}
                          </div>
                        )}
                        {simPayment === 'installment' && (
                          <div style={{ background: 'rgba(251,191,36,0.06)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(251,191,36,0.15)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>📋 Venta en fiado / cuotas</div>
                            <p>El sistema pide el nombre del cliente (o lo busca en la base de clientes). El monto se agrega automáticamente a la cuenta corriente del cliente y se crea un plan de cuotas si configuraste la cantidad.</p>
                            <p style={{ marginTop: '8px' }}>El saldo deudor del cliente se actualiza en tiempo real.</p>
                          </div>
                        )}
                      </div>

                      {/* Botón confirmar */}
                      {simCart.length > 0 && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
                          onClick={() => setSimStep('receipt')}
                        >
                          <CheckCircle size={18} /> Confirmar Venta (simulación)
                        </button>
                      )}
                    </>
                  ) : (
                    /* Ticket simulado */
                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div className="check-pop" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(78,222,163,0.15)', border: '2px solid rgba(78,222,163,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={32} style={{ color: 'var(--color-secondary)' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff' }}>¡Venta registrada! 🎉</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>Así se vería el ticket de impresión térmica (80mm)</div>
                      </div>
                      <div className="sim-ticket">
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>MI NEGOCIO</div>
                          <div style={{ fontSize: '10px', color: '#555' }}>Ticket de Venta</div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#ff3b30', border: '1px solid #ff3b30', padding: '1px 4px', display: 'inline-block', borderRadius: '2px', marginTop: '2px' }}>TICKET NO FISCAL</div>
                        </div>
                        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                          <div>Fecha: {new Date().toLocaleString('es-AR')}</div>
                          <div>Cajero: Cajero Demo</div>
                        </div>
                        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                        {simCart.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                            <span>{item.name} x{item.qty}</span>
                            <span>{fmt(item.price * item.qty)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                          <span>TOTAL:</span><span>{fmt(simTotal)}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                          Método: {PAYMENT_METHODS.find(p => p.key === simPayment)?.label}
                          {simPayment === 'cash' && simCashInput && <> | Vuelto: {fmt(simChange)}</>}
                        </div>
                        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                        <div style={{ textAlign: 'center', fontSize: '9px', color: '#777' }}>
                          ¡Gracias por su compra!<br />TICKET NO FISCAL
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button className="btn btn-ghost" style={{ flex: 1, gap: '6px' }} onClick={resetSim}>
                          <Trash2 size={14} /> Nueva venta
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, gap: '6px', color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' }}>
                          <Printer size={14} /> Imprimir (demo)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Manual por Módulos ───────────────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              📖 Manual por Módulo
            </span>
          </div>

          {/* Tabs de módulos */}
          <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', overflowX: 'auto', flexWrap: 'wrap' }}>
            {(searchTerm ? filteredModules : MODULES).map(m => (
              <button
                key={m.id}
                className={`module-tab ${activeModuleId === m.id && !searchTerm ? 'active' : ''}`}
                onClick={() => { setActiveModuleId(m.id); setSearchTerm('') }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Contenido del módulo activo o resultados de búsqueda */}
          <div className="card-body" style={{ padding: 'var(--space-6)' }}>
            {searchTerm ? (
              filteredModules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                  <div>No se encontraron resultados para <strong>"{searchTerm}"</strong></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  {filteredModules.map(m => (
                    <div key={m.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{m.label}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{m.description}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {m.steps.filter(s =>
                          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.body.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((step, si) => {
                          const key = `${m.id}-${si}`
                          return (
                            <div key={si} className="step-card">
                              <button className="step-trigger" onClick={() => toggleStep(key)}>
                                <span>{step.title}</span>
                                {expandedSteps[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                              {expandedSteps[key] && <div className="step-body">{step.body}</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="animate-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-6)' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    {activeModule.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff' }}>{activeModule.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>{activeModule.description}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeModule.steps.map((step, si) => {
                    const key = `${activeModule.id}-${si}`
                    return (
                      <div key={si} className="step-card">
                        <button className="step-trigger" onClick={() => toggleStep(key)}>
                          <span>{step.title}</span>
                          {expandedSteps[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        {expandedSteps[key] && <div className="step-body">{step.body}</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Atajos de teclado si corresponde */}
                {activeModule.shortcuts && (
                  <div style={{ marginTop: 'var(--space-6)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 700, color: '#fff' }}>
                      <Keyboard size={16} style={{ color: 'var(--color-primary)' }} /> Atajos de teclado rápidos
                    </div>
                    {activeModule.shortcuts.map((sc, i) => (
                      <div key={i} className="shortcut-row">
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sc.desc}</span>
                        <span className="kbd">{sc.key}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tarjeta de Atajos de Teclado ────────────────────────── */}
        {!searchTerm && (
          <div className="card animate-in">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={18} style={{ color: 'var(--color-primary)' }} /> Referencia Rápida de Atajos — Caja (POS)
              </span>
              <span className="badge badge-info">Solo en PC / escritorio</span>
            </div>
            <div className="card-body" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
                {[
                  { key: 'F2', desc: 'Seleccionar pago en Efectivo', color: 'var(--color-secondary)' },
                  { key: 'F3', desc: 'Seleccionar pago con Débito', color: 'var(--color-primary)' },
                  { key: 'F4', desc: 'Seleccionar pago con Crédito', color: 'var(--color-primary)' },
                  { key: 'F6', desc: 'Seleccionar Transferencia', color: '#60a5fa' },
                  { key: 'Enter / F12', desc: 'Confirmar y registrar la venta', color: 'var(--color-secondary)' },
                  { key: 'Esc', desc: 'Limpiar carrito / cerrar modal', color: 'var(--color-error)' },
                  { key: 'Cualquier tecla', desc: 'Foco automático en el buscador/escáner', color: 'var(--text-secondary)' },
                ].map((sc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span className="kbd" style={{ color: sc.color, borderColor: sc.color === 'var(--color-secondary)' ? 'rgba(78,222,163,0.4)' : undefined }}>{sc.key}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{sc.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: 'var(--color-primary)' }} /> Preguntas Frecuentes
            </span>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQS.filter(f =>
              !searchTerm ||
              f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
              f.a.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((faq, idx) => (
              <div key={idx} className="faq-item">
                <button className="faq-trigger" onClick={() => toggleFaq(idx)}>
                  <span style={{ flex: 1 }}>{faq.q}</span>
                  {expandedFaqs[idx] ? <ChevronDown size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </button>
                {expandedFaqs[idx] && <div className="faq-body">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Soporte ──────────────────────────────────────────────── */}
        {!searchTerm && (
          <div style={{ background: 'linear-gradient(135deg, rgba(78,222,163,0.08) 0%, rgba(221,183,255,0.06) 100%)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#fff', marginBottom: '4px' }}>¿Necesitás más ayuda?</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Nuestro equipo de soporte está disponible por WhatsApp para guiarte en tiempo real.
              </div>
            </div>
            <a
              href={`https://wa.me/543425162372?text=Hola%20Smart%20Caja!%20Tengo%20una%20consulta.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: '#25D366', color: '#fff', padding: '12px 24px', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '1.1rem' }}>📱</span> Contactar por WhatsApp
              <ArrowRight size={16} />
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
