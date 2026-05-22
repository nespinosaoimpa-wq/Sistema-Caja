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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  async function loadData() {
    setLoading(true)
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'open')
      .eq('user_id', profile.id)
      .single()
      
    if (shiftData) setActiveShift(shiftData)

    const { data: prods } = await supabase
      .from('products')
      .select('*, categories(name, icon)')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name')
      
    if (prods) setProducts(prods)
    setLoading(false)
  }

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
    const product = products.find(p => p.barcode === searchTerm || p.reference_code === searchTerm)
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
          item.id === product.id ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.sale_price } : item
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

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id))

  const filteredProducts = products.filter(p => 
    !searchTerm || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!activeShift) return toast.error('Debes abrir un turno de caja primero')

    setIsProcessing(true)
    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: tenant.id, user_id: profile.id, shift_id: activeShift.id,
          // eslint-disable-next-line react-hooks/purity
          ticket_number: Date.now().toString().slice(-8),
          subtotal: cartTotal, total: cartTotal, payment_method: paymentMethod, status: 'completed'
        }).select().single()

      if (saleError) throw saleError

      const itemsToInsert = cart.map(item => ({
        sale_id: saleData.id, tenant_id: tenant.id, product_id: item.id, product_name: item.name,
        quantity: item.qty, unit_price: item.sale_price, cost_price: item.cost_price, subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      await supabase.rpc('update_updated_at') // mock
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Caja Registradora</h1>
          </div>
          <form onSubmit={handleBarcodeSubmit} style={{ width: '350px' }}>
            <input 
              id="barcode-scanner"
              ref={barcodeInputRef}
              className="form-input" 
              placeholder="🔍 Buscar nombre o escanear..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </form>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Cargando inventario...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-5)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                    {product.categories?.icon || '📦'}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }} className="truncate">
                    {product.name}
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {formatCurrency(product.sale_price)}
                  </div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.6875rem', background: '#1A1822', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
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
        width: '400px', 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-color)',
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden'
      }}>
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Ticket Actual</h2>
          <span style={{ fontSize: '0.8125rem', background: '#1A1822', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '4px' }}>{cartItemsCount} Ítems</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Añade productos para cobrar
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ 
                background: '#1A1822', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '12px',
                border: '1px solid #2A2735'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatCurrency(item.sale_price)} c/u</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0B0A0F', borderRadius: '6px', border: '1px solid #2A2735' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '24px', color: 'var(--text-secondary)' }}>-</button>
                      <span style={{ width: '24px', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '24px', color: 'var(--text-secondary)' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>Quitar</button>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-secondary)' }}>
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: '#0B0A0F', padding: 'var(--space-5)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {formatCurrency(cartTotal)}
            </span>
          </div>

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
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: paymentMethod === method.id ? 'var(--color-primary-light)' : '#1A1822',
                  border: `1px solid ${paymentMethod === method.id ? 'var(--color-primary)' : '#2A2735'}`,
                  color: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  transition: 'var(--transition)'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{method.icon}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{method.label}</span>
              </button>
            ))}
          </div>

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '1.125rem', 
              borderRadius: 'var(--radius-md)',
              background: cart.length === 0 ? '#1A1822' : 'var(--color-primary)',
              color: cart.length === 0 ? 'var(--text-muted)' : '#fff',
              pointerEvents: cart.length === 0 ? 'none' : 'auto'
            }}
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Procesando...' : `Cobrar ${formatCurrency(cartTotal)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
