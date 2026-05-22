'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency } from '@/lib/utils/formatters'

export default function POSPage() {
  const { tenant, profile } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  
  const barcodeInputRef = useRef(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState(null)
  
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (tenant?.id) {
      loadData()
    }
  }, [tenant?.id])

  const loadData = async () => {
    setLoading(true)
    // Load active shift
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'open')
      .eq('user_id', profile.id)
      .single()
      
    if (shiftData) setActiveShift(shiftData)

    // Load products
    const { data: prods } = await supabase
      .from('products')
      .select('*, categories(name, icon)')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name')
      
    if (prods) setProducts(prods)
    setLoading(false)
  }

  // Barcode Scanner listener
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.id !== 'barcode-scanner') return
      if (!barcodeInputRef.current) return
      
      if (document.activeElement !== barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!searchTerm) return
    
    const product = products.find(p => 
      p.barcode === searchTerm || p.reference_code === searchTerm
    )
    
    if (product) {
      addToCart(product)
      setSearchTerm('')
    } else {
      toast.warning('Producto no encontrado')
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.sale_price }
            : item
        )
      }
      return [...prev, { ...product, qty: 1, subtotal: product.sale_price }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta)
        return { ...item, qty: newQty, subtotal: newQty * item.sale_price }
      }
      return item
    }))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const filteredProducts = products.filter(p => 
    !searchTerm || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!activeShift) {
      toast.error('Debes abrir un turno de caja primero')
      return
    }

    setIsProcessing(true)
    try {
      // 1. Create Sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: tenant.id,
          user_id: profile.id,
          shift_id: activeShift.id,
          ticket_number: Date.now().toString().slice(-8), // mock ticket gen
          subtotal: cartTotal,
          total: cartTotal,
          payment_method: paymentMethod,
          status: 'completed'
        })
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Insert Items
      const itemsToInsert = cart.map(item => ({
        sale_id: saleData.id,
        tenant_id: tenant.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.sale_price,
        cost_price: item.cost_price,
        subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      // 3. Update Shift Totals (mock simple increment)
      await supabase.rpc('update_updated_at') // placeholder for real shift update logic

      toast.success('¡Venta completada!')
      setCart([])
      setSearchTerm('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--header-height) - 64px)', gap: 'var(--space-6)', overflow: 'hidden' }}>
      
      {/* LEFT SIDE - Product Catalog */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800 }}>Punto de Venta</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Seleccioná productos o escaneá el código</p>
          </div>
          <form onSubmit={handleBarcodeSubmit} style={{ width: '350px' }}>
            <div className="form-input-icon">
              <span className="input-icon">🔍</span>
              <input 
                id="barcode-scanner"
                ref={barcodeInputRef}
                className="form-input" 
                style={{ borderRadius: 'var(--radius-full)', paddingLeft: '48px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="Buscar nombre o código de barras..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </form>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-2xl)' }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-5)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm), var(--inner-glow)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm), var(--inner-glow)'
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
                    {product.categories?.icon || '📦'}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '4px', lineHeight: 1.2 }} className="truncate">
                    {product.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)', textShadow: '0 0 16px var(--color-secondary-glow)' }}>
                    {formatCurrency(product.sale_price)}
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.6875rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {product.stock_quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - Checkout Panel */}
      <div style={{ 
        width: '420px', 
        background: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-2xl)', 
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg), var(--inner-glow)',
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden'
      }}>
        {/* Cart Header */}
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>Carrito actual</h2>
          <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>{cartItemsCount} Ítems</span>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: 'var(--space-4)' }}>🛒</div>
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 'var(--radius-lg)', 
                padding: 'var(--space-3)',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 'var(--space-3)',
                border: '1px solid transparent',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{formatCurrency(item.sale_price)} c/u</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-full)' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>-</button>
                      <span style={{ width: '24px', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 600 }}>Eliminar</button>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-secondary)' }}>
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 'var(--space-5)', borderTop: '1px solid var(--border-color)' }}>
          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--color-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Descuentos</span>
            <span>$0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
              {formatCurrency(cartTotal)}
            </span>
          </div>

          {/* Payment Methods */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: 'var(--space-5)' }}>
            {[
              { id: 'cash', label: 'Efectivo', icon: '💵' },
              { id: 'debit', label: 'Débito', icon: '💳' },
              { id: 'credit', label: 'Crédito', icon: '🏦' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                style={{
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-lg)',
                  background: paymentMethod === method.id ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${paymentMethod === method.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  color: paymentMethod === method.id ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  transition: 'var(--transition)',
                  boxShadow: paymentMethod === method.id ? 'var(--inner-glow), 0 0 16px var(--color-primary-glow)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{method.icon}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{method.label}</span>
              </button>
            ))}
          </div>

          {/* Action */}
          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '20px', 
              fontSize: '1.25rem', 
              borderRadius: 'var(--radius-xl)',
              background: cart.length === 0 ? 'var(--bg-input)' : 'var(--gradient-secondary)',
              boxShadow: cart.length === 0 ? 'none' : '0 12px 32px var(--color-secondary-glow), var(--inner-glow)',
              color: cart.length === 0 ? 'var(--text-muted)' : '#fff',
              pointerEvents: cart.length === 0 ? 'none' : 'auto'
            }}
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Procesando...' : `Cobrar ${formatCurrency(cartTotal)}`}
          </button>
          
          {!activeShift && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: '0.75rem', color: 'var(--color-error)' }}>
              ⚠️ Abrí un turno de caja para cobrar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
