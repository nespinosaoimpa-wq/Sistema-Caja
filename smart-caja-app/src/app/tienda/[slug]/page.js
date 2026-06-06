'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

export default function TiendaPage() {
  const { slug } = useParams()
  const [storeData, setStoreData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    delivery_mode: 'pickup',
    delivery_mode: 'pickup',
    notes: '',
  })
  
  // Variant selection state
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null)
  const [variantSize, setVariantSize] = useState(null)
  const [variantColor, setVariantColor] = useState(null)

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(`/api/tienda/${slug}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStoreData(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchStore() }, [fetchStore])

  // Restore cart from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`cart_${slug}`)
      if (saved) setCart(JSON.parse(saved))
    } catch {}
  }, [slug])

  // Save cart to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(`cart_${slug}`, JSON.stringify(cart)) } catch {}
  }, [cart, slug])

  const addToCart = (product, variant = null) => {
    if (product.has_variants && !variant) {
      setSelectedProductForVariant(product)
      setVariantSize(null)
      setVariantColor(null)
      return
    }

    setCart(prev => {
      const exists = prev.find(i => i.product_id === product.id && i.variant_id === (variant?.id || null))
      if (exists) {
        return prev.map(i => (i.product_id === product.id && i.variant_id === (variant?.id || null)) ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        product_id: product.id,
        variant_id: variant?.id || null,
        variant_label: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : null,
        name: product.name,
        unit_price: product.sale_price + (variant?.extra_price || 0),
        qty: 1,
        image_url: product.image_url,
      }]
    })
    
    setSelectedProductForVariant(null)
    setShowCart(false)
  }

  const removeFromCart = (product_id, variant_id = null) => {
    setCart(prev => prev.filter(i => !(i.product_id === product_id && i.variant_id === variant_id)))
  }

  const updateQty = (product_id, variant_id = null, delta) => {
    setCart(prev => prev
      .map(i => (i.product_id === product_id && i.variant_id === variant_id) ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
      .filter(i => i.qty > 0)
    )
  }

  const cartTotal = cart.reduce((s, i) => s + i.unit_price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    if (!form.customer_name || !form.customer_phone) return
    if (form.delivery_mode === 'delivery' && !form.customer_address) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tienda/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: storeData.tenant.id,
          ...form,
          items: cart,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrderSuccess(data)
      setCart([])
      setShowOrderForm(false)
      sessionStorage.removeItem(`cart_${slug}`)
    } catch (e) {
      alert('Error al enviar el pedido: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: '1.125rem', opacity: 0.7 }}>Cargando tienda...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#060e20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '3rem' }}>🏪</div>
      <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>Tienda no disponible</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{error}</div>
    </div>
  )

  if (orderSuccess) return (
    <div style={{ minHeight: '100vh', background: '#060e20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem' }}>✅</div>
      <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.75rem' }}>¡Pedido recibido!</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '400px' }}>
        Tu pedido <strong style={{ color: '#4edea3' }}>#{orderSuccess.order_number}</strong> fue registrado exitosamente.
        El comercio va a contactarte pronto para confirmar.
      </p>
      {orderSuccess.wa_link && (
        <a
          href={orderSuccess.wa_link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#25D366', color: '#fff', padding: '14px 28px',
            borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px',
          }}
        >
          📱 Confirmar por WhatsApp
        </a>
      )}
      <button
        onClick={() => setOrderSuccess(null)}
        style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginTop: '8px' }}
      >
        Volver a la tienda
      </button>
    </div>
  )

  const { tenant, products } = storeData
  const primaryColor = tenant.primary_color || '#7C3AED'

  // Categories
  const categories = [{ id: 'all', name: 'Todo', icon: '🏪' }, ...Object.values(
    products.reduce((acc, p) => {
      const cat = p.categories
      if (cat && !acc[cat.name]) acc[cat.name] = { id: cat.name, name: cat.name, icon: cat.icon || '📦' }
      return acc
    }, {})
  )]

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.categories?.name === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: '#060e20', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6,14,32,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 16px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏪</div>
            )}
            <span style={{ fontWeight: 800, fontSize: '1.0625rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant.name}</span>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setShowCart(true)}
            style={{
              position: 'relative',
              background: cartCount > 0 ? primaryColor : 'rgba(255,255,255,0.08)',
              border: 'none', borderRadius: '12px',
              padding: '10px 16px', cursor: 'pointer',
              color: '#fff', fontWeight: 700, fontSize: '0.9375rem',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            🛒
            {cartCount > 0 && (
              <>
                <span>{cartCount}</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>· ${cartTotal.toLocaleString('es-AR')}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Banner / Hero */}
      {(tenant.ecommerce_banner || tenant.ecommerce_description) && (
        <div style={{
          background: `linear-gradient(135deg, ${primaryColor}22, transparent)`,
          borderBottom: `1px solid ${primaryColor}22`,
          padding: '24px 16px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {tenant.ecommerce_description && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{tenant.ecommerce_description}</p>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 44px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: '#fff', fontSize: '1rem',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>

        {/* Category tabs */}
        {categories.length > 2 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: activeCategory === cat.id ? `1.5px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                  background: activeCategory === cat.id ? `${primaryColor}20` : 'rgba(255,255,255,0.04)',
                  color: activeCategory === cat.id ? primaryColor : 'rgba(255,255,255,0.6)',
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  cursor: 'pointer', fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
            <div>No hay productos disponibles</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map(product => (
              <div key={product.id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'pointer',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Product image */}
                <div style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.3 }}>
                      {product.categories?.icon || '📦'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px', lineHeight: 1.3 }}>{product.name}</div>
                  {product.description && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: primaryColor }}>
                      ${product.sale_price.toLocaleString('es-AR')}
                      {product.unit_type === 'weight' && <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>/{product.unit_label || 'kg'}</span>}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: primaryColor, border: 'none',
                        color: '#fff', fontSize: '1.25rem', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'opacity 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div onClick={() => setShowCart(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '420px',
            background: '#0b1326', borderLeft: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            {/* Cart header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem' }}>🛒 Tu carrito</h2>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
                  Tu carrito está vacío
                </div>
              ) : cart.map(item => (
                <div key={item.product_id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '2px' }}>
                      {item.name}
                      {item.variant_label && <span style={{ opacity: 0.7, fontSize: '0.8125rem', marginLeft: '6px' }}>({item.variant_label})</span>}
                    </div>
                    <div style={{ color: primaryColor, fontWeight: 700 }}>${item.unit_price.toLocaleString('es-AR')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateQty(item.product_id, item.variant_id, -1)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.product_id, item.variant_id, 1)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: primaryColor, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>${cartTotal.toLocaleString('es-AR')}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowOrderForm(true) }}
                  style={{
                    width: '100%', padding: '16px',
                    background: primaryColor, border: 'none', borderRadius: '12px',
                    color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                  }}
                >
                  Hacer pedido →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            background: '#0b1326', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '500px',
            padding: '24px', maxHeight: '92vh', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>📋 Datos del pedido</h2>
              <button onClick={() => setShowOrderForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Delivery mode */}
              {tenant.ecommerce_delivery_modes?.includes('delivery') && (
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>TIPO DE ENTREGA</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[['pickup', '🏪 Retiro en local'], ['delivery', '🚚 Delivery']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, delivery_mode: val }))}
                        style={{
                          flex: 1, padding: '10px',
                          borderRadius: '10px',
                          border: form.delivery_mode === val ? `2px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                          background: form.delivery_mode === val ? `${primaryColor}15` : 'rgba(255,255,255,0.04)',
                          color: form.delivery_mode === val ? primaryColor : 'rgba(255,255,255,0.6)',
                          fontWeight: form.delivery_mode === val ? 700 : 500,
                          cursor: 'pointer', fontSize: '0.875rem',
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {[
                { key: 'customer_name', label: 'Tu nombre *', type: 'text', placeholder: 'Juan García' },
                { key: 'customer_phone', label: 'WhatsApp / Celular *', type: 'tel', placeholder: '+54 9 11 1234-5678' },
                { key: 'customer_email', label: 'Email (opcional)', type: 'email', placeholder: 'juan@email.com' },
                ...(form.delivery_mode === 'delivery' ? [{ key: 'customer_address', label: 'Dirección de entrega *', type: 'text', placeholder: 'Av. San Martín 1234' }] : []),
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    required={field.label.includes('*')}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Nota (opcional)</label>
                <textarea
                  placeholder="Alguna aclaración especial..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%', padding: '12px 14px', resize: 'vertical',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Order summary */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                {cart.map(item => (
                  <div key={`${item.product_id}-${item.variant_id || 'base'}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {item.name} {item.variant_label ? `(${item.variant_label})` : ''} x{item.qty}
                    </span>
                    <span style={{ fontWeight: 600 }}>${(item.unit_price * item.qty).toLocaleString('es-AR')}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span>Total</span>
                  <span style={{ color: primaryColor }}>${cartTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '16px', background: primaryColor, border: 'none', borderRadius: '12px',
                  color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Enviando pedido...' : '✅ Confirmar pedido'}
              </button>

              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Al confirmar, el comercio recibirá tu pedido y te contactará para coordinar.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Floating cart button (mobile) */}
      {cartCount > 0 && !showCart && !showOrderForm && (
        <button
          onClick={() => setShowCart(true)}
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: primaryColor, border: 'none', borderRadius: '24px',
            padding: '14px 28px', color: '#fff', fontWeight: 800, fontSize: '1rem',
            cursor: 'pointer', zIndex: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '10px',
            whiteSpace: 'nowrap',
          }}
        >
          🛒 Ver carrito · {cartCount} items · ${cartTotal.toLocaleString('es-AR')}
        </button>
      )}

      {/* Variant Selection Modal */}
      {selectedProductForVariant && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1002, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#0b1326', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{selectedProductForVariant.name}</h3>
                <div style={{ color: primaryColor, fontWeight: 600, marginTop: '4px' }}>
                  ${selectedProductForVariant.sale_price.toLocaleString('es-AR')}
                </div>
              </div>
              <button onClick={() => setSelectedProductForVariant(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            {/* Talles */}
            {(() => {
              const variants = (selectedProductForVariant.product_variants || []).filter(v => v.stock_quantity > 0)
              const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
              const colorsForSize = variantSize
                ? [...new Set(variants.filter(v => v.size === variantSize).map(v => v.color).filter(Boolean))]
                : [...new Set(variants.map(v => v.color).filter(Boolean))]

              const selectedVariant = variantSize && variantColor
                ? variants.find(v => v.size === variantSize && v.color === variantColor)
                : variantSize && !colorsForSize.length
                  ? variants.find(v => v.size === variantSize)
                  : null

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {sizes.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>TALLE</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {sizes.map(size => {
                          const isSelected = variantSize === size
                          return (
                            <button
                              key={size}
                              onClick={() => { setVariantSize(size); setVariantColor(null) }}
                              style={{
                                padding: '8px 16px', borderRadius: '8px',
                                border: isSelected ? `2px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                                background: isSelected ? `${primaryColor}20` : 'rgba(255,255,255,0.04)',
                                color: isSelected ? primaryColor : '#fff', fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer'
                              }}
                            >{size}</button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {colorsForSize.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>COLOR</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {colorsForSize.map(color => {
                          const isSelected = variantColor === color
                          return (
                            <button
                              key={color}
                              onClick={() => setVariantColor(color)}
                              style={{
                                padding: '8px 16px', borderRadius: '8px',
                                border: isSelected ? `2px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                                background: isSelected ? `${primaryColor}20` : 'rgba(255,255,255,0.04)',
                                color: isSelected ? primaryColor : '#fff', fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer'
                              }}
                            >{color}</button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {selectedVariant && selectedVariant.extra_price > 0 && (
                    <div style={{ fontSize: '0.875rem', color: primaryColor, fontWeight: 600 }}>
                      + ${selectedVariant.extra_price.toLocaleString('es-AR')} por esta variante
                    </div>
                  )}

                  <button
                    onClick={() => addToCart(selectedProductForVariant, selectedVariant)}
                    disabled={!selectedVariant}
                    style={{
                      marginTop: '10px', padding: '14px', borderRadius: '12px',
                      background: primaryColor, border: 'none', color: '#fff',
                      fontWeight: 700, cursor: selectedVariant ? 'pointer' : 'not-allowed',
                      opacity: selectedVariant ? 1 : 0.5
                    }}
                  >
                    Agregar al pedido
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}
