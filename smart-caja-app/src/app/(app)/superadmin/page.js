'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  Shield, 
  Users, 
  Search, 
  Mail, 
  TrendingUp, 
  AlertTriangle, 
  UserMinus, 
  CheckCircle,
  Package,
  Receipt,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from 'lucide-react'

export default function SuperadminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const ADMIN_EMAIL = 'nespinosa.oimpa@gmail.com'

  useEffect(() => {
    if (authLoading || !user || user.email !== ADMIN_EMAIL) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/superadmin')
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Error al obtener datos del servidor')
        }
        const json = await res.json()
        setData(json.data || [])
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authLoading, user])

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (!data.length) return { total: 0, active: 0, inactive: 0, abandoned: 0 }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    let active = 0
    let inactive = 0
    let abandoned = 0

    data.forEach(t => {
      if (t.sales_count === 0) {
        abandoned++
      } else if (t.last_sale_at) {
        const lastSaleDate = new Date(t.last_sale_at)
        if (lastSaleDate >= sevenDaysAgo) {
          active++
        } else if (lastSaleDate < fourteenDaysAgo) {
          inactive++
        }
      }
    })

    return {
      total: data.length,
      active,
      inactive,
      abandoned
    }
  }, [data])

  // Filtered list
  const filteredData = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    return data.filter(t => {
      // 1. Search term match
      const nameMatch = t.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const emailMatch = t.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const slugMatch = t.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSearch = nameMatch || emailMatch || slugMatch

      if (!matchesSearch) return false

      // 2. Plan filter match
      if (planFilter !== 'all' && t.subscription_plan !== planFilter) return false

      // 3. Status filter match
      if (statusFilter !== 'all') {
        const isAbandoned = t.sales_count === 0
        const lastSaleDate = t.last_sale_at ? new Date(t.last_sale_at) : null
        const isActive = lastSaleDate && lastSaleDate >= sevenDaysAgo
        const isInactive = lastSaleDate && lastSaleDate < fourteenDaysAgo
        const isSleeping = lastSaleDate && lastSaleDate >= fourteenDaysAgo && lastSaleDate < sevenDaysAgo

        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && !isInactive) return false
        if (statusFilter === 'abandoned' && !isAbandoned) return false
        if (statusFilter === 'sleeping' && !isSleeping) return false
      }

      return true
    })
  }, [data, searchTerm, planFilter, statusFilter])

  // Auth Protection render
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center', minHeight: '60vh'
      }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-error)' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Acceso Restringido</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.875rem', lineHeight: 1.5 }}>
          Esta sección es exclusiva para el administrador general de Smart Caja. Tu cuenta no cuenta con estos privilegios.
        </p>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        .super-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }
        .super-kpi {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          background: var(--bg-card);
          padding: var(--space-6);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s, border-color 0.2s;
        }
        .super-kpi:hover {
          transform: translateY(-2px);
          border-color: var(--border-highlight);
        }
        .kpi-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; alignItems: center; justifyContent: center;
          flex-shrink: 0;
        }
        .super-table-container {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-top: var(--space-6);
        }
        .super-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .super-table th {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border-color);
          padding: 14px 16px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .super-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 0.875rem;
          vertical-align: middle;
        }
        .super-table tr:last-child td {
          border-bottom: none;
        }
        .super-table tr:hover td {
          background: rgba(255,255,255,0.01);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-active { background: rgba(16, 185, 129, 0.12); color: #10B981; }
        .badge-trial { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
        .badge-suspended { background: rgba(239, 68, 68, 0.12); color: #EF4444; }
        .badge-cancelled { background: rgba(255,255,255,0.06); color: var(--text-muted); }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} style={{ color: '#F59E0B' }} /> Panel Super Admin
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Métricas de retención, uso y crecimiento de Smart Caja en tiempo real
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="super-card-grid">
        <div className="super-kpi">
          <div className="kpi-icon" style={{ background: 'rgba(124, 93, 255, 0.1)', color: 'var(--color-primary)' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Comercios</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{metrics.total}</div>
          </div>
        </div>

        <div className="super-kpi">
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Activos (7d)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{metrics.active}</div>
          </div>
        </div>

        <div className="super-kpi">
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <UserMinus size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Inactivos (+14d)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{metrics.inactive}</div>
          </div>
        </div>

        <div className="super-kpi">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cuentas Abandonadas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{metrics.abandoned}</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search */}
          <div className="form-input-icon" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} className="input-icon" style={{ left: '14px' }} />
            <input 
              className="form-input" 
              placeholder="Buscar por comercio, email o slug..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>

          {/* Plan filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Plan:</span>
            <select 
              className="form-input" 
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              style={{ padding: '8px 12px', width: '130px' }}
            >
              <option value="all">Todos</option>
              <option value="basic">Básico</option>
              <option value="professional">Profesional</option>
              <option value="enterprise">Empresa</option>
            </select>
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Uso:</span>
            <select 
              className="form-input" 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', width: '150px' }}
            >
              <option value="all">Todos</option>
              <option value="active">Activos (Ventas &lt; 7d)</option>
              <option value="sleeping">Durmiendo (7d a 14d)</option>
              <option value="inactive">Inactivos (+14d)</option>
              <option value="abandoned">Abandonados (0 ventas)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-lg)', marginTop: '24px' }}>
          ❌ Error al cargar datos: {error}
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', marginTop: '24px' }}>
          🔍 No se encontraron comercios que coincidan con los filtros.
        </div>
      ) : (
        <div className="super-table-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="super-table">
              <thead>
                <tr>
                  <th>Comercio</th>
                  <th>Contacto</th>
                  <th>Plan y Estado</th>
                  <th>Registro</th>
                  <th style={{ textAlign: 'center' }}>Inventario</th>
                  <th style={{ textAlign: 'center' }}>Ventas</th>
                  <th style={{ textAlign: 'center' }}>Turnos</th>
                  <th>Última Actividad</th>
                  <th style={{ textAlign: 'right' }}>Contacto</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(t => {
                  const subStatus = t.subscription_status || 'trial'
                  const statusBadgeClass = 
                    subStatus === 'active' ? 'badge-active' :
                    subStatus === 'trial' ? 'badge-trial' :
                    subStatus === 'suspended' ? 'badge-suspended' : 'badge-cancelled'

                  const planLabel = 
                    t.subscription_plan === 'basic' ? 'Básico' :
                    t.subscription_plan === 'professional' ? 'Profesional' : 'Empresa'

                  // Check if last sale was very old
                  let isStale = false
                  let lastSaleString = 'Nunca'
                  if (t.last_sale_at) {
                    const lastSaleDate = new Date(t.last_sale_at)
                    lastSaleString = lastSaleDate.toLocaleDateString()
                    const limitDate = new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000)
                    isStale = lastSaleDate < limitDate
                  }

                  return (
                    <tr key={t.id}>
                      {/* Logo and Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '8px', 
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 800, color: '#fff', fontSize: '0.85rem' 
                          }}>
                            {t.name ? t.name.substring(0, 2).toUpperCase() : 'SC'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{t.name}</div>
                            <a 
                              href={`/tienda/${t.slug}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                            >
                              /{t.slug} <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {t.email || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>

                      {/* Plan and Subscription Status */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>{planLabel}</span>
                          <span className={`badge ${statusBadgeClass}`}>
                            {subStatus === 'active' ? 'Activo' : subStatus === 'trial' ? 'Prueba' : subStatus === 'suspended' ? 'Suspendido' : 'Cancelado'}
                          </span>
                        </div>
                      </td>

                      {/* Register Date */}
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Metrics: Inventory */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Package size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 700, color: t.products_count > 0 ? '#fff' : 'var(--text-muted)' }}>
                            {t.products_count}
                          </span>
                        </div>
                      </td>

                      {/* Metrics: Sales */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Receipt size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 700, color: t.sales_count > 0 ? 'var(--color-secondary)' : 'var(--text-muted)' }}>
                            {t.sales_count}
                          </span>
                        </div>
                      </td>

                      {/* Metrics: Shifts */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 700, color: t.shifts_count > 0 ? '#fff' : 'var(--text-muted)' }}>
                            {t.shifts_count}
                          </span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td>
                        <span style={{ 
                          fontWeight: 600, 
                          color: isStale ? 'var(--color-error)' : t.sales_count > 0 ? '#fff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {t.sales_count > 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isStale ? 'var(--color-error)' : '#10B981', display: 'inline-block' }} />}
                          {lastSaleString}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <a 
                          href={`mailto:${t.email}?subject=Contacto Smart Caja - ${encodeURIComponent(t.name)}`}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Enviar correo"
                        >
                          <Mail size={14} />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
