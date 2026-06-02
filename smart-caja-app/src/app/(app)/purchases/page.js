'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

export default function PurchasesPage() {
  const { tenant } = useAuth()
  const [search, setSearch] = useState('')
  const [purchases, setPurchases] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    provider: '',
    date: new Date().toISOString().split('T')[0],
    itemsCount: '1',
    total: '',
    status: 'Pagado'
  })

  const isGated = tenant?.subscription_plan !== 'enterprise'
  const cacheKey = tenant?.id ? `smartcaja_purchases_${tenant.id}` : null

  // Load from localStorage on mount
  useEffect(() => {
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          const timer = setTimeout(() => {
            setPurchases(parsed)
          }, 0)
          return () => clearTimeout(timer)
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [cacheKey])

  // Helper to save to state and localStorage
  const savePurchasesList = (list) => {
    setPurchases(list)
    if (cacheKey) {
      localStorage.setItem(cacheKey, JSON.stringify(list))
    }
  }

  const handleRegisterPayment = (id) => {
    const updated = purchases.map(p => 
      p.id === id ? { ...p, status: 'Pagado' } : p
    )
    savePurchasesList(updated)
  }

  const handleDeletePurchase = (id) => {
    if (confirm('¿Estás seguro de que querés eliminar esta orden de compra?')) {
      const updated = purchases.filter(p => p.id !== id)
      savePurchasesList(updated)
    }
  }

  const handleOpenModal = () => {
    setForm({
      provider: '',
      date: new Date().toISOString().split('T')[0],
      itemsCount: '1',
      total: '',
      status: 'Pagado'
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.provider.trim()) return
    const totalNum = parseFloat(form.total) || 0
    const itemsCountNum = parseInt(form.itemsCount) || 1

    const newPurchase = {
      id: Date.now(),
      provider: form.provider.trim(),
      date: form.date,
      itemsCount: itemsCountNum,
      total: totalNum,
      status: form.status
    }

    const updated = [newPurchase, ...purchases]
    savePurchasesList(updated)
    setShowModal(false)
  }

  const filteredPurchases = purchases.filter(p => 
    p.provider.toLowerCase().includes(search.toLowerCase())
  )

  if (isGated) {
    return (
      <UpgradePrompt 
        title="Control de Compras y Proveedores"
        description="Registra la entrada de mercadería, controla las cuentas corrientes con tus proveedores y optimiza tus costos de reposición."
        requiredPlan="enterprise"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
            Compras y Proveedores
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Registrá la entrada de mercadería y controlá las cuentas de tus proveedores de forma centralizada
          </p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="btn btn-secondary" 
          style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🛒 Nueva Orden de Compra
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Proveedores Activos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{Array.from(new Set(purchases.map(p => p.provider))).length}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Facturas Pendientes</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-tertiary)' }}>
            {purchases.filter(p => p.status === 'Pendiente').length}
          </div>
        </div>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Invertido (Mes)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
            ${purchases.reduce((acc, p) => acc + p.total, 0).toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <input 
            className="form-input" 
            placeholder="🔎 Buscar orden de compra por proveedor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Proveedor</th>
                <th style={{ padding: '12px 16px' }}>Fecha</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Artículos</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Compra</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((pur) => (
                <tr key={pur.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{pur.provider}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{pur.date}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#fff' }}>{pur.itemsCount}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${pur.total.toLocaleString('es-AR')}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span className={`badge ${pur.status === 'Pagado' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                      {pur.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {pur.status === 'Pendiente' && (
                      <button 
                        onClick={() => handleRegisterPayment(pur.id)}
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: '6px 12px', marginRight: '8px' }}
                      >
                        💰 Registrar Pago
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeletePurchase(pur.id)}
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--color-error)', borderColor: 'rgba(255,180,171,0.2)' }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron órdenes de compra registradas. ¡Agregá una con el botón de arriba!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '440px', padding: 'var(--space-6)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)', background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>🛒 Nueva Orden de Compra</h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ fontSize: '1.25rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label className="form-label required">Proveedor</label>
                <input 
                  className="form-input" 
                  placeholder="Ej: Distribuidora Arcor"
                  value={form.provider}
                  onChange={e => setForm({...form, provider: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="form-label required">Fecha de Compra</label>
                <input 
                  className="form-input" 
                  type="date"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label required">Artículos</label>
                  <input 
                    className="form-input" 
                    type="number"
                    min="1"
                    value={form.itemsCount}
                    onChange={e => setForm({...form, itemsCount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label required">Total ($)</label>
                  <input 
                    className="form-input" 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.total}
                    onChange={e => setForm({...form, total: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label required">Estado</label>
                <select 
                  className="form-select"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente (Cuenta Corriente)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-ghost" 
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--color-secondary)' }}
                >
                  Guardar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
