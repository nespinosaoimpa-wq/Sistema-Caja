'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'

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
  const [cashReceived, setCashReceived] = useState('')
  
  // Receipt modal state
  const [receiptData, setReceiptData] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)

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

  const isDecimalProduct = (product) => {
    return product.unit_type === 'weight' || product.unit_type === 'volume'
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        const increment = isDecimalProduct(product) ? 1 : 1
        const newQty = existing.qty + increment
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: newQty, subtotal: newQty * item.sale_price } : item
        )
      }
      return [...prev, { ...product, qty: 1, subtotal: product.sale_price }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(isDecimalProduct(item) ? 0.001 : 1, item.qty + delta)
        return { ...item, qty: newQty, subtotal: newQty * item.sale_price }
      }
      return item
    }))
  }

  const updateQtyDirect = (id, value) => {
    const numVal = parseFloat(value)
    if (isNaN(numVal) || numVal <= 0) return
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: numVal, subtotal: numVal * item.sale_price }
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

  const cashReceivedNum = parseFloat(cashReceived) || 0
  const cashChange = cashReceivedNum - cartTotal

  // Build receipt HTML for thermal printer (80mm)
  const buildReceiptHTML = (saleData, items) => {
    const now = new Date()
    const dateStr = formatDateTime(now)
    const itemsHTML = items.map(item => {
      const unitLabel = item.unit_label || (item.unit_type === 'weight' ? 'kg' : item.unit_type === 'volume' ? 'L' : 'u')
      const qtyStr = isDecimalProduct(item) ? `${item.qty.toFixed(3)} ${unitLabel}` : `${item.qty} ${unitLabel}`
      return `<tr>
        <td style="text-align:left;padding:2px 0;">${item.name}</td>
        <td style="text-align:center;padding:2px 0;">${qtyStr}</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.sale_price)}</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.subtotal)}</td>
      </tr>`
    }).join('')

    let paymentInfo = ''
    if (paymentMethod === 'cash') {
      paymentInfo = `
        <div style="display:flex;justify-content:space-between;"><span>Recibido:</span><span>${formatCurrency(cashReceivedNum)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>Vuelto:</span><span>${formatCurrency(cashChange)}</span></div>
      `
    }

    const payMethodLabel = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito' }[paymentMethod] || paymentMethod

    return `
      <div style="font-family:'Courier New',Courier,monospace;width:72mm;padding:4mm;font-size:12px;color:#000;background:#fff;">
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:16px;font-weight:bold;">${tenant?.name || 'Mi Negocio'}</div>
          <div style="font-size:10px;color:#555;">Ticket de Venta</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:11px;margin-bottom:6px;">
          <div>Fecha: ${dateStr}</div>
          <div>Ticket: #${saleData.ticket_number}</div>
          <div>Cajero: ${profile?.full_name || 'N/A'}</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="border-bottom:1px solid #000;">
              <th style="text-align:left;padding:2px 0;">Prod</th>
              <th style="text-align:center;padding:2px 0;">Cant</th>
              <th style="text-align:right;padding:2px 0;">P.U.</th>
              <th style="text-align:right;padding:2px 0;">Subt</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:12px;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${formatCurrency(cartTotal)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin:4px 0;"><span>TOTAL:</span><span>${formatCurrency(cartTotal)}</span></div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:11px;">
          <div style="display:flex;justify-content:space-between;"><span>Método de pago:</span><span>${payMethodLabel}</span></div>
          ${paymentInfo}
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="text-align:center;font-size:10px;color:#555;margin-top:8px;">
          ¡Gracias por su compra!
        </div>
      </div>
    `
  }

  const handlePrintReceipt = () => {
    if (!receiptData) return
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${receiptData.ticket_number}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: 80mm auto; margin: 0; }
            }
            body { margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body>
          ${receiptData.receiptHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!activeShift) return toast.error('Debes abrir un turno de caja primero')

    // 1b. Stock validation before checkout
    const outOfStock = cart.filter(item => item.qty > item.stock_quantity)
    if (outOfStock.length > 0) {
      const names = outOfStock.map(i => `"${i.name}" (pedido: ${i.qty}, stock: ${i.stock_quantity})`).join(', ')
      toast.error(`Stock insuficiente para: ${names}`)
      return
    }

    // 1c. Cash validation
    if (paymentMethod === 'cash') {
      if (cashReceivedNum < cartTotal) {
        toast.error('El monto recibido es menor al total')
        return
      }
    }

    setIsProcessing(true)
    try {
      const ticketNumber = Date.now().toString().slice(-8)
      
      const salePayload = {
        tenant_id: tenant.id, user_id: profile.id, shift_id: activeShift.id,
        ticket_number: ticketNumber,
        subtotal: cartTotal, total: cartTotal, payment_method: paymentMethod, status: 'completed'
      }

      // Store cash info if cash payment
      if (paymentMethod === 'cash') {
        salePayload.cash_received = cashReceivedNum
        salePayload.cash_change = cashChange
      }

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(salePayload).select().single()

      if (saleError) throw saleError

      const itemsToInsert = cart.map(item => ({
        sale_id: saleData.id, tenant_id: tenant.id, product_id: item.id, product_name: item.name,
        quantity: item.qty, unit_price: item.sale_price, cost_price: item.cost_price, subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      // 1a. Deduct stock for each cart item
      for (const item of cart) {
        if (item.id) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: item.stock_quantity - item.qty,
              last_sold_at: new Date().toISOString()
            })
            .eq('id', item.id)
        }
      }

      // 1e & 1f. Build receipt and store ticket
      const receiptHTML = buildReceiptHTML(saleData, cart)
      
      // Insert into tickets table
      await supabase.from('tickets').insert({
        sale_id: saleData.id,
        tenant_id: tenant.id,
        ticket_content: receiptHTML,
        printed_count: 0
      })

      // Show receipt modal
      setReceiptData({
        ticket_number: ticketNumber,
        saleData,
        items: [...cart],
        total: cartTotal,
        paymentMethod,
        cashReceived: cashReceivedNum,
        cashChange,
        receiptHTML,
        date: new Date()
      })
      setShowReceipt(true)

      toast.success('¡Venta completada!')
      setCart([])
      setSearchTerm('')
      setCashReceived('')
      
      // Reload products to refresh stock quantities
      loadData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Category filtering
  const [activeCategory, setActiveCategory] = useState('Todos')
  const uniqueCategories = ['Todos', ...new Set(products.map(p => p.categories?.name).filter(Boolean))]

  const filteredProductsByCategory = filteredProducts.filter(p => 
    activeCategory === 'Todos' || p.categories?.name === activeCategory
  )

  return (
    <>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--header-height) - 32px)', gap: 'var(--space-6)', overflow: 'hidden' }}>
        
        {/* LEFT SIDE - Product Catalog */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Header & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <form onSubmit={handleBarcodeSubmit} style={{ width: '400px' }}>
              <div className="form-input-icon">
                <span className="input-icon">🔍</span>
                <input 
                  id="barcode-scanner"
                  ref={barcodeInputRef}
                  className="form-input" 
                  placeholder="Buscar por nombre, SKU o código de barras ‖‖"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  autoFocus
                />
              </div>
            </form>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: 'var(--radius-md)',
                    background: activeCategory === cat ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: `1px solid ${activeCategory === cat ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'var(--transition)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)' }}>Cargando inventario...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                {filteredProductsByCategory.map(product => (
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
                      position: 'relative',
                      opacity: product.stock_quantity <= 0 ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-border)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Category Badge */}
                    {product.categories?.name && (
                      <div style={{ 
                        position: 'absolute', top: '0', right: '16px', 
                        background: 'rgba(78, 222, 163, 0.1)', color: 'var(--color-secondary)',
                        padding: '4px 12px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px',
                        fontSize: '0.6875rem', fontWeight: 600
                      }}>
                        {product.categories.name}
                      </div>
                    )}
                    
                    <div style={{ 
                      width: '64px', height: '64px', borderRadius: '50%', 
                      background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', marginBottom: '16px', marginTop: '12px',
                      border: '1px solid var(--border-highlight)'
                    }}>
                      {product.categories?.icon || '📦'}
                    </div>

                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', minHeight: '40px' }} className="truncate">
                      {product.name}
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {formatCurrency(product.sale_price)}
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
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius-xl)', 
          border: '1px solid var(--border-color)',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '4px', fontFamily: 'var(--font-headline)' }}>Ticket #{Date.now().toString().slice(-6)}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                👤 {profile?.full_name || 'Vendedor'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '100px', padding: '6px 12px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              🕒 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Añade productos para cobrar
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatCurrency(item.sale_price)} c/u
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isDecimalProduct(item) ? (
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                         <input
                            type="number"
                            step="0.001"
                            value={item.qty}
                            onChange={(e) => updateQtyDirect(item.id, e.target.value)}
                            style={{
                              width: '60px', padding: '6px', textAlign: 'center',
                              background: 'transparent', border: 'none',
                              color: '#fff', fontWeight: 600, fontSize: '0.875rem'
                            }}
                          />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ padding: '4px 10px', color: 'var(--text-secondary)' }}>−</button>
                        <span style={{ width: '20px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ padding: '4px 10px', color: 'var(--text-secondary)' }}>+</button>
                      </div>
                    )}
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', width: '60px', textAlign: 'right' }}>
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <span>Descuento</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Aplicar %</span>
                <span style={{ border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Monto Fijo</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-headline)' }}>TOTAL</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: 'var(--space-6)' }}>
              {[
                { id: 'cash', label: 'Efectivo', icon: '💵' },
                { id: 'debit', label: 'Débito', icon: '💳' },
                { id: 'credit', label: 'Crédito', icon: '🏦' },
                { id: 'mixed', label: 'Mixto', icon: '➗' },
                { id: 'installment', label: 'Cuotas', icon: '📅' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '12px 4px',
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === method.id ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                    border: `1px solid ${paymentMethod === method.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    color: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{method.icon}</span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase' }}>{method.label}</span>
                </button>
              ))}
            </div>

            <button 
              className="glow-primary" 
              style={{ 
                width: '100%', 
                padding: '20px', 
                fontSize: '1.25rem',
                fontWeight: 700, 
                borderRadius: 'var(--radius-lg)',
                background: cart.length === 0 ? 'var(--bg-surface)' : 'var(--color-primary-hover)',
                color: cart.length === 0 ? 'var(--text-muted)' : '#fff',
                border: 'none',
                pointerEvents: cart.length === 0 ? 'none' : 'auto',
                transition: 'var(--transition)'
              }}
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? 'Procesando...' : `Confirmar Venta →`}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal (Unchanged structurally, kept dark theme compatible) */}
      {showReceipt && receiptData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowReceipt(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '440px', width: '100%', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal header */}
            <div style={{ 
              padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>✅ Venta Completada</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ticket #{receiptData.ticket_number}
                </p>
              </div>
              <div style={{ 
                background: 'rgba(78, 222, 163, 0.15)', color: 'var(--color-secondary)', 
                padding: '6px 12px', borderRadius: 'var(--radius-full)', 
                fontSize: '0.8125rem', fontWeight: 600 
              }}>
                {formatCurrency(receiptData.total)}
              </div>
            </div>

            {/* Receipt preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <div style={{ 
                background: '#fff', borderRadius: 'var(--radius-md)', 
                padding: '16px', color: '#000', fontSize: '12px',
                fontFamily: "'Courier New', Courier, monospace"
              }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{tenant?.name || 'Mi Negocio'}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Ticket de Venta</div>
                </div>
                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                <div style={{ fontSize: '11px', marginBottom: '8px' }}>
                  <div>Fecha: {formatDateTime(receiptData.date)}</div>
                  <div>Ticket: #{receiptData.ticket_number}</div>
                  <div>Cajero: {profile?.full_name || 'N/A'}</div>
                </div>
                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                
                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      <th style={{ textAlign: 'left', padding: '2px 0' }}>Prod</th>
                      <th style={{ textAlign: 'center', padding: '2px 0' }}>Cant</th>
                      <th style={{ textAlign: 'right', padding: '2px 0' }}>P.U.</th>
                      <th style={{ textAlign: 'right', padding: '2px 0' }}>Subt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, i) => {
                      const unitLabel = item.unit_label || (item.unit_type === 'weight' ? 'kg' : item.unit_type === 'volume' ? 'L' : 'u')
                      const qtyStr = isDecimalProduct(item) ? `${item.qty.toFixed(3)} ${unitLabel}` : `${item.qty} ${unitLabel}`
                      return (
                         <tr key={i}>
                          <td style={{ textAlign: 'left', padding: '3px 0' }}>{item.name}</td>
                          <td style={{ textAlign: 'center', padding: '3px 0' }}>{qtyStr}</td>
                          <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(item.sale_price)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

                <div style={{ fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Método:</span>
                    <span>{{ cash: 'Efectivo', debit: 'Débito', credit: 'Crédito' }[receiptData.paymentMethod] || receiptData.paymentMethod}</span>
                  </div>
                  {receiptData.paymentMethod === 'cash' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Recibido:</span>
                        <span>{formatCurrency(receiptData.cashReceived)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Vuelto:</span>
                        <span>{formatCurrency(receiptData.cashChange)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
                  ¡Gracias por su compra!
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ 
              padding: '16px 24px', borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: '12px'
            }}>
               <button
                className="btn"
                onClick={() => setShowReceipt(false)}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                  fontSize: '0.9375rem', fontWeight: 600
                }}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePrintReceipt}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem', fontWeight: 600,
                  background: 'var(--color-primary-hover)'
                }}
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
