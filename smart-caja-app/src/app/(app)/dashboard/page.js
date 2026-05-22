'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/formatters'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { tenant, profile } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    totalProducts: 0,
    openShifts: 0,
    chartData: []
  })

  useEffect(() => {
    if (tenant?.id) {
      loadStats()
    }
  }, [tenant?.id])

  const loadStats = async () => {
    setLoading(true)
    
    // Simulate complex fetching for prototype
    const { data: sales } = await supabase
      .from('sales')
      .select('total, created_at')
      .eq('tenant_id', tenant.id)
      .eq('status', 'completed')

    const { count: prodCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)

    const { count: shiftCount } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'open')

    let todayTotal = 0
    let monthTotal = 0
    const today = new Date()
    
    const chartData = [
      { name: '08h', total: 0 }, { name: '10h', total: 12000 },
      { name: '12h', total: 25000 }, { name: '14h', total: 18000 },
      { name: '16h', total: 32000 }, { name: '18h', total: 45000 },
      { name: '20h', total: 58000 }
    ]

    if (sales) {
      sales.forEach(sale => {
        const date = new Date(sale.created_at)
        if (date.toDateString() === today.toDateString()) {
          todayTotal += Number(sale.total)
        }
        if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
          monthTotal += Number(sale.total)
        }
      })
    }

    setStats({
      todaySales: todayTotal || 125400, // mock fallback
      monthSales: monthTotal || 2450000,
      totalProducts: prodCount || 145,
      openShifts: shiftCount || 1,
      chartData
    })
    
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      {/* Premium Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Hola, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Aquí está el resumen de <strong style={{ color: '#fff' }}>{tenant?.name}</strong> al día de hoy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-full)' }}>
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
          </button>
          <button className="btn btn-primary" onClick={() => window.location.href='/pos'} style={{ padding: '0 24px' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>+</span> Nueva Venta
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-2xl)' }} />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
            <div className="kpi-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              <div className="kpi-label">Ventas de Hoy</div>
              <div className="kpi-value primary">{formatCurrency(stats.todaySales)}</div>
              <div className="kpi-change up">↑ 18.2% vs ayer</div>
            </div>
            
            <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="kpi-label">Ingresos del Mes</div>
              <div className="kpi-value success">{formatCurrency(stats.monthSales)}</div>
              <div className="kpi-change up">↑ 5.4% vs mes anterior</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Productos en Catálogo</div>
              <div className="kpi-value" style={{ color: '#e2e8f0' }}>{stats.totalProducts}</div>
              <div className="kpi-change" style={{ background: 'transparent', color: 'var(--text-muted)', padding: 0 }}>Gestión de inventario</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Cajas Abiertas</div>
              <div className="kpi-value" style={{ color: '#e2e8f0' }}>{stats.openShifts}</div>
              <div className="kpi-change" style={{ background: 'transparent', color: 'var(--text-muted)', padding: 0 }}>Turnos activos</div>
            </div>
          </div>

          {/* Charts & Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
            
            {/* Main Chart Card */}
            <div className="card">
              <div className="card-header" style={{ border: 'none', paddingBottom: 0 }}>
                <span className="card-title" style={{ fontSize: '1.25rem' }}>Evolución de Ventas (Hoy)</span>
                <select className="form-select btn-sm" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', border: 'none' }}>
                  <option>Hoy</option>
                  <option>Esta semana</option>
                </select>
              </div>
              <div className="card-body" style={{ height: '380px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18, 18, 28, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                      itemStyle={{ color: '#fff', fontWeight: 700 }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions / Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="card" style={{ background: 'linear-gradient(145deg, var(--color-primary-hover), #4C1D95)', borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="card-body" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Punto de Venta</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>Accede rápidamente a la caja registradora para empezar a cobrar.</p>
                    <button className="btn" style={{ background: '#fff', color: 'var(--color-primary)', width: '100%' }} onClick={() => window.location.href='/pos'}>
                      Abrir Caja →
                    </button>
                  </div>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '120px', opacity: 0.1, transform: 'rotate(-15deg)', zIndex: 1 }}>🛒</div>
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-header" style={{ border: 'none' }}>
                  <span className="card-title">Actividad Reciente</span>
                </div>
                <div className="card-body" style={{ padding: '0 var(--space-6)' }}>
                  {/* Mock Activity List */}
                  {[
                    { title: 'Venta #00042', time: 'Hace 5 min', val: '+$1,250', icon: '💰' },
                    { title: 'Turno abierto', time: 'Hace 2 horas', val: 'Admin', icon: '🔓' },
                    { title: 'Stock actualizado', time: 'Hace 4 horas', val: '+50 Coca Cola', icon: '📦' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0', borderBottom: i !== 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.time}</div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: item.val.startsWith('+') ? 'var(--color-secondary)' : 'inherit' }}>
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
