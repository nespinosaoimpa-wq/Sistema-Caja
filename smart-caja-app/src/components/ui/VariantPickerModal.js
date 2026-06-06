'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { getRubroSizes } from '@/lib/config/rubroConfig'

/**
 * VariantPickerModal — Modal para elegir talle y color de un producto con variantes
 * Se usa en el POS cuando el producto tiene variantes de ropa
 */
export default function VariantPickerModal({ isOpen, product, onSelect, onClose }) {
  const { tenant } = useAuth()
  const supabase = createClient()
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)

  const loadVariants = useCallback(async () => {
    if (!product?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('size')
    setVariants(data || [])
    setLoading(false)
  }, [product?.id, supabase])

  useEffect(() => {
    if (isOpen && product?.id) {
      setSelectedSize(null)
      setSelectedColor(null)
      loadVariants()
    }
  }, [isOpen, product?.id, loadVariants])

  // Unique sizes and colors from variants
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  const colorsForSize = selectedSize
    ? [...new Set(variants.filter(v => v.size === selectedSize).map(v => v.color).filter(Boolean))]
    : [...new Set(variants.map(v => v.color).filter(Boolean))]

  const selectedVariant = selectedSize && selectedColor
    ? variants.find(v => v.size === selectedSize && v.color === selectedColor)
    : selectedSize && !colorsForSize.length
      ? variants.find(v => v.size === selectedSize)
      : null

  const handleConfirm = () => {
    if (!selectedVariant) return
    onSelect(product, selectedVariant)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>👕 Seleccioná variante</div>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700 }}>{product?.name}</h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', marginTop: '4px', fontWeight: 600 }}>
              ${(product?.sale_price || 0).toLocaleString('es-AR')}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            Cargando variantes...
          </div>
        ) : variants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
            <div>No hay stock disponible en ninguna variante</div>
          </div>
        ) : (
          <>
            {/* Talles */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  TALLE
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {sizes.map(size => {
                    const sizeVariants = variants.filter(v => v.size === size)
                    const totalStock = sizeVariants.reduce((s, v) => s + Number(v.stock_quantity), 0)
                    const isSelected = selectedSize === size
                    return (
                      <button
                        key={size}
                        onClick={() => { setSelectedSize(size); setSelectedColor(null) }}
                        style={{
                          minWidth: '52px', height: '44px',
                          padding: '0 12px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--color-primary-light)' : 'var(--bg-input)',
                          color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'all 0.15s',
                          position: 'relative',
                        }}
                      >
                        {size}
                        <span style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          background: totalStock <= 2 ? '#EF4444' : 'var(--color-secondary)',
                          color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                          borderRadius: '10px', padding: '1px 5px',
                          lineHeight: 1.4,
                        }}>{totalStock}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Colores */}
            {colorsForSize.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  COLOR
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {colorsForSize.map(color => {
                    const colorVariant = variants.find(v => v.color === color && (!selectedSize || v.size === selectedSize))
                    const isSelected = selectedColor === color
                    const stock = colorVariant?.stock_quantity || 0
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          height: '40px',
                          padding: '0 14px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--color-primary-light)' : 'var(--bg-input)',
                          color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          transition: 'all 0.15s',
                        }}
                      >
                        {colorVariant?.color_hex && (
                          <span style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: colorVariant.color_hex,
                            border: '1px solid rgba(255,255,255,0.2)',
                            flexShrink: 0,
                          }} />
                        )}
                        {color}
                        {stock <= 2 && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>({stock})</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Resumen de selección */}
            {selectedVariant && (
              <div style={{
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {[selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Stock disponible: {selectedVariant.stock_quantity}
                    {selectedVariant.extra_price > 0 && ` · +$${selectedVariant.extra_price.toLocaleString('es-AR')}`}
                  </div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  ${(Number(product?.sale_price || 0) + Number(selectedVariant.extra_price || 0)).toLocaleString('es-AR')}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary"
                disabled={!selectedVariant}
                style={{ flex: 2, justifyContent: 'center', opacity: selectedVariant ? 1 : 0.4 }}
              >
                Agregar al carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
