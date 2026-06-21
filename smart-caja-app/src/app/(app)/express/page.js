'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { 
  Zap, Plus, Trash2, Edit2, ShoppingCart, User, Wrench,
  Search, ShieldAlert, CheckCircle, Printer, X, Sparkles,
  Award, Play, CreditCard, Landmark, Banknote
} from 'lucide-react'

const DEFAULT_QUICK_ACTIONS = [
  { id: 'qa1', label: 'Lavado Simple', icon: '🧼', price: 4500, color: '#ddb7ff' },
  { id: 'qa2', label: 'Lavado Completo', icon: '✨', price: 6500, color: '#4edea3' },
  { id: 'qa3', label: 'Alineación', icon: '⚖️', price: 5000, color: '#ffb2b7' },
  { id: 'qa4', label: 'Balanceo (x rueda)', icon: '🌀', price: 1500, color: '#ddb7ff' },
  { id: 'qa5', label: 'Parche Auto/Camioneta', icon: '🔧', price: 3500, color: '#4edea3' },
  { id: 'qa6', label: 'Cambio de Aceite MO', icon: '🛢️', price: 3000, color: '#ffb2b7' }
]

export default function ExpressPage() {
  const { tenant, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()

  const [activeShift, setActiveShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [operators, setOperators] = useState([]) // Profiles with role 'mechanic' or others

  // Cart state
  const [cart, setCart] = useState([])
  const [manualDiscount, setManualDiscount] = useState(0)

  // Modals and config state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Custom button creation
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configAction, setConfigAction] = useState(null)
  const [actionLabel, setActionLabel] = useState('')
  const [actionPrice, setActionPrice] = useState('')
  const [actionIcon, setActionIcon] = useState('🛠️')

  // Search variables
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Checkout inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [selectedOperatorIds, setSelectedOperatorIds] = useState([])

  // Combined payment details
  const [combinedCash, setCombinedCash] = useState('')
  const [combinedDebit, setCombinedDebit] = useState('')
  const [combinedCredit, setCombinedCredit] = useState('')

  // Receipt printable state
  const [receiptData, setReceiptData] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)

  const isGated = tenant?.subscription_plan === 'basic'

  // Load custom actions from localStorage
  const [quickActions, setQuickActions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartcaja_quick_actions')
      return saved ? JSON.parse(saved) : DEFAULT_QUICK_ACTIONS
    }
    return DEFAULT_QUICK_ACTIONS
  })

  // Load initial data
  const loadData = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      // 1. Fetch active shift
      const { data: shiftData } = await supabase
        .from('shifts')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'open')
        .eq('user_id', profile.id)
        .maybeSingle()
      setActiveShift(shiftData)

      // 2. Fetch products
      const { data: prods } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      setProducts(prods || [])

      // 3. Fetch customers
      const { data: custs } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      setCustomers(custs || [])

      // 4. Fetch vehicles
      const { data: vehs } = await supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tenant.id)
      setVehicles(vehs || [])

      // 5. Fetch operators/mechanics
      const { data: ops } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
      setOperators(ops || [])

    } catch (err) {
      console.error('[loadData]', err)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, profile?.id, supabase])

  useEffect(() => {
    if (tenant?.id && !isGated) {
      loadData()
    }
  }, [tenant?.id, isGated, loadData])

  // Save quick actions to localstorage when they change
  const saveQuickActions = (actions) => {
    setQuickActions(actions)
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartcaja_quick_actions', JSON.stringify(actions))
    }
  }

  // Cart operations
  const addToCart = (item, isProduct = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing && isProduct) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price } : i)
      }
      return [...prev, {
        id: item.id,
        label: item.label || item.name,
        price: parseFloat(item.price || item.sale_price) || 0,
        cost: parseFloat(item.cost || item.cost_price) || 0,
        qty: 1,
        is_labor: !isProduct,
        product_id: isProduct ? item.id : null,
        icon: item.icon || '📦',
        subtotal: parseFloat(item.price || item.sale_price) || 0
      }]
    })
    toast.success(`"${item.label || item.name}" agregado`)
  }

  const updateCartQty = (id, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id))
      return
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: newQty, subtotal: newQty * i.price } : i))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  // Calculate totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = (cartSubtotal * manualDiscount) / 100
  const cartTotal = Math.max(0, cartSubtotal - discountAmount)

  // Autocomplete products
  const filteredProducts = products.filter(p => {
    if (!productSearch) return false
    const term = productSearch.toLowerCase()
    return p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term))
  }).slice(0, 5)

  // Autocomplete vehicles for customer
  const customerVehicles = vehicles.filter(v => v.client_id === selectedCustomerId)

  // Configure action buttons
  const handleSaveAction = (e) => {
    e.preventDefault()
    if (!actionLabel.trim()) return toast.error('Ingresá una etiqueta')
    const priceNum = parseFloat(actionPrice) || 0

    if (configAction) {
      // Edit mode
      const updated = quickActions.map(a => a.id === configAction.id ? { ...a, label: actionLabel.trim(), price: priceNum, icon: actionIcon } : a)
      saveQuickActions(updated)
      toast.success('Botón actualizado')
    } else {
      // Add mode
      const newAction = {
        id: `qa-${Date.now()}`,
        label: actionLabel.trim(),
        price: priceNum,
        icon: actionIcon,
        color: '#ddb7ff'
      }
      saveQuickActions([...quickActions, newAction])
      toast.success('Botón agregado')
    }
    setShowConfigModal(false)
    setConfigAction(null)
    setActionLabel('')
    setActionPrice('')
    setActionIcon('🛠️')
  }

  const handleDeleteAction = (id) => {
    if (window.confirm('¿Seguro que querés eliminar este botón de servicio rápido?')) {
      const updated = quickActions.filter(a => a.id !== id)
      saveQuickActions(updated)
      toast.success('Botón eliminado')
    }
  }

  // Handle Checkout / Process sale
  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!activeShift) return toast.error('Debes abrir un turno de caja primero')
    if (cart.length === 0) return

    // Validate combined amounts
    if (paymentMethod === 'combined') {
      const c = parseFloat(combinedCash) || 0
      const d = parseFloat(combinedDebit) || 0
      const m = parseFloat(combinedCredit) || 0
      const totalPaid = c + d + m
      if (Math.abs(totalPaid - cartTotal) > 0.01 && totalPaid < cartTotal) {
        toast.error(`Los montos ingresados (${formatCurrency(totalPaid)}) no cubren el total (${formatCurrency(cartTotal)})`)
        return
      }
    }

    setIsProcessing(true)
    try {
      // 1. Insert daily_quick_service record
      const labels = cart.map(i => `${i.label} (x${i.qty})`).join(', ')
      const { data: quickServ, error: qsError } = await supabase
        .from('daily_quick_services')
        .insert({
          tenant_id: tenant.id,
          service_type: labels,
          price: cartTotal,
          employee_id: selectedOperatorIds[0] || null, // Guardamos al primer operario seleccionado como principal
          client_id: selectedCustomerId || null,
          vehicle_id: selectedVehicleId || null
        })
        .select()
        .single()
      if (qsError) throw qsError

      // 2. Insert employee commissions if operators are selected
      if (selectedOperatorIds.length > 0) {
        const laborItems = cart.filter(i => i.is_labor)
        const totalLaborCost = laborItems.reduce((sum, i) => sum + i.subtotal, 0)
        const dividedLabor = totalLaborCost / selectedOperatorIds.length

        for (const opId of selectedOperatorIds) {
          const opProfile = operators.find(o => o.id === opId)
          const rate = opProfile ? parseFloat(opProfile.commission_rate || 0) : 0
          const earned = dividedLabor * (rate / 100)

          if (earned > 0) {
            await supabase
              .from('employee_earnings')
              .insert({
                tenant_id: tenant.id,
                employee_id: opId,
                quick_service_id: quickServ.id,
                amount_earned: earned,
                description: `Comisión Servicio Rápido: ${labels}`
              })
          }
        }
      }

      // 3. Deduct stock for inventory products in cart
      for (const item of cart) {
        if (item.product_id) {
          // Standard stock deduction using products table
          const prod = products.find(p => p.id === item.product_id)
          if (prod && prod.control_stock !== false) {
            const { error: stockError } = await supabase
              .from('products')
              .update({ stock_quantity: (parseFloat(prod.stock_quantity) || 0) - item.qty })
              .eq('id', item.product_id)
            if (stockError) throw stockError

            // Record stock movement
            await supabase
              .from('stock_movements')
              .insert({
                tenant_id: tenant.id,
                product_id: item.product_id,
                type: 'sale',
                quantity_change: -item.qty,
                stock_before: parseFloat(prod.stock_quantity) || 0,
                stock_after: (parseFloat(prod.stock_quantity) || 0) - item.qty,
                notes: `Venta Servicio Rápido #${quickServ.id.substring(0, 8)}`,
                user_id: profile.id
              })
          }
        }
      }

      // 4. Generate sequential ticket number
      const { data: ticketNum } = await supabase.rpc('generate_ticket_number', { p_tenant_id: tenant.id })
      const ticketNumber = ticketNum || Math.random().toString(36).substring(2, 10).toUpperCase()

      // 5. Create sale in public.sales
      const details = {
        quick_service_id: quickServ.id,
        operator_ids: selectedOperatorIds,
        discount_percentage: manualDiscount
      }
      if (paymentMethod === 'combined') {
        details.combined = {
          cash: parseFloat(combinedCash) || 0,
          debit: parseFloat(combinedDebit) || 0,
          credit: parseFloat(combinedCredit) || 0
        }
      }

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: tenant.id,
          user_id: profile.id,
          shift_id: activeShift.id,
          ticket_number: ticketNumber,
          subtotal: cartSubtotal,
          discount_type: manualDiscount > 0 ? 'percentage' : null,
          discount_value: manualDiscount || 0,
          discount_amount: discountAmount,
          total: cartTotal,
          payment_method: paymentMethod,
          payment_details: details,
          source: 'quick_service',
          quick_service_id: quickServ.id,
          customer_id: selectedCustomerId || null
        })
        .select()
        .single()
      if (saleError) throw saleError

      // 6. Insert sale items
      const saleItemsToInsert = cart.map(i => ({
        tenant_id: tenant.id,
        sale_id: saleData.id,
        product_id: i.product_id || null,
        product_name: i.label,
        quantity: i.qty,
        unit_price: i.price,
        cost_price: i.cost,
        subtotal: i.subtotal,
        discount_amount: 0
      }))
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsToInsert)
      if (itemsError) throw itemsError

      // 7. Update customer balance if payment is installment (fiado)
      if (paymentMethod === 'installment' && selectedCustomerId) {
        const cust = customers.find(c => c.id === selectedCustomerId)
        const currentBal = parseFloat(cust?.balance || 0)
        await supabase
          .from('customers')
          .update({ balance: currentBal + cartTotal })
          .eq('id', selectedCustomerId)
      }

      toast.success('Cobro procesado con éxito')
      
      // Save receipt data for modal/print
      setReceiptData({
        ticket_number: ticketNumber,
        subtotal: cartSubtotal,
        discount: discountAmount,
        total: cartTotal,
        payment_method: paymentMethod,
        operator: selectedOperatorIds.map(id => operators.find(o => o.id === id)?.full_name).filter(Boolean).join(', ') || 'N/A',
        customer: customers.find(c => c.id === selectedCustomerId)?.name || 'Consumidor Final',
        vehicle: vehicles.find(v => v.id === selectedVehicleId)?.license_plate || 'N/A'
      })
      setShowReceipt(true)

      // Reset cart and modals
      setCart([])
      setManualDiscount(0)
      setSelectedCustomerId('')
      setSelectedVehicleId('')
      setSelectedOperatorIds([])
      setPaymentMethod('cash')
      setCombinedCash('')
      setCombinedDebit('')
      setCombinedCredit('')
      setShowCheckoutModal(false)
      loadData()

    } catch (err) {
      toast.error('Error al cobrar: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Thermal printing helper
  const printReceipt = () => {
    if (!receiptData) return
    const printWindow = window.open('', '_blank', 'width=320,height=500')
    const now = new Date()
    printWindow.document.write(`
      <html><head><title>Ticket #${receiptData.ticket_number}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; margin: 0; font-size: 12px; color: #000; }
        .line { border-top: 1px dashed #000; margin: 10px 0; }
        h2 { margin: 5px 0; font-size: 16px; text-transform: uppercase; }
        .price { font-size: 20px; font-weight: bold; margin: 8px 0; }
        .flex { display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { border-bottom: 1px solid #000; padding: 4px 0; }
        td { padding: 4px 0; }
      </style></head>
      <body>
        <h2>${tenant?.name || 'SMART CAJA'}</h2>
        <p>${tenant?.address || ''}<br/>Tel: ${tenant?.phone || ''}</p>
        <div class="line"></div>
        <p><strong>TICKET DE COMPRA</strong></p>
        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Detalle</th>
              <th style="text-align:center;">Cant</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(i => `
              <tr>
                <td style="text-align:left;">${i.label}</td>
                <td style="text-align:center;">${i.qty}</td>
                <td style="text-align:right;">${formatCurrency(i.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="line"></div>
        ${receiptData.discount > 0 ? `<div class="flex"><span>Subtotal:</span><span>${formatCurrency(receiptData.subtotal)}</span></div>` : ''}
        ${receiptData.discount > 0 ? `<div class="flex"><span>Descuento:</span><span>-${formatCurrency(receiptData.discount)}</span></div>` : ''}
        <div class="flex" style="font-weight:bold;font-size:14px;margin-top:4px;">
          <span>TOTAL:</span>
          <span>${formatCurrency(receiptData.total)}</span>
        </div>
        <div class="line"></div>
        <div class="flex"><span>Pago:</span><span>${receiptData.payment_method.toUpperCase()}</span></div>
        <div class="flex"><span>Vehículo:</span><span>${receiptData.vehicle}</span></div>
        <div class="flex"><span>Operario:</span><span>${receiptData.operator}</span></div>
        <div class="line"></div>
        <p>Nro Ticket: ${receiptData.ticket_number}</p>
        <p>${formatDateTime(now)}</p>
        <div class="line"></div>
        <p style="font-size:10px;">¡Gracias por su visita!</p>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300)
  }

  if (isGated) {
    return (
      <UpgradePrompt 
        title="Registro Express de Servicios"
        description="Fideliza a tus clientes con tickets rápidos, comisiones inmediatas para operarios y registro de caja optimizado para gomerías y lavaderos."
        requiredPlan="professional"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={24} style={{ color: 'var(--color-primary)' }} />
            Servicio Rápido / Registro Express
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Elegí tarjetas de servicio, busca productos del inventario y procesa cobros inmediatos asignando comisiones.
          </p>
        </div>

        {/* Status turn warning */}
        {!activeShift && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
            <ShieldAlert size={18} />
            Atención: Debes abrir un turno en la sección Caja para poder registrar ventas.
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Quick Service Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            
            {/* Tool bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Módulo Gomería, Lavado y MO Express</div>
              <button 
                onClick={() => {
                  setConfigAction(null)
                  setActionLabel('')
                  setActionPrice('')
                  setActionIcon('🛠️')
                  setShowConfigModal(true)
                }}
                className="btn btn-ghost btn-sm"
                style={{ borderStyle: 'dashed' }}
              >
                ➕ Agregar Botón de Servicio
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {quickActions.map(action => (
                <div 
                  key={action.id}
                  onClick={() => addToCart(action, false)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px',
                    padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary-border)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Actions buttons absolute */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfigAction(action)
                        setActionLabel(action.label)
                        setActionPrice(action.price.toString())
                        setActionIcon(action.icon)
                        setShowConfigModal(true)
                      }}
                      style={{ color: 'var(--text-muted)' }}
                      title="Editar botón"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAction(action.id)
                      }}
                      style={{ color: 'var(--color-error)' }}
                      title="Eliminar botón"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <span style={{ fontSize: '2rem', marginBottom: '4px' }}>{action.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: '1.2' }}>
                    {action.label}
                  </span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {action.price > 0 ? formatCurrency(action.price) : 'Gratis'}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Cart and Checkout Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Cart Card */}
          <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingCart size={16} /> Carrito Express
              </span>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} style={{ color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 600 }}>
                  Vaciar
                </button>
              )}
            </div>

            {/* Product fast search bar */}
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                placeholder="🔎 Agregar repuesto/producto..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setShowProductDropdown(true)
                }}
                onFocus={() => setShowProductDropdown(true)}
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.875rem' }}
              />
              {showProductDropdown && productSearch && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px',
                  marginTop: '4px', zIndex: 100, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        addToCart(p, true)
                        setProductSearch('')
                        setShowProductDropdown(false)
                      }}
                      style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
                      className="autocomplete-option"
                    >
                      <span style={{ color: '#fff', fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(p.sale_price)}</span>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>Sin coincidencias</div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '180px', maxHeight: '300px', overflowY: 'auto' }}>
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.id} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatCurrency(item.price)} c/u
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <button type="button" onClick={() => updateCartQty(item.id, item.qty - 1)} style={{ padding: '2px 8px', color: 'var(--text-secondary)' }}>-</button>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, width: '20px', textAlign: 'center', color: '#fff' }}>{item.qty}</span>
                        <button type="button" onClick={() => updateCartQty(item.id, item.qty + 1)} style={{ padding: '2px 8px', color: 'var(--text-secondary)' }}>+</button>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', width: '70px', textAlign: 'right' }}>
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flex: 1, gap: '8px' }}>
                  <ShoppingCart size={32} style={{ opacity: 0.15 }} />
                  <span style={{ fontSize: '0.8125rem' }}>Carrito vacío</span>
                </div>
              )}
            </div>

            {/* Totales */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Descuento (%):</span>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={{ width: '60px', padding: '4px', textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8125rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyBetween: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                  <span>TOTAL:</span>
                  <span style={{ color: 'var(--color-secondary)' }}>{formatCurrency(cartTotal)}</span>
                </div>

                <button
                  onClick={() => {
                    // Preselect current cashier as operator if not selected
                    setSelectedOperatorIds([profile.id])
                    setShowCheckoutModal(true)
                  }}
                  disabled={!activeShift}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '8px', fontWeight: 700 }}
                >
                  Confirmar y Cobrar
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL: Configurar Botón (Crear / Editar) */}
      {showConfigModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowConfigModal(false)}>
          <form 
            onSubmit={handleSaveAction}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '400px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              {configAction ? '✏️ Editar Botón de Servicio' : '➕ Crear Botón de Servicio'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Etiqueta / Nombre *</label>
              <input 
                className="form-input" 
                required 
                placeholder="Ej. Parche Moto" 
                value={actionLabel} 
                onChange={e => setActionLabel(e.target.value)} 
                style={{ background: 'var(--bg-surface)' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Precio Sugerido ($) *</label>
                <input 
                  className="form-input" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="Ej. 2500" 
                  value={actionPrice} 
                  onChange={e => setActionPrice(e.target.value)} 
                  style={{ background: 'var(--bg-surface)' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Icono / Emoji *</label>
                <input 
                  className="form-input" 
                  required 
                  placeholder="Ej. 🔧, 🧼, 🌀" 
                  value={actionIcon} 
                  onChange={e => setActionIcon(e.target.value)} 
                  style={{ background: 'var(--bg-surface)', textAlign: 'center' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                Guardar Botón
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Cobrar Servicio (Checkout) */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowCheckoutModal(false)}>
          <form 
            onSubmit={handleCheckout}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '500px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--color-secondary)' }} />
                Finalizar Venta de Servicio Express
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>Completa los datos del cliente, operarios asignados y método de cobro.</p>
            </div>

            {/* Total Display */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Monto Final a Cobrar:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-secondary)' }}>{formatCurrency(cartTotal)}</span>
            </div>

            {/* Cliente (opcional) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cliente (Opcional)</label>
                <select 
                  className="form-select" 
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value)
                    setSelectedVehicleId('')
                  }}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Vehículo (opcional) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vehículo (Opcional)</label>
                <select 
                  className="form-select" 
                  value={selectedVehicleId}
                  disabled={!selectedCustomerId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="">Seleccionar...</option>
                  {customerVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.license_plate} ({v.brand} {v.model})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Operarios / Profesionales comisiones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Asignar Operarios (Comisiones)</label>
              <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', 
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px'
              }}>
                {operators.map(op => (
                  <label key={op.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem', color: selectedOperatorIds.includes(op.id) ? '#fff' : 'var(--text-secondary)', fontWeight: selectedOperatorIds.includes(op.id) ? 600 : 500 }}>
                    <input 
                      type="checkbox"
                      checked={selectedOperatorIds.includes(op.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOperatorIds(prev => [...prev, op.id])
                        } else {
                          setSelectedOperatorIds(prev => prev.filter(id => id !== op.id))
                        }
                      }}
                    />
                    {op.full_name} ({op.commission_rate || 0}%)
                  </label>
                ))}
              </div>
            </div>

            {/* Metodo de Pago */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { key: 'cash', label: 'Efectivo', icon: Banknote },
                  { key: 'debit', label: 'Débito', icon: CreditCard },
                  { key: 'credit', label: 'Crédito', icon: CreditCard },
                  { key: 'combined', label: 'Combinado', icon: Zap },
                  { key: 'installment', label: 'Fiado', icon: Award }
                ].map(m => {
                  const IconComp = m.icon
                  const isSel = paymentMethod === m.key
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', gap: '6px',
                        padding: '10px 6px', background: isSel ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                        border: `1px solid ${isSel ? 'var(--color-primary)' : 'var(--border-color)'}`, borderRadius: '8px',
                        cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.6875rem', color: isSel ? '#fff' : 'var(--text-secondary)'
                      }}
                    >
                      <IconComp size={16} style={{ color: isSel ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Combined Pay inputs */}
            {paymentMethod === 'combined' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Distribución de importes:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Efectivo ($)</label>
                    <input className="form-input" type="number" placeholder="0" value={combinedCash} onChange={e => setCombinedCash(e.target.value)} style={{ background: 'var(--bg-card)', padding: '6px 8px', fontSize: '0.8125rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Débito ($)</label>
                    <input className="form-input" type="number" placeholder="0" value={combinedDebit} onChange={e => setCombinedDebit(e.target.value)} style={{ background: 'var(--bg-card)', padding: '6px 8px', fontSize: '0.8125rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Crédito ($)</label>
                    <input className="form-input" type="number" placeholder="0" value={combinedCredit} onChange={e => setCombinedCredit(e.target.value)} style={{ background: 'var(--bg-card)', padding: '6px 8px', fontSize: '0.8125rem' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Installment Warning */}
            {paymentMethod === 'installment' && (
              <div style={{ background: 'rgba(255, 178, 183, 0.08)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span>La venta se registrará al Fiado/Cuenta Corriente del cliente seleccionado.</span>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600, background: 'var(--color-secondary)' }}
              >
                {isProcessing ? 'Procesando...' : 'Confirmar Cobro'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: Comprobante de Cobro */}
      {showReceipt && receiptData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            maxWidth: '400px', width: '100%', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyCenter: 'center', marginBottom: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(78, 222, 163, 0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--color-secondary)', margin: '0 auto' }}>
                <CheckCircle size={28} />
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>¡Cobro Registrado con éxito!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '-8px' }}>Se emitió la venta bajo el Ticket #{receiptData.ticket_number}</p>

            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{receiptData.customer}</span>
              </div>
              <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehículo:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{receiptData.vehicle}</span>
              </div>
              <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Metodo:</span>
                <span style={{ fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>{receiptData.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyBetween: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '1rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Monto Cobrado:</span>
                <span style={{ color: 'var(--color-secondary)' }}>{formatCurrency(receiptData.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setShowReceipt(false)}
                className="btn btn-ghost"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                Cerrar
              </button>
              <button
                onClick={printReceipt}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Imprimir Ticket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
