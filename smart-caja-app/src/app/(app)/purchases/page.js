'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

const MOCK_PURCHASES = [
  { id: 1, provider: 'Distribuidora Arcor', itemsCount: 14, total: 45000, date: '2026-05-24', status: 'Pagado' },
  { id: 2, provider: 'Coca-Cola FEMSA', itemsCount: 8, total: 32000, date: '2026-05-26', status: 'Pendiente' },
  { id: 3, provider: 'Cervecería Quilmes', itemsCount: 22, total: 87400, date: '2026-05-27', status: 'Pagado' },
  { id: 4, provider: 'Lácteos La Serenísima', itemsCount: 6, total: 18900, date: '2026-05-28', status: 'Pendiente' },
  { id: 5, provider: 'Papelera San Andrés', itemsCount: 12, total: 12500, date: '2026-05-22', status: 'Pagado' },
]

export default function PurchasesPage() {
  const { tenant } = useAuth()
  const [search, setSearch] = useState('')
  const [purchases, setPurchases] = useState(MOCK_PURCHASES)

  const isGated = tenant?.subscription_plan !== 'enterprise'

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
      <div style={{ display: 'flex', justifyInContent: 'space-between', alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
            Compras y Proveedores
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Registrá la entrada de mercadería y controlá las cuentas de tus proveedores de forma centralizada
          </p>
        </div>
        <button className="btn btn-secondary" style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', background: 'var(--color-secondary)' }}>
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
                    <button className="btn btn-ghost btn-sm" style={{ marginRight: '8px' }}>👁️ Detalle</button>
                    {pur.status === 'Pendiente' && (
                      <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>💰 Registrar Pago</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron órdenes de compra registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
