'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency } from '@/lib/utils/formatters'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import {
  Search, ShoppingCart, User, Calendar, DollarSign,
  Plus, Minus, Trash2, CheckCircle2, ChevronRight,
  ClipboardList, Smartphone, Clock, X
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
  const [savingOrder, setSavingOrder] = useState(false)

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
        .select('*, categories(name, icon)')
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

  // Cart helper functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        // Respect stock limit if stock_quantity is defined
        if (product.stock_quantity !== null && existing.qty >= product.stock_quantity) {
          toast.warning(`Superaste el stock disponible de ${product.name}`)
          return prev
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      } else {
        if (product.stock_quantity !== null && product.stock_quantity <= 0) {
          toast.warning(`${product.name} no tiene stock disponible`)
          return prev
        }
        return [...prev, {
          id: product.id,
          name: product.name,
          qty: 1,
          sale_price: product.sale_price,
          stock_quantity: product.stock_quantity,
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
          if (item.stock_quantity !== null && newQty > item.stock_quantity) {
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

  // Get current active stock of a product (original minus cart quantity)
  const getAvailableStock = (product) => {
    const inCart = cart.find(item => item.id === product.id)
    const qtyInCart = inCart ? inCart.qty : 0
    return product.stock_quantity !== null ? Math.max(0, product.stock_quantity - qtyInCart) : '∞'
  }

  // Handle saving the order
  const handleSaveOrder = async () => {
    // Determine customer info
    let finalCustomerName = ''
    let finalCustomerPhone = ''

    if (selectedCustomerId) {
      const selected = customers.find(c => c.id === selectedCustomerId)
      if (selected) {
        finalCustomerName = selected.name
        finalCustomerPhone = selected.phone || ''
      }
    } else {
      finalCustomerName = customCustomerName.trim()
      finalCustomerPhone = customCustomerPhone.trim()
    }

    if (!finalCustomerName) {
      toast.error('Por favor selecciona o ingresa un cliente')
      return
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    setSavingOrder(true)

    try {
      const advance = parseFloat(advancePayment) || 0
      const total = cartTotal

      // Get count of orders to generate order number
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

      toast.success(`Pedido ${orderNumber} tomado con éxito para ${finalCustomerName}`)
      
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
      toast.error('Error al guardar el pedido: ' + e.message)
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
      toast.error('Error al cancelar: ' + e.message)
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
      minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-app)', paddingBottom: '80px', position: 'relative'
    }}>
      {/* Header */}
      <div className="app-header" style={{ flexShrink: 0, padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#fff'
          }}>📋</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Preventista Móvil
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)' }}>Calle</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carga de pedidos sin apertura de caja física.</p>
          </div>
        </div>
      </div>

      {/* Customer Selector card */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={16} color="var(--color-primary)" /> Cliente del Pedido
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Searchable customer dropdown */}
            <select
              className="form-input"
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value)
                if (e.target.value !== '') {
                  setCustomCustomerName('')
                  setCustomCustomerPhone('')
                }
              }}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', color: '#fff' }}
            >
              <option value="">-- Seleccionar cliente registrado --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} {c.account_balance > 0 ? `· Debe: ${formatCurrency(c.account_balance)}` : ''}
                </option>
              ))}
            </select>

            {/* Quick custom client write-in */}
            {!selectedCustomerId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>O ingresá un cliente rápido no registrado:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre del cliente"
                    value={customCustomerName}
                    onChange={e => setCustomCustomerName(e.target.value)}
                    style={{ fontSize: '0.8125rem' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Teléfono (opcional)"
                    value={customCustomerPhone}
                    onChange={e => setCustomCustomerPhone(e.target.value)}
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog & Search Section */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre, código o barra..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', height: '44px', borderRadius: 'var(--radius-lg)' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '14px', top: '13px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category horizontal scroll slider */}
        {categories.length > 0 && (
          <div style={{
            display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px',
            scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                background: selectedCategory === 'all' ? 'var(--color-primary)' : 'var(--bg-card)',
                color: selectedCategory === 'all' ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              All Categorías
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: selectedCategory === cat.id ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid / List */}
      <div style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No se encontraron productos en el catálogo.
          </div>
        ) : (
          filteredProducts.map(prod => {
            const availStock = getAvailableStock(prod)
            const itemInCart = cart.find(item => item.id === prod.id)
            const count = itemInCart ? itemInCart.qty : 0

            return (
              <div
                key={prod.id}
                style={{
                  background: 'var(--bg-card)', border: count > 0 ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  boxShadow: count > 0 ? '0 0 12px rgba(124,58,237,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s'
                }}
              >
                {/* Left product detail */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}
                    />
                  ) : (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
                    }}>📦</div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(prod.sale_price)}</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                        background: prod.stock_quantity === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                        color: prod.stock_quantity === 0 ? '#EF4444' : 'var(--text-muted)',
                      }}>
                        Stock: {availStock}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {count === 0 ? (
                    <button
                      onClick={() => addToCart(prod)}
                      disabled={prod.stock_quantity !== null && prod.stock_quantity <= 0}
                      style={{
                        padding: '8px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '100px',
                        color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        transition: 'all 0.15s',
                        opacity: (prod.stock_quantity !== null && prod.stock_quantity <= 0) ? 0.4 : 1
                      }}
                    >
                      <Plus size={14} /> Añadir
                    </button>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--color-primary)',
                      borderRadius: '100px', overflow: 'hidden', padding: '2px'
                    }}>
                      <button
                        onClick={() => updateCartQty(prod.id, -1)}
                        style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ padding: '0 8px', minWidth: '24px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{count}</span>
                      <button
                        onClick={() => updateCartQty(prod.id, 1)}
                        style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Today's Taken Orders Log */}
      {recentOrders.length > 0 && (
        <div style={{ padding: '16px', marginTop: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} color="var(--color-primary)" /> Pedidos preventas de hoy ({recentOrders.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentOrders.map(order => (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#fff' }}>{order.customer_name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    #{order.order_number} · Total: <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(order.total)}</strong>
                    {order.advance_payment > 0 && ` (Seña: ${formatCurrency(order.advance_payment)})`}
                  </div>
                  {order.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                      📝 {order.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                    background: order.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color: order.status === 'pending' ? '#F59E0B' : '#10B981'
                  }}>
                    {order.status === 'pending' ? 'Pendiente' : order.status}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id, order.order_number)}
                      style={{
                        background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Cart Bottom Bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(26,22,37,0.85)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--color-primary)', padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 999, boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pedido actual</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{formatCurrency(cartTotal)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({cartCount} art.)</span>
            </div>
          </div>

          <button
            onClick={() => setShowCartDrawer(true)}
            style={{
              padding: '12px 24px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
              border: 'none', borderRadius: '100px', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(124,58,237,0.3)'
            }}
          >
            <ShoppingCart size={16} /> Ver pedido
          </button>
        </div>
      )}

      {/* ========== CART DRAWER MODAL ========== */}
      {showCartDrawer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)',
            borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛒 Detalle del Pedido
              </h3>
              <button
                onClick={() => setShowCartDrawer(false)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '40vh' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                  paddingBottom: '12px', borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatCurrency(item.sale_price)} x{item.qty}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                      borderRadius: '100px', padding: '2px'
                    }}>
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        style={{ border: 'none', background: 'transparent', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ padding: '0 6px', minWidth: '20px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        style={{ border: 'none', background: 'transparent', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                <span>Total a Cobrar</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(cartTotal)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => { if (confirm('¿Vaciar pedido actual?')) { setCart([]); setShowCartDrawer(false) } }}
                  style={{ width: '100%', fontSize: '0.875rem' }}
                >
                  Vaciar
                </button>
                <button
                  onClick={() => {
                    const finalCustomerName = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : customCustomerName.trim()
                    if (!finalCustomerName) {
                      toast.error('Por favor, selecciona o ingresa el nombre del cliente primero')
                      return
                    }
                    setShowConfirmModal(true)
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', fontWeight: 700, fontSize: '0.875rem' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CONFIRM PRE-ORDER MODAL ========== */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)', padding: '24px', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)',
                border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', margin: '0 auto 8px'
              }}>📋</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Confirmar Preventa</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carga final del pedido para coordinar entrega</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Delivery mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Modo de entrega
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setDeliveryMode('delivery')}
                    style={{
                      padding: '6px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: deliveryMode === 'delivery' ? 'var(--color-primary)' : 'transparent',
                      color: deliveryMode === 'delivery' ? '#000' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    🚚 Envío / Reparto
                  </button>
                  <button
                    onClick={() => setDeliveryMode('pickup')}
                    style={{
                      padding: '6px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: deliveryMode === 'pickup' ? 'var(--color-primary)' : 'transparent',
                      color: deliveryMode === 'pickup' ? '#000' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    🏪 Retiro Local
                  </button>
                </div>
              </div>

              {/* Delivery Address (only if delivery) */}
              {deliveryMode === 'delivery' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Dirección de envío
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Calle, Número, Localidad..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Delivery date & Advance Payment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Fecha de entrega
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Seña / Anticipo ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    className="form-input"
                    value={advancePayment}
                    onChange={e => setAdvancePayment(e.target.value)}
                  />
                </div>
              </div>

              {/* Observation/Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Observaciones / Notas
                </label>
                <textarea
                  className="form-input"
                  placeholder="Ej: Cobrar al entregar, dejar en portería..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  style={{ width: '100%', height: '60px', padding: '10px', resize: 'none' }}
                />
              </div>

              {/* Total review */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Importe del Pedido:</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{formatCurrency(cartTotal)}</span>
                </div>
                {advancePayment && parseFloat(advancePayment) > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Monto Señado:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>-{formatCurrency(parseFloat(advancePayment))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Saldo Pendiente:</span>
                      <span style={{ color: 'var(--color-error)' }}>{formatCurrency(cartTotal - (parseFloat(advancePayment) || 0))}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirmModal(false)}
                disabled={savingOrder}
                style={{ flex: 1 }}
              >
                Volver
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="btn btn-primary"
                style={{ flex: 2, fontWeight: 700 }}
              >
                {savingOrder ? '⏳ Guardando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
