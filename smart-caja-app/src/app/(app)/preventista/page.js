'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDatabaseError } from '@/lib/utils/formatters'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import {
  Search, ShoppingCart, User, Calendar, DollarSign,
  Plus, Minus, Trash2, CheckCircle2, ChevronRight,
  ClipboardList, Smartphone, Clock, X, MapPin, Phone,
  Truck, Store, FileText, ArrowRight, Check, AlertCircle, Share2
} from 'lucide-react'

export default function PreventistaPage() {
  const { tenant, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()

  // App data states
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Preventista active cart
  const [cart, setCart] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customCustomerName, setCustomCustomerName] = useState('')
  const [customCustomerPhone, setCustomCustomerPhone] = useState('')

  // UI state controls
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showOrdersHistory, setShowOrdersHistory] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [savingOrder, setSavingOrder] = useState(false)
  const [lastSavedOrder, setLastSavedOrder] = useState(null)

  // Order details
  const [deliveryDate, setDeliveryDate] = useState('')
  const [advancePayment, setAdvancePayment] = useState('')
  const [deliveryMode, setDeliveryMode] = useState('delivery') // 'delivery' | 'pickup'
  const [orderNotes, setOrderNotes] = useState('')
  const [address, setAddress] = useState('')

  // Load catalog and customers
  const loadData = useCallback(async () => {
    if (!tenant?.id || !profile?.id) return
    setLoading(true)
    try {
      // 1. Fetch products
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('*, categories(id, name, icon)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (prodsErr) throw prodsErr
      setProducts(prods || [])

      // 2. Fetch customers
      const { data: custs, error: custsErr } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (custsErr) throw custsErr
      setCustomers(custs || [])

      // 3. Fetch today's orders taken by this preventista
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: orders, error: ordersErr } = await supabase
        .from('online_orders')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('user_id', profile.id)
        .eq('source', 'preventista')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr
      setRecentOrders(orders || [])

    } catch (e) {
      console.error('[loadData preventista]', e)
      toast.error('Error al cargar datos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, tenant, profile, toast])

  useEffect(() => {
    if (tenant?.id && profile?.id) {
      loadData()
    }
  }, [tenant?.id, profile?.id, loadData])

  // Get categories from products list
  const categories = useMemo(() => {
    const list = []
    products.forEach(p => {
      if (p.categories && !list.some(c => c.id === p.categories.id)) {
        list.push(p.categories)
      }
    })
    return list
  }, [products])

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm) ||
                          p.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory
      return matchSearch && matchCategory
    })
  }, [products, searchTerm, selectedCategory])

  // Selected customer object
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null
    return customers.find(c => c.id === selectedCustomerId) || null
  }, [customers, selectedCustomerId])

  // Filtered customer list in modal
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers
    const term = customerSearchTerm.toLowerCase()
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.phone && c.phone.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    )
  }, [customers, customerSearchTerm])

  // Cart helper functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (product.control_stock !== false && product.stock_quantity !== null && existing.qty >= product.stock_quantity) {
          toast.warning(`Superaste el stock disponible de ${product.name}`)
          return prev
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      } else {
        if (product.control_stock !== false && product.stock_quantity !== null && product.stock_quantity <= 0) {
          toast.warning(`${product.name} no tiene stock disponible`)
          return prev
        }
        return [...prev, {
          id: product.id,
          name: product.name,
          qty: 1,
          sale_price: product.sale_price,
          stock_quantity: product.stock_quantity,
          control_stock: product.control_stock,
          image_url: product.image_url
        }]
      }
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateCartQty = (productId, amount) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.qty + amount
          if (newQty <= 0) return null
          if (item.control_stock !== false && item.stock_quantity !== null && newQty > item.stock_quantity) {
            toast.warning(`Superaste el stock disponible de ${item.name}`)
            return item
          }
          return { ...item, qty: newQty }
        }
        return item
      }).filter(Boolean)
    })
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.sale_price * item.qty), 0)
  }, [cart])

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0)
  }, [cart])

  const todayOrdersTotal = useMemo(() => {
    return recentOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0)
  }, [recentOrders])

  // Get current active stock of a product (original minus cart quantity)
  const getAvailableStock = (product) => {
    if (product.control_stock === false) return '∞'
    const inCart = cart.find(item => item.id === product.id)
    const qtyInCart = inCart ? inCart.qty : 0
    return product.stock_quantity !== null ? Math.max(0, product.stock_quantity - qtyInCart) : '∞'
  }

  // Handle saving the order
  const handleSaveOrder = async () => {
    let finalCustomerName = ''
    let finalCustomerPhone = ''

    if (selectedCustomerId) {
      const selected = customers.find(c => c.id === selectedCustomerId)
      finalCustomerName = selected?.name || 'Cliente Registrado'
      finalCustomerPhone = selected?.phone || ''
    } else {
      finalCustomerName = customCustomerName.trim()
      finalCustomerPhone = customCustomerPhone.trim()
    }

    if (!finalCustomerName) {
      toast.error('Por favor, selecciona o ingresa el nombre del cliente primero')
      setShowConfirmModal(false)
      setShowCustomerModal(true)
      return
    }

    if (cart.length === 0) {
      toast.error('El pedido no tiene productos')
      return
    }

    setSavingOrder(true)
    try {
      const total = cartTotal
      const advance = parseFloat(advancePayment) || 0

      // Get count for order sequence
      const { count, error: countErr } = await supabase
        .from('online_orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      if (countErr) throw countErr

      const orderNumber = `PREV-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: orderData, error: orderErr } = await supabase
        .from('online_orders')
        .insert({
          tenant_id: tenant.id,
          user_id: profile.id,
          order_number: orderNumber,
          customer_name: finalCustomerName,
          customer_phone: finalCustomerPhone || null,
          customer_address: deliveryMode === 'delivery' ? address.trim() || null : null,
          delivery_mode: deliveryMode,
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            qty: item.qty,
            unit_price: item.sale_price,
            subtotal: item.sale_price * item.qty
          })),
          subtotal: total,
          total: total,
          notes: orderNotes.trim() || null,
          status: 'pending',
          payment_status: advance > 0 ? 'partial' : 'unpaid',
          source: 'preventista',
          delivery_date: deliveryDate || null,
          advance_payment: advance
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      toast.success(`¡Pedido ${orderNumber} guardado con éxito!`)

      // Set last saved order for WhatsApp sharing modal
      setLastSavedOrder({
        orderNumber,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        total,
        advance,
        deliveryDate,
        deliveryMode,
        items: [...cart]
      })
      
      // Local stock update so they see changes immediately
      setProducts(prev => prev.map(p => {
        const item = cart.find(c => c.id === p.id)
        if (item && p.stock_quantity !== null) {
          return { ...p, stock_quantity: Math.max(0, p.stock_quantity - item.qty) }
        }
        return p
      }))

      // Reset forms
      setCart([])
      setSelectedCustomerId('')
      setCustomCustomerName('')
      setCustomCustomerPhone('')
      setDeliveryDate('')
      setAdvancePayment('')
      setOrderNotes('')
      setAddress('')
      
      setShowConfirmModal(false)
      setShowCartDrawer(false)
      
      // Reload orders
      loadData()

    } catch (e) {
      console.error('[handleSaveOrder]', e)
      toast.error(formatDatabaseError(e, 'Error al guardar el pedido'))
    } finally {
      setSavingOrder(false)
    }
  }

  // Cancel order taken today
  const handleCancelOrder = async (orderId, orderNumber) => {
    if (!confirm(`¿Estás seguro de cancelar el pedido #${orderNumber}?`)) return
    try {
      const { error } = await supabase
        .from('online_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

      if (error) throw error
      toast.info(`Pedido #${orderNumber} cancelado`)
      loadData()
    } catch (e) {
      toast.error(formatDatabaseError(e, 'Error al cancelar el pedido'))
    }
  }

  if (loading && products.length === 0) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-muted)'
      }}>
        <div className="spinner" style={{ marginBottom: '16px' }}></div>
        Cargando catálogo preventista...
      </div>
    )
  }

  if (tenant?.subscription_plan === 'basic') {
    return (
      <UpgradePrompt
        title="Módulo de Preventistas"
        description="Ideal para personal en la calle. Accede al catálogo offline con stock actualizado, carga pedidos de clientes y sincronízalos al instante sin necesidad de abrir caja física."
        requiredPlan="professional"
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-base, #070D18)', 
      paddingBottom: cartCount > 0 ? '90px' : '30px', 
      position: 'relative',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>

      {/* ========================================================
          1. TOP APP BAR (Ultra-clean mobile header)
         ======================================================== */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(11, 19, 35, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(0, 229, 155, 0.12)',
            border: '1px solid rgba(0, 229, 155, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary, #00e59b)'
          }}>
            <Smartphone size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                Preventa
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(0, 229, 155, 0.15)',
                color: 'var(--color-primary, #00e59b)',
                border: '1px solid rgba(0, 229, 155, 0.3)'
              }}>
                MÓVIL
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {profile?.full_name || 'Vendedor en calle'}
            </span>
          </div>
        </div>

        {/* Today's orders toggle pill */}
        <button
          onClick={() => setShowOrdersHistory(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '100px',
            background: recentOrders.length > 0 ? 'rgba(45, 212, 191, 0.1)' : 'rgba(255,255,255,0.05)',
            border: recentOrders.length > 0 ? '1px solid rgba(45, 212, 191, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: recentOrders.length > 0 ? '#2DD4BF' : 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ClipboardList size={14} />
          <span>Hoy: {recentOrders.length}</span>
        </button>
      </header>

      {/* ========================================================
          2. FAST CUSTOMER SELECTOR (Card grande y táctil)
         ======================================================== */}
      <section style={{ padding: '12px 16px 6px 16px' }}>
        {currentCustomer || customCustomerName ? (
          // Active customer card
          <div style={{
            background: 'linear-gradient(145deg, rgba(15, 26, 46, 0.9), rgba(10, 18, 32, 0.9))',
            border: '1px solid rgba(0, 229, 155, 0.35)',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0, 229, 155, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(0, 229, 155, 0.15)',
                color: 'var(--color-primary, #00e59b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <User size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary, #00e59b)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cliente Seleccionado
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentCustomer ? currentCustomer.name : customCustomerName}
                </div>
                {(currentCustomer?.phone || customCustomerPhone) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tel: {currentCustomer?.phone || customCustomerPhone}
                  </div>
                )}
                {currentCustomer?.account_balance > 0 && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F87171', marginTop: '2px' }}>
                    Debe en Cta. Cte.: {formatCurrency(currentCustomer.account_balance)}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowCustomerModal(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Cambiar
            </button>
          </div>
        ) : (
          // Empty customer prompt (High visibility button)
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(145deg, rgba(16, 28, 50, 0.95), rgba(11, 19, 35, 0.95))',
              border: '1.5px dashed rgba(0, 229, 155, 0.4)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(0, 229, 155, 0.1)',
                color: 'var(--color-primary, #00e59b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                  Seleccionar Cliente del Pedido
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tocá aquí para elegir un cliente o ingresar uno rápido
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-primary, #00e59b)" />
          </button>
        )}
      </section>

      {/* ========================================================
          3. SEARCH & CATEGORIES (Búsqueda veloz para la calle)
         ======================================================== */}
      <section style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar producto por nombre o código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px',
              paddingRight: searchTerm ? '40px' : '14px',
              height: '46px',
              fontSize: '0.9rem',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute', right: '12px', top: '12px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category horizontal scroll slider */}
        {categories.length > 0 && (
          <div style={{
            display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px',
            scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch'
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '100px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                border: selectedCategory === 'all' ? '1px solid var(--color-primary, #00e59b)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                background: selectedCategory === 'all' ? 'rgba(0, 229, 155, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                color: selectedCategory === 'all' ? 'var(--color-primary, #00e59b)' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              Todos ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: '100px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  border: selectedCategory === cat.id ? '1px solid var(--color-primary, #00e59b)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  background: selectedCategory === cat.id ? 'rgba(0, 229, 155, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                  color: selectedCategory === cat.id ? 'var(--color-primary, #00e59b)' : 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================
          4. PRODUCT CARDS (Diseñadas para dedos en movimiento)
         ======================================================== */}
      <main style={{ flex: 1, padding: '6px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--text-muted)',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.08)'
          }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>No se encontraron productos</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Probá cambiando la categoría o el término de búsqueda.</p>
          </div>
        ) : (
          filteredProducts.map(prod => {
            const availStock = getAvailableStock(prod)
            const itemInCart = cart.find(item => item.id === prod.id)
            const count = itemInCart ? itemInCart.qty : 0
            const isOutOfStock = prod.control_stock !== false && prod.stock_quantity !== null && prod.stock_quantity <= 0

            return (
              <div
                key={prod.id}
                style={{
                  background: count > 0 
                    ? 'linear-gradient(145deg, rgba(16, 32, 54, 0.95), rgba(11, 22, 38, 0.95))' 
                    : 'rgba(14, 22, 38, 0.85)',
                  border: count > 0 
                    ? '1.5px solid rgba(0, 229, 155, 0.5)' 
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: count > 0 ? '0 4px 16px rgba(0, 229, 155, 0.12)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {/* Left product details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: 'rgba(0, 229, 155, 0.08)',
                      border: '1px solid rgba(0, 229, 155, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary, #00e59b)',
                      flexShrink: 0
                    }}>
                      <Store size={22} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: '#fff',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {prod.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary, #00e59b)' }}>
                        {formatCurrency(prod.sale_price)}
                      </span>
                      {prod.control_stock !== false && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: prod.stock_quantity === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                          color: prod.stock_quantity === 0 ? '#EF4444' : 'var(--text-muted)',
                        }}>
                          Stock: {availStock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls (Touch-friendly steppers) */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {count === 0 ? (
                    <button
                      onClick={() => addToCart(prod)}
                      disabled={isOutOfStock}
                      style={{
                        padding: '10px 18px',
                        background: isOutOfStock ? 'rgba(255,255,255,0.05)' : 'rgba(0, 229, 155, 0.12)',
                        border: isOutOfStock ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0, 229, 155, 0.4)',
                        borderRadius: '12px',
                        color: isOutOfStock ? 'var(--text-muted)' : 'var(--color-primary, #00e59b)',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '42px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <Plus size={16} />
                      <span>Añadir</span>
                    </button>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(10, 18, 32, 0.95)',
                      border: '1.5px solid var(--color-primary, #00e59b)',
                      borderRadius: '12px',
                      padding: '2px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      <button
                        onClick={() => updateCartQty(prod.id, -1)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                        aria-label="Restar 1"
                      >
                        <Minus size={16} />
                      </button>

                      <span style={{
                        padding: '0 8px',
                        minWidth: '28px',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'var(--color-primary, #00e59b)'
                      }}>
                        {count}
                      </span>

                      <button
                        onClick={() => updateCartQty(prod.id, 1)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                        aria-label="Sumar 1"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* ========================================================
          5. STICKY BOTTOM CART BAR (Flotante de alta visibilidad)
         ======================================================== */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '12px',
          left: '12px',
          right: '12px',
          zIndex: 999,
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0D1C34, #081224)',
            border: '1.5px solid rgba(0, 229, 155, 0.5)',
            borderRadius: '20px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7), 0 0 20px rgba(0, 229, 155, 0.25)',
            backdropFilter: 'blur(16px)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {cartCount} {cartCount === 1 ? 'producto' : 'productos'} en pedido
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                {formatCurrency(cartTotal)}
              </div>
            </div>

            <button
              onClick={() => setShowCartDrawer(true)}
              style={{
                padding: '12px 22px',
                background: 'linear-gradient(135deg, #00E59B, #2DD4BF)',
                border: 'none',
                borderRadius: '14px',
                color: '#060C17',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 229, 155, 0.4)'
              }}
            >
              <span>Ver Pedido</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL SELECTOR DE CLIENTE (Rápido y buscador)
         ======================================================== */}
      {showCustomerModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0'
        }}>
          <div style={{
            background: 'var(--bg-card, #0F1A2E)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px 16px 32px 16px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Seleccionar Cliente
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Elegí de la lista o escribí un cliente no registrado
                </p>
              </div>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search client input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={customerSearchTerm}
                onChange={e => setCustomerSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(10, 18, 32, 0.8)',
                  color: '#fff'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            </div>

            {/* Quick un-registered client block */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary, #00e59b)', marginBottom: '8px' }}>
                O INGRESAR CLIENTE RÁPIDO (SIN REGISTRAR):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre / Negocio"
                  value={customCustomerName}
                  onChange={e => {
                    setCustomCustomerName(e.target.value)
                    if (e.target.value) setSelectedCustomerId('')
                  }}
                  style={{ fontSize: '0.8125rem', height: '38px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Teléfono (opcional)"
                  value={customCustomerPhone}
                  onChange={e => setCustomCustomerPhone(e.target.value)}
                  style={{ fontSize: '0.8125rem', height: '38px' }}
                />
              </div>
              {customCustomerName.trim() && (
                <button
                  onClick={() => {
                    setSelectedCustomerId('')
                    setShowCustomerModal(false)
                    toast.success(`Cliente asignado: ${customCustomerName}`)
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  Usar este cliente
                </button>
              )}
            </div>

            {/* List of registered customers */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '35vh' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Clientes Registrados ({filteredCustomers.length}):
              </div>

              {filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No se encontraron clientes registrados con ese nombre.
                </div>
              ) : (
                filteredCustomers.map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomerId(cust.id)
                      setCustomCustomerName('')
                      setCustomCustomerPhone('')
                      setShowCustomerModal(false)
                      toast.success(`Cliente seleccionado: ${cust.name}`)
                    }}
                    style={{
                      background: selectedCustomerId === cust.id ? 'rgba(0, 229, 155, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: selectedCustomerId === cust.id ? '1px solid var(--color-primary, #00e59b)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>{cust.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        {cust.phone && <span>Tel: {cust.phone}</span>}
                        {cust.address && <span>• {cust.address}</span>}
                      </div>
                    </div>
                    {cust.account_balance > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#F87171', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Debe {formatCurrency(cust.account_balance)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. CART DRAWER & ORDER CONFIRMATION
         ======================================================== */}
      {showCartDrawer && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'var(--bg-card, #0F1A2E)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px 16px 28px 16px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="var(--color-primary, #00e59b)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Detalle del Pedido
                </h3>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target customer reminder */}
            <div style={{
              background: 'rgba(0, 229, 155, 0.08)',
              border: '1px solid rgba(0, 229, 155, 0.2)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary, #00e59b)', fontWeight: 700, display: 'block' }}>CLIENTE:</span>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {currentCustomer ? currentCustomer.name : customCustomerName || 'Sin cliente asignado'}
                </strong>
              </div>
              <button
                onClick={() => { setShowCartDrawer(false); setShowCustomerModal(true); }}
                style={{ fontSize: '0.75rem', color: 'var(--color-primary, #00e59b)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Cambiar
              </button>
            </div>

            {/* Items list */}
            <div style={{ overflowY: 'auto', maxHeight: '35vh', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatCurrency(item.sale_price)} c/u • Subtotal: {formatCurrency(item.sale_price * item.qty)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(10, 18, 32, 0.95)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '2px'
                    }}>
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        style={{ border: 'none', background: 'transparent', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ padding: '0 6px', fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        style={{ border: 'none', background: 'transparent', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ border: 'none', background: 'transparent', color: '#EF4444', padding: '6px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and actions */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total del Pedido:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-primary, #00e59b)' }}>
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => { if (confirm('¿Vaciar pedido?')) { setCart([]); setShowCartDrawer(false); } }}
                  style={{ height: '46px', fontSize: '0.85rem' }}
                >
                  Vaciar
                </button>
                <button
                  onClick={() => {
                    const finalCustomerName = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : customCustomerName.trim()
                    if (!finalCustomerName) {
                      toast.error('Por favor, selecciona o ingresa el nombre del cliente primero')
                      setShowCartDrawer(false)
                      setShowCustomerModal(true)
                      return
                    }
                    setShowConfirmModal(true)
                  }}
                  className="btn btn-primary"
                  style={{ height: '46px', fontWeight: 800, fontSize: '0.95rem' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. CONFIRM MODAL (Datos de Entrega y Guardado)
         ======================================================== */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #0F1A2E)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '24px 20px',
            width: '100%',
            maxWidth: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Coordinar Entrega
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Completá los detalles para que el depósito prepare el pedido
              </p>
            </div>

            {/* Delivery mode */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                MODO DE ENTREGA
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryMode('delivery')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: deliveryMode === 'delivery' ? '1px solid var(--color-primary, #00e59b)' : '1px solid rgba(255,255,255,0.1)',
                    background: deliveryMode === 'delivery' ? 'rgba(0, 229, 155, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: deliveryMode === 'delivery' ? 'var(--color-primary, #00e59b)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Truck size={15} />
                  <span>Envío / Reparto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode('pickup')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: deliveryMode === 'pickup' ? '1px solid var(--color-primary, #00e59b)' : '1px solid rgba(255,255,255,0.1)',
                    background: deliveryMode === 'pickup' ? 'rgba(0, 229, 155, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: deliveryMode === 'pickup' ? 'var(--color-primary, #00e59b)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Store size={15} />
                  <span>Retiro en Local</span>
                </button>
              </div>
            </div>

            {/* Address (if delivery) */}
            {deliveryMode === 'delivery' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  DIRECCIÓN DE ENTREGA
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Calle, Número, Barrio..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>
            )}

            {/* Date & Advance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  FECHA ENTREGA
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  SEÑA / PAGO A CTA ($)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  className="form-input"
                  value={advancePayment}
                  onChange={e => setAdvancePayment(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                OBSERVACIONES DEL CLIENTE
              </label>
              <textarea
                className="form-input"
                placeholder="Ej: Entregar por la mañana, cobrar al chofer..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                style={{ width: '100%', height: '56px', padding: '8px', fontSize: '0.8rem', resize: 'none' }}
              />
            </div>

            {/* Total review */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total a Cobrar:</span>
                <strong style={{ color: '#fff', fontSize: '1rem' }}>{formatCurrency(cartTotal)}</strong>
              </div>
              {parseFloat(advancePayment) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F87171' }}>
                  <span>Saldo al entregar:</span>
                  <strong>{formatCurrency(cartTotal - (parseFloat(advancePayment) || 0))}</strong>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowConfirmModal(false)}
                disabled={savingOrder}
                style={{ height: '46px' }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="btn btn-primary"
                style={{ height: '46px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                {savingOrder ? 'Guardando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          9. WHATSAPP SHARE POST-ORDER MODAL
         ======================================================== */}
      {lastSavedOrder && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #0F1A2E)',
            border: '1px solid rgba(0, 229, 155, 0.4)',
            borderRadius: '20px',
            padding: '24px 20px',
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(0, 229, 155, 0.15)',
              border: '1px solid rgba(0, 229, 155, 0.3)',
              color: 'var(--color-primary, #00e59b)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Check size={28} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                ¡Pedido Tomado con Éxito!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Pedido <strong>{lastSavedOrder.orderNumber}</strong> para <strong>{lastSavedOrder.customerName}</strong>
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Total: <strong style={{ color: 'var(--color-primary, #00e59b)' }}>{formatCurrency(lastSavedOrder.total)}</strong>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {lastSavedOrder.items.length} productos cargados para reparto
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  const phone = lastSavedOrder.customerPhone ? lastSavedOrder.customerPhone.replace(/\D/g, '') : ''
                  const text = `*Pedido ${lastSavedOrder.orderNumber} - ${tenant?.name || 'Smart Caja'}*\n\nHola ${lastSavedOrder.customerName}, tu pedido fue tomado con éxito:\n\n${lastSavedOrder.items.map(i => `• ${i.qty}x ${i.name} (${formatCurrency(i.sale_price * i.qty)})`).join('\n')}\n\n*Total:* ${formatCurrency(lastSavedOrder.total)}\n${lastSavedOrder.advance > 0 ? `*Seña abonada:* ${formatCurrency(lastSavedOrder.advance)}\n*Saldo a abonar:* ${formatCurrency(lastSavedOrder.total - lastSavedOrder.advance)}\n` : ''}${lastSavedOrder.deliveryDate ? `*Fecha estimada:* ${lastSavedOrder.deliveryDate}\n` : ''}\n¡Muchas gracias por tu compra!`
                  
                  if (phone) {
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }
                }}
              >
                <Share2 size={16} />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>

              <button
                className="btn btn-ghost"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => setLastSavedOrder(null)}
              >
                Nuevo Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          10. ORDERS HISTORY DRAWER (Pedidos tomados hoy)
         ======================================================== */}
      {showOrdersHistory && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'var(--bg-card, #0F1A2E)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px 16px 28px 16px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Pedidos de Hoy ({recentOrders.length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary, #00e59b)', fontWeight: 700 }}>
                  Total acumulado: {formatCurrency(todayOrdersTotal)}
                </span>
              </div>
              <button
                onClick={() => setShowOrdersHistory(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '55vh', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  Aún no tomaste pedidos hoy.
                </div>
              ) : (
                recentOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                          #{order.order_number}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: order.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                          color: order.status === 'pending' ? '#F59E0B' : '#10B981'
                        }}>
                          {order.status === 'pending' ? 'Pendiente' : order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {order.customer_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {order.items?.length || 0} artículos • Total: <strong style={{ color: 'var(--color-primary, #00e59b)' }}>{formatCurrency(order.total)}</strong>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.order_number)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '8px',
                          color: '#EF4444',
                          padding: '6px',
                          cursor: 'pointer'
                        }}
                        title="Cancelar pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
